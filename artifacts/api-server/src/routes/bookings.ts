import { Router, type IRouter } from "express";
import { and, eq, ilike, or } from "drizzle-orm";
import { db, bookingsTable } from "@workspace/db";
import {
  GetBookingParams,
  GetBookingResponse,
  GetTripSeatsParams,
  GetTripSeatsResponse,
  HoldBookingBody,
  HoldBookingResponse,
  ListStaffBookingsQueryParams,
  ListStaffBookingsResponse,
  ListTripsQueryParams,
  ListTripsResponse,
  ReviewBookingPaymentBody,
  ReviewBookingPaymentParams,
  ReviewBookingPaymentResponse,
  SubmitPaymentBody,
  SubmitPaymentParams,
  SubmitPaymentResponse,
} from "@workspace/api-zod";
import {
  activeBookingsForTrip,
  availableSeats,
  bookingToApi,
  loadBooking,
  loadBookingByReference,
  loadTrip,
  staffBookingToApi,
  tripToApi,
  tripWithSeats,
  loadTrips,
} from "../lib/booking-data";

const router: IRouter = Router();

router.get("/trips", async (req, res): Promise<void> => {
  const parsed = ListTripsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const trips = await loadTrips({ from: parsed.data.from, to: parsed.data.to });
  const response = await Promise.all(
    trips.map(async (trip) => {
      const active = await activeBookingsForTrip(trip.id);
      return tripToApi(trip, trip.totalSeats - active.reduce((sum, booking) => sum + booking.passengerSeats.length, 0));
    }),
  );
  res.json(ListTripsResponse.parse(response));
});

router.get("/trips/:tripId/seats", async (req, res): Promise<void> => {
  const parsed = GetTripSeatsParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const trip = await loadTrip(parsed.data.tripId);
  if (!trip) {
    res.status(404).json({ error: "الرحلة غير موجودة" });
    return;
  }
  res.json(GetTripSeatsResponse.parse(await tripWithSeats(trip)));
});

router.post("/bookings/hold", async (req, res): Promise<void> => {
  const parsed = HoldBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "راجعي البيانات المدخلة وحاولي مرة أخرى" });
    return;
  }
  const trip = await loadTrip(parsed.data.tripId);
  if (!trip || trip.departureAt.getTime() <= Date.now()) {
    res.status(400).json({ error: "الرحلة غير متاحة للحجز" });
    return;
  }
  const free = await availableSeats(trip.id);
  if (parsed.data.seats.some((seat) => !free.includes(seat))) {
    res.status(409).json({ error: "أحد المقاعد تم حجزه للتو. اختاري مقاعد أخرى" });
    return;
  }
  const pickupFee = parsed.data.pickupType === "custom" ? 30 : parsed.data.pickupType === "road" ? 15 : 0;
  const [created] = await db.insert(bookingsTable).values({
    reference: `WH-${Math.floor(100000 + Math.random() * 899999)}`,
    tripId: trip.id,
    status: "locked",
    paymentStatus: "unpaid",
    totalAmount: trip.price * parsed.data.seats.length + pickupFee,
    pickupFee,
    pickupType: parsed.data.pickupType,
    pickupPoint: parsed.data.pickupPoint ?? null,
    customerName: parsed.data.passengerName,
    customerPhone: parsed.data.passengerPhone,
    passengerSeats: parsed.data.seats,
    passengerNames: parsed.data.seats.map(() => parsed.data.passengerName),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  }).returning();
  res.status(201).json(HoldBookingResponse.parse(await bookingToApi(created)));
});

router.post("/bookings/:bookingId/payment", async (req, res): Promise<void> => {
  const params = SubmitPaymentParams.safeParse(req.params);
  const body = SubmitPaymentBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "أكملي بيانات التحويل" });
    return;
  }
  const [updated] = await db.update(bookingsTable).set({
    status: "pending_payment_review",
    paymentStatus: "pending",
    paymentMethod: body.data.method,
    transactionRef: body.data.transactionRef,
    senderPhone: body.data.senderPhone,
  }).where(eq(bookingsTable.id, params.data.bookingId)).returning();
  if (!updated) {
    res.status(404).json({ error: "الحجز غير موجود" });
    return;
  }
  res.json(SubmitPaymentResponse.parse(await bookingToApi(updated)));
});

router.get("/bookings/:reference", async (req, res): Promise<void> => {
  const parsed = GetBookingParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const booking = await loadBookingByReference(parsed.data.reference);
  if (!booking) {
    res.status(404).json({ error: "التذكرة غير موجودة" });
    return;
  }
  res.json(GetBookingResponse.parse(await bookingToApi(booking)));
});

router.get("/staff/bookings", async (req, res): Promise<void> => {
  const parsed = ListStaffBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const where = parsed.data.search
    ? or(ilike(bookingsTable.reference, `%${parsed.data.search}%`), ilike(bookingsTable.customerName, `%${parsed.data.search}%`), ilike(bookingsTable.customerPhone, `%${parsed.data.search}%`))
    : undefined;
  const statusFilter = parsed.data.status ? eq(bookingsTable.status, parsed.data.status) : undefined;
  const bookings = await db.select().from(bookingsTable).where(where && statusFilter ? and(where, statusFilter) : where ?? statusFilter);
  res.json(ListStaffBookingsResponse.parse(await Promise.all(bookings.map(staffBookingToApi))));
});

router.post("/staff/bookings/:bookingId/review", async (req, res): Promise<void> => {
  const params = ReviewBookingPaymentParams.safeParse(req.params);
  const body = ReviewBookingPaymentBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "بيانات المراجعة غير صحيحة" });
    return;
  }
  const [updated] = await db.update(bookingsTable).set({
    status: body.data.decision === "approve" ? "confirmed" : "rejected",
    paymentStatus: body.data.decision === "approve" ? "approved" : "rejected",
  }).where(eq(bookingsTable.id, params.data.bookingId)).returning();
  if (!updated) {
    res.status(404).json({ error: "الحجز غير موجود" });
    return;
  }
  res.json(ReviewBookingPaymentResponse.parse(await bookingToApi(updated)));
});

export default router;