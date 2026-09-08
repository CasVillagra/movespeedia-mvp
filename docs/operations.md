# Operations

## Creating the first admin

New accounts are always created as `customer`. A signed-in user cannot change
their own role — a trigger blocks it — so the first admin has to be promoted
from outside the application.

Sign up through the app as normal, then run:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'her@movespeedia.com');
```

Run it in the Supabase dashboard's SQL editor, or with the service-role key.
Both have `auth.uid() = null`, which the guard treats as a trusted operator.

Once one admin exists, that admin can promote others through the app.

### Why it works this way

The guard exists to stop a customer from making themselves an admin. It is
deliberately blind to *who* the operator is, because the alternative — an
"is this the first admin?" special case in the application — is the kind of
rule that quietly stops being true later.

## Roles

| Role | Lands on | Can see |
| --- | --- | --- |
| `customer` | `/[locale]/moves` | Their own moves, inventory, quotes, bookings, payments |
| `carrier` | `/[locale]/carrier` | Their own company record, service areas, availability; moves only once quoted or booked to them |
| `admin` | `/[locale]/admin` | Everything, including pricing rules |

Visiting another role's area redirects to your own rather than showing an
error page. A customer who lands on `/admin` has no use for a 403.

Route guards are convenience, not security. Row level security is the
boundary: even a user who bypassed the UI entirely would read nothing they
are not entitled to.

## Changing pricing

Pricing lives in a single `pricing_config` row. Editing it bumps
`pricing_config.version`; quotes record the version they were priced under, so
historical quotes stay explainable after a rule change.

Until the admin UI ships, edit it in the Supabase dashboard, or re-seed from
`seed/pricing_config.json` (see [`placeholders.md`](placeholders.md)).

## Local database reset

`pnpm db:reset` drops the local database, re-runs every migration, and re-seeds.
It destroys local data only — it never touches the hosted project.

## Applying migrations to the hosted project

Once the project is linked (`supabase link --project-ref lojqzqkpahcmcuxpgcby`,
which needs the database password):

```bash
supabase db push
```

Never edit the hosted schema by hand. The migrations are the source of truth,
and a hand edit makes the next push fail in a way that is tedious to unpick.

## Adding a table: grants are not automatic

Row level security decides which **rows** a role may touch. It only comes into
play once the role holds the underlying **table** privilege, and those
privileges are not granted automatically in a way you can rely on — they come
from Postgres default privileges, which depend on which role created the table.

This bit us once: the hosted project's tables had only
`REFERENCES`/`TRIGGER`/`TRUNCATE` for `anon`, `authenticated` and
`service_role`, so every API call failed with `permission denied for table
catalog_items` while the identical local database worked perfectly.

**Any migration that creates a table must also grant on it**, following the
pattern in `20260908000006_role_grants.sql`:

```sql
grant select on public.new_table to anon;              -- only if truly public
grant select, insert, update, delete on public.new_table to authenticated;
grant select, insert, update, delete on public.new_table to service_role;
```

`service_role` is easy to forget because it bypasses RLS — but bypassing RLS
does not bypass table privileges. Without its grant, server-side code fails.

After adding a table, verify both environments agree:

```sql
select has_table_privilege('authenticated', 'public.new_table', 'SELECT');
```
