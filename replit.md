# Our Empire Admin Panel

A complete Satta Matka betting platform operator dashboard — admin panel for managing users, markets, bets, deposits, withdrawals, results, and notifications.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, serves at `/api`)
- `pnpm --filter @workspace/admin-panel run dev` — run the admin panel (port 20130, serves at `/admin/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `JWT_SECRET` — JWT signing secret (auto-set by Replit)
- Optional env: `ADMIN_DEFAULT_PASSWORD` — default admin password (default: `admin123`)
- Optional env: `SESSION_SECRET` — session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Admin UI: React + Vite + Tailwind + shadcn/ui

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI source of truth
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validation schemas
- `lib/db/src/schema/` — Drizzle ORM schema (users, markets, bets, transactions, results, etc.)
- `artifacts/api-server/src/routes/` — all Express route handlers
- `artifacts/admin-panel/src/pages/` — all admin UI pages
- `artifacts/admin-panel/src/components/Layout.tsx` — sidebar nav

## Architecture decisions

- Contract-first API: OpenAPI spec defines all routes; code is generated from it
- JWT-based admin auth: `signAdminToken` in `lib/jwt.ts`; token stored in `localStorage` as `adminToken`
- `setAuthTokenGetter` from `@workspace/api-client-react` injects Bearer token into all generated hook fetches
- Admin login auto-creates the `admin` record on first successful login
- All monetary amounts stored as `numeric(12,2)` strings in DB to avoid floating-point errors

## Product

- **Login** — admin username/password → JWT issued
- **Dashboard** — key stats: total users, bets today, pending deposits/withdrawals, active markets, revenue
- **Users** — searchable list, block/unblock, balance adjustment with reason, user detail page
- **Markets** — CRUD for Satta markets (open/close time, min/max bet, status)
- **Results** — declare open/close/jodi results per market per date
- **Deposits** — approve or reject pending UPI deposits
- **Withdrawals** — complete or reject pending withdrawal requests
- **Bets** — list all bets + analytics (top numbers, total amount per type)
- **Analytics** — revenue/deposit/withdrawal charts over 7/30/365 days
- **Settings** — app name, WhatsApp, Telegram, maintenance mode, UPI IDs, financial limits
- **Notifications** — broadcast push messages to all users or specific user IDs

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` before typechecking leaf packages — the DB and API libs must be built first
- Generated hooks use `customFetch` (native fetch wrapper), not axios — configure auth via `setAuthTokenGetter`
- Admin password defaults to `admin123`; set `ADMIN_DEFAULT_PASSWORD` env var to change it
- `recharts` is pre-installed in the admin panel for charts

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
