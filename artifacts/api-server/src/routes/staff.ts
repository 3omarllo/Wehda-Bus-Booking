import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, bookingsTable, tripsTable } from "@workspace/db";
import {
  GetStaffDashboardResponse,
  ListStaffBookingsResponse,
} from "@workspace/api-zod";
import { activeBookingsForTrip, staffBookingToApi } from "../lib/booking-data";

const router: IRouter = Router();

router.get("/staff/dashboard", async (_req, res): Promise<void> => {
  const trips = await db.select().from(tripsTable).orderBy(tripsTable.departureAt);
  const bookings = await db.select().from(bookingsTable).orderBy(desc(bookingsTable.createdAt));
  const pendingPayments = bookings.filter((booking) => booking.paymentStatus === "pending").length;
  const freeSeats = await Promise.all(
    trips.slice(0, 5).map(async (trip) => {
      const active = await activeBookingsForTrip(trip.id);
      return trip.totalSeats - active.reduce((sum, booking) => sum + booking.passengerSeats.length, 0);
    }),
  );
  const response = {
    todayTrips: trips.length,
    newBookings: bookings.filter((booking) => booking.status === "locked").length,
    pendingPayments,
    pendingPickups: 2,
    freeSeats: freeSeats.reduce((sum, value) => sum + value, 0),
    todayRevenue: bookings.filter((booking) => booking.paymentStatus === "approved").reduce((sum, booking) => sum + booking.totalAmount, 0),
    attention: [
      { title: pendingPayments ? `${pendingPayments} دفعات في انتظار المراجعة` : "لا توجد دفعات معلقة", subtitle: "راجعي الإثباتات الأقدم أولاً", tone: pendingPayments ? "warning" : "success" },
      { title: "طلبا نقطة ركوب مخصصة", subtitle: "تحتاج موافقة المشرف", tone: "info" },
      { title: "رحلة 18:30 اقترب موعدها", subtitle: "الإشغال 84% · 7 مقاعد متاحة", tone: "orange" },
    ],
    revenue: [1200, 1680, 1420, 2100, 1840, 2650, 2380].map((value, index) => ({ label: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"][index], value })),
  };
  res.json(GetStaffDashboardResponse.parse(response));
});

export default router;