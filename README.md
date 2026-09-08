# MoveSpeedia MVP

A moving marketplace: customers build an inventory, receive pricing, compare
carriers, and book a move online. Carriers maintain their own availability and
service areas. An admin dashboard operates the marketplace without a developer.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Database / auth / storage | Supabase (Postgres, Auth, RLS, Storage) |
| Internationalization | next-intl (English + Spanish) |
| Payments | Stripe (payments milestone) |
| Hosting | DigitalOcean App Platform |

Chosen for maintainability: everything is standard, widely documented, and
hirable-for. No custom framework, no bespoke build tooling.

## Local setup

Requires Node 20+, pnpm, Docker Desktop, and the Supabase CLI.

```bash
pnpm install
pnpm db:start      # starts local Postgres/Auth/Storage in Docker
cp .env.example .env.local   # fill in values printed by `pnpm db:start`
pnpm dev
```

The app runs at http://localhost:3000 and redirects to `/en`.

> This project's local Supabase ports are remapped (API 54331, DB 54332,
> Studio 54333) so it can run alongside other Supabase projects.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm db:start` / `pnpm db:stop` | Local Supabase stack |
| `pnpm db:reset` | Drop, re-run all migrations, re-seed |
| `pnpm seed:build` | Regenerate `supabase/seed.sql` from `seed/` |
| `pnpm types:gen` | Regenerate TypeScript types from the database |

After changing the schema, always run `pnpm types:gen`.

## Project layout

```
seed/                    Human-editable placeholder data (CSV + JSON)
scripts/build-seed.mjs   Turns seed/ into supabase/seed.sql
supabase/migrations/     Ordered SQL migrations — the schema's source of truth
src/app/[locale]/        All routes, locale-scoped
src/i18n/                Locale routing and message loading
src/lib/supabase/        Browser, server, and service-role clients
src/lib/types/database.ts  Generated — do not edit by hand
messages/                UI copy: en.json, es.json
docs/                    Architecture and handover notes
```

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — how the system fits together and why
- [`docs/placeholders.md`](docs/placeholders.md) — every provisional value and how to replace it
- [`docs/deployment.md`](docs/deployment.md) — DigitalOcean App Platform setup and environment variables
- [`docs/operations.md`](docs/operations.md) — creating the first admin, roles, changing pricing
