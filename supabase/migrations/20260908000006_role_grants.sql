-- Explicit table grants for the API roles.
--
-- Row level security decides which ROWS a role may touch, but it only applies
-- once the role has the underlying table privilege. Those privileges normally
-- arrive through Supabase's default privileges — which depend on which role
-- created the table. The hosted project's tables ended up with only
-- REFERENCES/TRIGGER/TRUNCATE for anon, authenticated and service_role, so
-- every API read failed with "permission denied for table catalog_items"
-- while the identical local database worked.
--
-- Granting explicitly makes the two environments identical and independent of
-- who runs the migration. Any future migration that adds a table must add its
-- grants here too — see docs/operations.md.

grant usage on schema public to anon, authenticated, service_role;

-- Anonymous visitors: read-only, and only the two tables the marketing and
-- comparison pages need. RLS narrows this further (active carriers only).
grant select on public.catalog_items to anon;
grant select on public.carriers      to anon;

-- Signed-in users: full DML on the application tables. Which rows they can
-- actually touch is decided by RLS, not by these grants.
grant select, insert, update, delete on
  public.profiles,
  public.carriers,
  public.carrier_service_areas,
  public.carrier_availability,
  public.catalog_items,
  public.pricing_config,
  public.moves,
  public.move_items,
  public.move_photos,
  public.quotes,
  public.bookings,
  public.payments
to authenticated;

-- Read-only: the audit trail is written server-side, never by a user.
grant select on public.audit_log to authenticated;

-- Trusted server-side code. It bypasses RLS, but bypassing RLS does not
-- bypass table privileges — without this, quote calculation and the Stripe
-- webhook handlers would fail.
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role, authenticated;

-- Local Supabase hands anon broad DML on every table through its default
-- privileges; the hosted project does not. RLS makes that harmless — anon has
-- no policy on these tables, so it reads nothing either way — but leaving the
-- difference in place means local and production are not the same system, and
-- the next divergence might not be harmless. Revoke down to the hosted shape.

revoke all on
  public.profiles,
  public.carrier_service_areas,
  public.carrier_availability,
  public.pricing_config,
  public.moves,
  public.move_items,
  public.move_photos,
  public.quotes,
  public.bookings,
  public.payments,
  public.audit_log
from anon;

-- anon reads these two; it never writes them.
revoke insert, update, delete, truncate on public.catalog_items from anon;
revoke insert, update, delete, truncate on public.carriers      from anon;
