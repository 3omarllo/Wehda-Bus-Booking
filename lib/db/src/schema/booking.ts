import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const tripsTable = pgTable("trips", {
  id: serial("id").primaryKey(),
  fromCity: text("from_city").notNull(),
  toCity: text("to_city").notNull(),
  fromStation: text("from_station").notNull(),
  toStation: text("to_station").notNull(),
  departureAt: timestamp("departure_at", { withTimezone: true }).notNull(),
  arrivalAt: timestamp("arrival_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  busType: text("bus_type").notNull(),
  price: integer("price").notNull(),
  totalSeats: integer("total_seats").notNull().default(44),
  amenities: text("amenities").array().notNull().default([]),
  status: text("status").notNull().default("available"),
});

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  tripId: integer("trip_id").notNull().references(() => tripsTable.id),
  status: text("status").notNull().default("locked"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  totalAmount: integer("total_amount").notNull(),
  pickupFee: integer("pickup_fee").notNull().default(0),
  pickupType: text("pickup_type").notNull(),
  pickupPoint: text("pickup_point"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  passengerSeats: integer("passenger_seats").array().notNull(),
  passengerNames: text("passenger_names").array().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paymentMethod: text("payment_method"),
  transactionRef: text("transaction_ref"),
  senderPhone: text("sender_phone"),
});

export const insertTripSchema = createInsertSchema(tripsTable).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;
export type Booking = typeof bookingsTable.$inferSelect;