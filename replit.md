# Wehda Bus Booking

Arabic RTL bus booking for affordable intercity trips between Cairo and Alexandria, with customer booking and staff operations screens.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live
- `artifacts/wehda-bus-booking/src/App.tsx` — customer and staff routes plus booking interactions.
- `artifacts/wehda-bus-booking/src/index.css` — brand theme, responsive layout, Arabic typography, and seat states.
- `artifacts/api-server/src/routes/` — trips, seat map, booking, payment review, and dashboard endpoints.
- `artifacts/api-server/src/lib/booking-data.ts` — seeded demo data and API response mapping.
- `lib/db/src/schema/booking.ts` — PostgreSQL schema for trips and bookings.
- `lib/api-spec/openapi.yaml` — source of truth for generated API hooks and Zod validation.

## Architecture decisions
- The uploaded logo is bundled unchanged and used as the visual anchor for the customer and staff surfaces.
- The first release uses manual Vodafone Cash/InstaPay review while keeping payment state behind typed API endpoints.
- Seat state is calculated from active booking rows so the customer map and staff operations screens share one source of truth.

## Product
Customers can search Cairo/Alexandria trips, view live seat states, hold seats, enter pickup and passenger details, submit a manual payment reference, and receive a boarding-pass ticket. Staff can view dashboard metrics, booking queues, payment review actions, and the daily trips board.

## User preferences
The whole customer interface is Arabic and RTL. Keep the orange / sky-blue / ink palette and logo-led sticker feel when extending the app.

## Gotchas
- `pnpm --filter @workspace/wehda-bus-booking run build` needs `PORT` and `BASE_PATH` when run outside the managed workflow.
- After changing the OpenAPI contract, run `pnpm --filter @workspace/api-spec run codegen` before typechecking the API or frontend.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
