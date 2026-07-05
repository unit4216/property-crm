# Property CRM

[![CI](https://github.com/unit4216/property-crm/actions/workflows/ci.yml/badge.svg)](https://github.com/unit4216/property-crm/actions/workflows/ci.yml)

A mini property-management CRM. Full CRUD for **properties**, **tenants**,
**units**, and **leases**, plus a portfolio **dashboard** with occupancy stats
and charts.

Built as a portfolio project with a production-minded stack:

- **Next.js 16** (App Router, Server Actions) + **React 19**
- **TypeScript**
- **Drizzle ORM** + **postgres.js** over plain Postgres
- **Zod** for server-side validation
- **MUI** (Material UI + MUI X Charts) with **Tailwind CSS v4** for layout
- **Vitest** (unit) + **Playwright** (end-to-end), gated in CI

## Architecture notes

The app talks to Postgres directly via a `DATABASE_URL` connection string, so
the exact same code runs against **local Postgres** in development and
**Supabase's hosted Postgres** in production — you only swap the env var. No
separate local Supabase stack (and therefore no Docker) is required.

- Reads happen in Server Components (`src/db/queries.ts`).
- Writes happen in per-entity Server Actions (e.g.
  `src/app/properties/actions.ts`, `src/app/tenants/actions.ts`), validated with
  shared Zod schemas (`src/lib/validation.ts`) and revalidated with
  `revalidatePath`.
- No login: each visitor is assigned an **anonymous session** (cookie-backed,
  `src/lib/session.ts`) and demo data is seeded lazily for them, so the app is
  usable from a cold start with no auth or fixtures.

## Getting started (local)

Requires **Node 24** (see `.nvmrc`) and a local Postgres instance.

```bash
# 1. Install deps
npm install

# 2. Configure the database URL
cp .env.example .env.local
#   then edit DATABASE_URL to point at your local Postgres

# 3. Create the database (once)
createdb property_crm

# 4. Apply the schema
npm run db:migrate

# 5. (optional) Load sample data
npm run db:seed

# 6. Run
npm run dev
```

Open http://localhost:3000.

## Scripts

| Script                 | What it does                          |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Start the dev server                  |
| `npm run build`        | Production build                      |
| `npm test`             | Run the Vitest unit suite             |
| `npm run test:watch`   | Vitest in watch mode                  |
| `npm run test:coverage`| Vitest with an Istanbul coverage report |
| `npm run test:e2e`     | Run the Playwright end-to-end suite   |
| `npm run db:generate`  | Generate a migration from `schema.ts` |
| `npm run db:migrate`   | Apply pending migrations              |
| `npm run db:push`      | Push schema directly (prototyping)    |
| `npm run db:studio`    | Open Drizzle Studio                   |
| `npm run db:seed`      | Reset + load sample data              |

## Testing

Two layers, both runnable from a clean checkout after `npm install`:

- **Unit tests — [Vitest](https://vitest.dev).** Cover the pure logic in
  `src/lib` (lease-status derivation, table-param parsing, occupancy math,
  formatting, and the Zod validation schemas). Tests are colocated as
  `src/**/*.test.ts` and need no database. Run with `npm test`.
- **End-to-end tests — [Playwright](https://playwright.dev).** Live in `e2e/`
  and drive the real app in Chromium. The config boots `npm run dev` for you, so
  they need a running Postgres (the same `DATABASE_URL` as dev) — each visitor
  gets an anonymous session with demo data seeded automatically, so there's no
  login or fixture setup. First run: `npx playwright install chromium`. Then
  `npm run test:e2e`.

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push to
`main` and every pull request, using the Node version pinned in `.nvmrc`:

- **Lint & unit tests** — `npm ci` → `npm run lint` → `npm test`.
- **End-to-end tests** — spins up a Postgres service, applies migrations, then
  runs the Playwright suite.

Both checks are required to pass before a PR can merge (enforced via a branch
ruleset), so a red test suite blocks the merge.

## Deploying with Supabase

1. Create a Supabase project.
2. In **Project Settings → Database**, copy the connection string (use the
   Transaction pooler URI on port `6543` for serverless/Vercel).
3. Set `DATABASE_URL` to that string in your host's environment variables.
4. Run migrations against it: `DATABASE_URL=... npm run db:migrate`.

## Project structure

```
src/
  app/
    page.tsx                      # Dashboard (home): stats + charts
    properties/                   # list, new, [id] detail, [id]/edit,
      actions.ts                  #   [id]/lease/new — plus create/update/delete actions
    tenants/                      # list, new, [id] detail, [id]/edit
      actions.ts                  #   create/update/delete actions
    leases/                       # list + [id] detail
  db/
    schema.ts                     # Drizzle schema (properties, tenants, units, leases, sessions)
    index.ts                      # db client
    queries.ts                    # read queries
    maintenance.ts                # per-session demo-data lifecycle
    seed.ts / seed-data.ts        # sample data
  lib/
    validation.ts                 # Zod schemas + enum labels
    session.ts                    # anonymous session handling
    lease-status.ts               # lease-state derivation
    occupancy.ts                  # occupancy math
    format.ts                     # display formatting helpers
    table-params.ts               # list search / filter / pagination params
  components/                     # sidebar, data table, charts, dialogs, badges, …
```

## Roadmap

Work orders, payments, and real authentication (Supabase Auth + RLS) to replace
the anonymous-session model.
