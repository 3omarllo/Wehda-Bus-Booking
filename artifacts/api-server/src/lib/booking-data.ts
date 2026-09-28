import { and, eq, or } from "drizzle-orm";
import { db, bookingsTable, tripsTable, type Booking, type Trip } from "@workspace/db";
import { GetBookingResponse, GetTripSeatsResponse, ListStaffBookingsResponseItem, ListTripsResponseItem } from "@workspace/api-zod";

const stations = {
  cairo: "محطة عبود - القاهرة",
  alexandria: "محطة سيدي جابر - الإسكندرية",
};

export async function seedBookingData(): Promise<void> {
  const existing = await db.select({ id: tripsTable.id }).from(tripsTable).limit(1);
  if (existing.length > 0) return;

  const now = new Date();
  const tripRows = Array.from({ length: 10 }, (_, index) => {
    const departure = new Date(now);
    departure.setHours(7 + index * 2, index % 2 === 0 ? 0 : 30, 0, 0);
    const arrival = new Date(departure.getTime() + 150 * 60 * 1000);
    const cairoToAlex = index % 2 === 0;
    return {
      fromCity: cairoToAlex ? "القاهرة" : "الإسكندرية",
      toCity: cairoToAlex ? "الإسكندرية" : "القاهرة",
      fromStation: cairoToAlex ? stations.cairo : stations.alexandria,
      toStation: cairoToAlex ? stations.alexandria : stations.cairo,
      departureAt: departure,
      arrivalAt: arrival,
      durationMinutes: 150,
      busType: index % 3 === 0 ? "VIP" : "Standard",
      price: index % 3 === 0 ? 185 : 145,
      totalSeats: 44,
      amenities: index % 3 === 0 ? ["AC", "WiFi", "USB", "TV"] : ["AC", "USB"],
      status: "available",
    };
  });

  const createdTrips = await db.insert(tripsTable).values(tripRows).returning();
  const demoTrips = createdTrips.slice(0, 3);
  await db.insert(bookingsTable).values([
    {
      reference: "WH-482915",
      tripId: demoTrips[0].id,
      status: "confirmed",
      paymentStatus: "approved",
      totalAmount: 370,
      pickupFee: 0,
      pickupType: "المحطة الرئيسية",
      pickupPoint: "محطة عبود",
      customerName: "أحمد محمد",
      customerPhone: "01012345678",
      passengerSeats: [3, 4],
      passengerNames: ["أحمد محمد", "سارة محمد"],
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      paymentMethod: "instapay",
      transactionRef: "IP-78415",
      senderPhone: "01012345678",
    },
    {
      reference: "WH-483102",
      tripId: demoTrips[1].id,
      status: "pending_payment_review",
      paymentStatus: "pending",
      totalAmount: 145,
      pickupFee: 0,
      pickupType: "من المحطة الرئيسية",
      pickupPoint: "محطة سيدي جابر",
      customerName: "مريم علي",
      customerPhone: "01123456789",
      passengerSeats: [8],
      passengerNames: ["مريم علي"],
      expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      paymentMethod: "vodafone_cash",
      transactionRef: "VF-99182",
      senderPhone: "01123456789",
    },
  ]);
}

export async function loadTrips(filters?: { from?: string; to?: string }): Promise<Trip[]> {
  const conditions = [];
  const from = filters?.from === "Cairo" ? "القاهرة" : filters?.from === "Alexandria" ? "الإسكندرية" : filters?.from;
  const to = filters?.to === "Cairo" ? "القاهرة" : filters?.to === "Alexandria" ? "الإسكندرية" : filters?.to;
  if (from) conditions.push(eq(tripsTable.fromCity, from));
  if (to) conditions.push(eq(tripsTable.toCity, to));
  return db.select().from(tripsTable).where(conditions.length ? and(...conditions) : undefined).orderBy(tripsTable.departureAt);
}

export async function loadTrip(tripId: number): Promise<Trip | undefined> {
  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId)).limit(1);
  return trip;
}

export async function loadBooking(bookingId: number): Promise<Booking | undefined> {
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  return booking;
}

export async function loadBookingByReference(reference: string): Promise<Booking | undefined> {
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.reference, reference)).limit(1);
  return booking;
}

export async function activeBookingsForTrip(tripId: number): Promise<Booking[]> {
  return db
    .select()
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.tripId, tripId),
        or(eq(bookingsTable.status, "locked"), eq(bookingsTable.status, "pending_payment_review"), eq(bookingsTable.status, "confirmed")),
      ),
    );
}

export function tripToApi(trip: Trip, seatsLeft: number) {
  return ListTripsResponseItem.parse({
    id: trip.id,
    from: trip.fromCity,
    to: trip.toCity,
    fromStation: trip.fromStation,
    toStation: trip.toStation,
    departure: trip.departureAt.toISOString(),
    arrival: trip.arrivalAt.toISOString(),
    duration: `${Math.floor(trip.durationMinutes / 60)}س ${trip.durationMinutes % 60}د`,
    busType: trip.busType,
    price: trip.price,
    seatsLeft,
    totalSeats: trip.totalSeats,
    status: seatsLeft === 0 ? "full" : seatsLeft <= 5 ? "last_seats" : "available",
    amenities: trip.amenities,
  });
}

export async function tripWithSeats(trip: Trip) {
  const bookings = await activeBookingsForTrip(trip.id);
  const booked = new Map<number, { state: "booked" | "held"; name: string | null }>();
  for (const booking of bookings) {
    const state = booking.status === "confirmed" ? "booked" : "held";
    booking.passengerSeats.forEach((seat, index) => {
      booked.set(seat, { state, name: booking.passengerNames[index] ?? null });
    });
  }
  const seats = Array.from({ length: trip.totalSeats }, (_, index) => {
    const number = index + 1;
    const current = booked.get(number);
    return { number, state: current?.state ?? "available", passengerName: current?.name ?? null };
  });
  return GetTripSeatsResponse.parse({ tripId: trip.id, rows: Math.ceil(trip.totalSeats / 4), seats });
}

export async function bookingToApi(booking: Booking) {
  const trip = await loadTrip(booking.tripId);
  if (!trip) throw new Error("Trip not found");
  const active = await activeBookingsForTrip(trip.id);
  const usedSeats = active.reduce((sum, current) => sum + current.passengerSeats.length, 0);
  const tripApi = tripToApi(trip, trip.totalSeats - usedSeats);
  return GetBookingResponse.parse({
    id: booking.id,
    reference: booking.reference,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    total: booking.totalAmount,
    pickupFee: booking.pickupFee,
    pickupType: booking.pickupType,
    createdAt: booking.createdAt.toISOString(),
    expiresAt: booking.expiresAt.toISOString(),
    seats: booking.passengerSeats,
    trip: tripApi,
    customer: { name: booking.customerName, phone: booking.customerPhone },
    passengers: booking.passengerNames.map((name, index) => ({ name, seat: booking.passengerSeats[index] })),
  });
}

export async function staffBookingToApi(booking: Booking) {
  return ListStaffBookingsResponseItem.parse(await bookingToApi(booking));
}

export async function availableSeats(tripId: number): Promise<number[]> {
  const trip = await loadTrip(tripId);
  if (!trip) return [];
  const active = await activeBookingsForTrip(tripId);
  const used = new Set(active.flatMap((booking) => booking.passengerSeats));
  return Array.from({ length: trip.totalSeats }, (_, index) => index + 1).filter((seat) => !used.has(seat));
}