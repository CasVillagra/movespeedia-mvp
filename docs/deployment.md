# Deployment

The app is hosted on **DigitalOcean App Platform**, built from `main` in
`MoveSpeedia-Inc/movespeedia-mvp`. The full configuration lives in
[`.do/app.yaml`](../.do/app.yaml) so the environment is reproducible and
reviewable rather than clicked together in a dashboard.

## Prerequisites

1. A DigitalOcean account owned by MoveSpeedia, with billing set up.
2. The DigitalOcean GitHub integration authorized for the **MoveSpeedia-Inc**
   organization — without it App Platform cannot read the repository.
3. `doctl` authenticated against that account:

   ```bash
   doctl auth init --context movespeedia
   doctl auth switch --context movespeedia
   ```

   Use a context name so this account cannot be confused with another
   client's DigitalOcean account on the same machine.

## First deploy

```bash
doctl apps create --spec .do/app.yaml
```

Then set the encrypted secret, which is deliberately not in the spec file:

```bash
doctl apps update <APP_ID> --spec .do/app.yaml
# then, in the App Platform UI: Settings → App-Level Environment Variables
# → SUPABASE_SECRET_KEY → paste value → mark as encrypted
```

## Subsequent deploys

`deploy_on_push` is enabled, so merging to `main` deploys automatically.
To change infrastructure (instance size, env vars, health check), edit
`.do/app.yaml` and run:

```bash
doctl apps update <APP_ID> --spec .do/app.yaml
```

## Why a service and not a static site

App Platform can host static sites more cheaply, but this app cannot be one.
It uses a proxy (`src/proxy.ts`) for locale routing and Supabase session
refresh, and pages are server-rendered per request against the database.
It needs a Node process, so it is configured as a `service`.

## Environment variables

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | build + run | Safe to commit |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | build + run | Safe to commit; RLS governs what it can read |
| `SUPABASE_SECRET_KEY` | run | **Encrypted.** Bypasses RLS. Never commit |
| `STRIPE_SECRET_KEY` | run | **Encrypted.** Added in the payments milestone |
| `STRIPE_WEBHOOK_SECRET` | run | **Encrypted.** Added in the payments milestone |

The two public values are build-time as well as runtime, because the home page
reads the catalog while Next collects page data during the build.

## Custom domain

Add the domain in App Platform (Settings → Domains) and point a `CNAME` at the
app's default `.ondigitalocean.app` hostname. A staging subdomain such as
`staging.movespeedia.com` is the recommended target until launch.

## Database

The database is **not** deployed from here — it is a managed Supabase project
(`lojqzqkpahcmcuxpgcby`, `us-west-1`). Schema changes are migrations in
`supabase/migrations/`, applied with `supabase db push` once the project is
linked. Never edit the hosted schema by hand: the migrations are the source of
truth, and a hand edit will make the next push fail.
