-- MoveSpeedia MVP — row level security
--
-- Three roles: customer, carrier, admin.
-- The service_role key bypasses RLS entirely and is used by server-side
-- pricing/matching/webhook code. Everything reachable from the browser is
-- governed by the policies below.

alter table public.profiles              enable row level security;
alter table public.carriers              enable row level security;
alter table public.carrier_service_areas enable row level security;
alter table public.carrier_availability  enable row level security;
alter table public.catalog_items         enable row level security;
alter table public.pricing_config        enable row level security;
alter table public.moves                 enable row level security;
alter table public.move_items            enable row level security;
alter table public.move_photos           enable row level security;
alter table public.quotes                enable row level security;
alter table public.bookings              enable row level security;
alter table public.payments              enable row level security;
alter table public.audit_log             enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy profiles_select_self_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy profiles_update_self_or_admin on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy profiles_admin_insert on public.profiles
  for insert to authenticated
  with check (public.is_admin());

-- Users may edit their own profile but not promote themselves.
create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an administrator can change a user role';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role_change
  before update on public.profiles
  for each row execute function public.guard_profile_role_change();

-- ---------------------------------------------------------------------------
-- carriers
-- ---------------------------------------------------------------------------

-- Active carriers are publicly listable (the comparison screen).
create policy carriers_select_active on public.carriers
  for select to anon, authenticated
  using (status = 'active');

create policy carriers_select_own_or_admin on public.carriers
  for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy carriers_admin_write on public.carriers
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy carriers_owner_update on public.carriers
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- A carrier may maintain its own profile but not approve itself or change
-- its own pricing multiplier.
create or replace function public.guard_carrier_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.status is distinct from old.status then
    raise exception 'Only an administrator can change carrier status';
  end if;

  if new.price_multiplier is distinct from old.price_multiplier then
    raise exception 'Only an administrator can change the carrier price multiplier';
  end if;

  return new;
end;
$$;

create trigger carriers_guard_privileged_fields
  before update on public.carriers
  for each row execute function public.guard_carrier_privileged_fields();

-- ---------------------------------------------------------------------------
-- carrier_service_areas / carrier_availability
--
-- Not publicly readable. Customer-facing matching runs server-side with the
-- service role so carriers cannot enumerate each other's capacity.
-- ---------------------------------------------------------------------------

create policy service_areas_owner_or_admin on public.carrier_service_areas
  for all to authenticated
  using (carrier_id = public.current_carrier_id() or public.is_admin())
  with check (carrier_id = public.current_carrier_id() or public.is_admin());

create policy availability_owner_or_admin on public.carrier_availability
  for all to authenticated
  using (carrier_id = public.current_carrier_id() or public.is_admin())
  with check (carrier_id = public.current_carrier_id() or public.is_admin());

-- ---------------------------------------------------------------------------
-- catalog_items — readable by everyone, writable by admin
-- ---------------------------------------------------------------------------

create policy catalog_select_active on public.catalog_items
  for select to anon, authenticated
  using (is_active or public.is_admin());

create policy catalog_admin_write on public.catalog_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- pricing_config — admin only
--
-- Contains platform commission, so it is deliberately not readable by
-- customers or carriers. Quote calculation happens server-side.
-- ---------------------------------------------------------------------------

create policy pricing_config_admin_only on public.pricing_config
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- moves
-- ---------------------------------------------------------------------------

-- A carrier may see a move only once it is connected to them by a quote or booking.
create or replace function public.carrier_can_see_move(target_move uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.quotes q
    where q.move_id = target_move and q.carrier_id = public.current_carrier_id()
  ) or exists (
    select 1 from public.bookings b
    where b.move_id = target_move and b.carrier_id = public.current_carrier_id()
  );
$$;

create policy moves_select on public.moves
  for select to authenticated
  using (
    customer_id = auth.uid()
    or public.is_admin()
    or public.carrier_can_see_move(id)
  );

create policy moves_insert_own on public.moves
  for insert to authenticated
  with check (customer_id = auth.uid());

create policy moves_update_own_or_admin on public.moves
  for update to authenticated
  using (
    public.is_admin()
    or (customer_id = auth.uid() and status in ('draft', 'quoted'))
  )
  with check (
    public.is_admin()
    or customer_id = auth.uid()
  );

create policy moves_delete_own_draft_or_admin on public.moves
  for delete to authenticated
  using (
    public.is_admin()
    or (customer_id = auth.uid() and status = 'draft')
  );

-- ---------------------------------------------------------------------------
-- move_items / move_photos — inherit access from the parent move
-- ---------------------------------------------------------------------------

create or replace function public.can_read_move(target_move uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.moves m
    where m.id = target_move
      and (m.customer_id = auth.uid() or public.is_admin() or public.carrier_can_see_move(m.id))
  );
$$;

create or replace function public.can_write_move(target_move uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.moves m
    where m.id = target_move
      and (public.is_admin() or (m.customer_id = auth.uid() and m.status in ('draft', 'quoted')))
  );
$$;

create policy move_items_select on public.move_items
  for select to authenticated
  using (public.can_read_move(move_id));

create policy move_items_write on public.move_items
  for all to authenticated
  using (public.can_write_move(move_id))
  with check (public.can_write_move(move_id));

create policy move_photos_select on public.move_photos
  for select to authenticated
  using (public.can_read_move(move_id));

create policy move_photos_write on public.move_photos
  for all to authenticated
  using (public.can_write_move(move_id))
  with check (public.can_write_move(move_id));

-- ---------------------------------------------------------------------------
-- quotes — read-only to customers and carriers; created server-side
-- ---------------------------------------------------------------------------

create policy quotes_select on public.quotes
  for select to authenticated
  using (
    public.is_admin()
    or carrier_id = public.current_carrier_id()
    or exists (select 1 from public.moves m where m.id = move_id and m.customer_id = auth.uid())
  );

create policy quotes_admin_write on public.quotes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------

create policy bookings_select on public.bookings
  for select to authenticated
  using (
    public.is_admin()
    or customer_id = auth.uid()
    or carrier_id = public.current_carrier_id()
  );

create policy bookings_admin_write on public.bookings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- payments — customer sees their own, carriers do not
-- ---------------------------------------------------------------------------

create policy payments_select on public.payments
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.customer_id = auth.uid()
    )
  );

create policy payments_admin_write on public.payments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_log — admin read only; written server-side
-- ---------------------------------------------------------------------------

create policy audit_log_admin_select on public.audit_log
  for select to authenticated
  using (public.is_admin());
