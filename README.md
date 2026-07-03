# Property CRM

A mini property-management CRM. MVP scope: full CRUD for **properties**.

Built as a portfolio project with a production-minded stack:

- **Next.js 16** (App Router, Server Actions) + **React 19**
- **TypeScript**
- **Drizzle ORM** + **postgres.js** over plain Postgres
- **Zod** for server-side validation
- **Tailwind CSS v4**

## Architecture notes

The app talks to Postgres directly via a `DATABASE_URL` connection string, so
the exact same code runs against **local Postgres** in development and
**Supabase's hosted Postgres** in production — you only swap the env var. No
separate local Supabase stack (and therefore no Docker) is required.

- Reads happen in Server Components (`src/db/queries.ts`).
- Writes happen in Server Actions (`src/app/properties/actions.ts`), validated
  with a shared Zod schema (`src/lib/validation.ts`) and revalidated with
  `revalidatePath`.

## Getting started (local)

Requires Node 20+ and a local Postgres instance.

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

| Script                | What it does                            |
| --------------------- | --------------------------------------- |
| `npm run dev`         | Start the dev server                    |
| `npm run build`       | Production build                        |
| `npm run db:generate` | Generate a migration from `schema.ts`   |
| `npm run db:migrate`  | Apply pending migrations                |
| `npm run db:push`     | Push schema directly (prototyping)      |
| `npm run db:studio`   | Open Drizzle Studio                     |
| `npm run db:seed`     | Reset + load sample properties          |

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
    page.tsx                      # Properties list (home)
    properties/
      actions.ts                  # create / update / delete Server Actions
      property-form.tsx           # shared create/edit form (client)
      delete-button.tsx           # delete w/ confirm (client)
      new/page.tsx                # create
      [id]/page.tsx               # detail
      [id]/edit/page.tsx          # edit
  db/
    schema.ts                     # Drizzle schema (single `properties` table)
    index.ts                      # db client
    queries.ts                    # read queries
    seed.ts                       # sample data
  lib/
    validation.ts                 # Zod schema + enum labels
    format.ts                     # display formatting helpers
  components/
    badge.tsx                     # status badge
```

## Roadmap (beyond MVP)

Tenants, leases, units, work orders, payments, and auth (Supabase Auth + RLS).
