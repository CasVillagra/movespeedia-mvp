-- Move helper and trigger functions out of the API-exposed `public` schema.
--
-- PostgREST exposes every function in `public` as an RPC endpoint, so
-- `public.is_admin()` was reachable at /rest/v1/rpc/is_admin by anonymous
-- callers. Revoking EXECUTE is not an option: RLS policy expressions are
-- evaluated with the privileges of the querying role, so revoking the grant
-- breaks every policy that calls these helpers (verified empirically).
--
-- The `private` schema is not in PostgREST's exposed schema list, so the RPC
-- endpoints disappear while policies keep working.
--
-- Also sets an explicit search_path on the two trigger functions that lacked
-- one (function_search_path_mutable).

create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Role helpers
-- ---------------------------------------------------------------------------

create or replace function private.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid(); $$;

create or replace function private.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(private.current_user_role() = 'admin', false); $$;

create or replace function private.current_carrier_id()
returns uuid
language sql stable security definer set search_path = public
as $$ select id from public.carriers where owner_id = auth.uid(); $$;

create or replace function private.carrier_can_see_move(target_move uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.quotes q
    where q.move_id = target_move and q.carrier_id = private.current_carrier_id()
  ) or exists (
    select 1 from public.bookings b
    where b.move_id = target_move and b.carrier_id = private.current_carrier_id()
  );
$$;

create or replace function private.can_read_move(target_move uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.moves m
    where m.id = target_move
      and (m.customer_id = auth.uid() or private.is_admin() or private.carrier_can_see_move(m.id))
  );
$$;

create or replace function private.can_write_move(target_move uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.moves m
    where m.id = target_move
      and (private.is_admin() or (m.customer_id = auth.uid() and m.status in ('draft', 'quoted')))
  );
$$;

grant execute on function
  private.current_user_role(), private.is_admin(), private.current_carrier_id(),
  private.carrier_can_see_move(uuid), private.can_read_move(uuid), private.can_write_move(uuid)
to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Trigger functions
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function private.bump_pricing_config_version()
returns trigger language plpgsql set search_path = public
as $$ begin new.version = old.version + 1; new.updated_at = now(); return new; end; $$;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, preferred_locale)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'preferred_locale', ''), 'en')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function private.recalculate_move_cubic_feet()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  target_move uuid := coalesce(new.move_id, old.move_id);
begin
  update public.moves m
  set total_cubic_feet = coalesce((
    select sum(mi.quantity * mi.cubic_feet_each)
    from public.move_items mi
    where mi.move_id = target_move
  ), 0)
  where m.id = target_move;
  return null;
end;
$$;

create or replace function private.guard_profile_role_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and not private.is_admin() then
    raise exception 'Only an administrator can change a user role';
  end if;
  return new;
end;
$$;

create or replace function private.guard_carrier_privileged_fields()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if private.is_admin() then
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

-- ---------------------------------------------------------------------------
-- Repoint triggers
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_set_updated_at      on public.profiles;
drop trigger if exists carriers_set_updated_at      on public.carriers;
drop trigger if exists catalog_items_set_updated_at on public.catalog_items;
drop trigger if exists moves_set_updated_at         on public.moves;
drop trigger if exists move_items_set_updated_at    on public.move_items;
drop trigger if exists bookings_set_updated_at      on public.bookings;
drop trigger if exists payments_set_updated_at      on public.payments;
drop trigger if exists on_auth_user_created         on auth.users;
drop trigger if exists move_items_recalculate_cubic_feet on public.move_items;
drop trigger if exists pricing_config_bump_version  on public.pricing_config;
drop trigger if exists profiles_guard_role_change   on public.profiles;
drop trigger if exists carriers_guard_privileged_fields on public.carriers;

create trigger profiles_set_updated_at      before update on public.profiles      for each row execute function private.set_updated_at();
create trigger carriers_set_updated_at      before update on public.carriers      for each row execute function private.set_updated_at();
create trigger catalog_items_set_updated_at before update on public.catalog_items for each row execute function private.set_updated_at();
create trigger moves_set_updated_at         before update on public.moves         for each row execute function private.set_updated_at();
create trigger move_items_set_updated_at    before update on public.move_items    for each row execute function private.set_updated_at();
create trigger bookings_set_updated_at      before update on public.bookings      for each row execute function private.set_updated_at();
create trigger payments_set_updated_at      before update on public.payments      for each row execute function private.set_updated_at();

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

create trigger move_items_recalculate_cubic_feet
  after insert or update or delete on public.move_items
  for each row execute function private.recalculate_move_cubic_feet();

create trigger pricing_config_bump_version before update on public.pricing_config
  for each row execute function private.bump_pricing_config_version();

create trigger profiles_guard_role_change before update on public.profiles
  for each row execute function private.guard_profile_role_change();

create trigger carriers_guard_privileged_fields before update on public.carriers
  for each row execute function private.guard_carrier_privileged_fields();

-- ---------------------------------------------------------------------------
-- Repoint policies
-- ---------------------------------------------------------------------------

drop policy if exists profiles_select_self_or_admin on public.profiles;
drop policy if exists profiles_update_self_or_admin on public.profiles;
drop policy if exists profiles_admin_insert on public.profiles;
drop policy if exists carriers_select_own_or_admin on public.carriers;
drop policy if exists carriers_admin_write on public.carriers;
drop policy if exists service_areas_owner_or_admin on public.carrier_service_areas;
drop policy if exists availability_owner_or_admin on public.carrier_availability;
drop policy if exists catalog_select_active on public.catalog_items;
drop policy if exists catalog_admin_write on public.catalog_items;
drop policy if exists pricing_config_admin_only on public.pricing_config;
drop policy if exists moves_select on public.moves;
drop policy if exists moves_update_own_or_admin on public.moves;
drop policy if exists moves_delete_own_draft_or_admin on public.moves;
drop policy if exists move_items_select on public.move_items;
drop policy if exists move_items_write on public.move_items;
drop policy if exists move_photos_select on public.move_photos;
drop policy if exists move_photos_write on public.move_photos;
drop policy if exists quotes_select on public.quotes;
drop policy if exists quotes_admin_write on public.quotes;
drop policy if exists bookings_select on public.bookings;
drop policy if exists bookings_admin_write on public.bookings;
drop policy if exists payments_select on public.payments;
drop policy if exists payments_admin_write on public.payments;
drop policy if exists audit_log_admin_select on public.audit_log;

create policy profiles_select_self_or_admin on public.profiles
  for select to authenticated using (id = auth.uid() or private.is_admin());
create policy profiles_update_self_or_admin on public.profiles
  for update to authenticated using (id = auth.uid() or private.is_admin())
  with check (id = auth.uid() or private.is_admin());
create policy profiles_admin_insert on public.profiles
  for insert to authenticated with check (private.is_admin());

create policy carriers_select_own_or_admin on public.carriers
  for select to authenticated using (owner_id = auth.uid() or private.is_admin());
create policy carriers_admin_write on public.carriers
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy service_areas_owner_or_admin on public.carrier_service_areas
  for all to authenticated
  using (carrier_id = private.current_carrier_id() or private.is_admin())
  with check (carrier_id = private.current_carrier_id() or private.is_admin());

create policy availability_owner_or_admin on public.carrier_availability
  for all to authenticated
  using (carrier_id = private.current_carrier_id() or private.is_admin())
  with check (carrier_id = private.current_carrier_id() or private.is_admin());

create policy catalog_select_active on public.catalog_items
  for select to anon, authenticated using (is_active or private.is_admin());
create policy catalog_admin_write on public.catalog_items
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy pricing_config_admin_only on public.pricing_config
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy moves_select on public.moves
  for select to authenticated
  using (customer_id = auth.uid() or private.is_admin() or private.carrier_can_see_move(id));
create policy moves_update_own_or_admin on public.moves
  for update to authenticated
  using (private.is_admin() or (customer_id = auth.uid() and status in ('draft', 'quoted')))
  with check (private.is_admin() or customer_id = auth.uid());
create policy moves_delete_own_draft_or_admin on public.moves
  for delete to authenticated
  using (private.is_admin() or (customer_id = auth.uid() and status = 'draft'));

create policy move_items_select on public.move_items
  for select to authenticated using (private.can_read_move(move_id));
create policy move_items_write on public.move_items
  for all to authenticated
  using (private.can_write_move(move_id)) with check (private.can_write_move(move_id));

create policy move_photos_select on public.move_photos
  for select to authenticated using (private.can_read_move(move_id));
create policy move_photos_write on public.move_photos
  for all to authenticated
  using (private.can_write_move(move_id)) with check (private.can_write_move(move_id));

create policy quotes_select on public.quotes
  for select to authenticated
  using (
    private.is_admin()
    or carrier_id = private.current_carrier_id()
    or exists (select 1 from public.moves m where m.id = move_id and m.customer_id = auth.uid())
  );
create policy quotes_admin_write on public.quotes
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy bookings_select on public.bookings
  for select to authenticated
  using (private.is_admin() or customer_id = auth.uid() or carrier_id = private.current_carrier_id());
create policy bookings_admin_write on public.bookings
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy payments_select on public.payments
  for select to authenticated
  using (
    private.is_admin()
    or exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid())
  );
create policy payments_admin_write on public.payments
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

create policy audit_log_admin_select on public.audit_log
  for select to authenticated using (private.is_admin());

-- ---------------------------------------------------------------------------
-- Remove the now-unreferenced public copies
-- ---------------------------------------------------------------------------

drop function if exists public.can_read_move(uuid);
drop function if exists public.can_write_move(uuid);
drop function if exists public.carrier_can_see_move(uuid);
drop function if exists public.is_admin();
drop function if exists public.current_user_role();
drop function if exists public.current_carrier_id();
drop function if exists public.handle_new_user();
drop function if exists public.recalculate_move_cubic_feet();
drop function if exists public.guard_profile_role_change();
drop function if exists public.guard_carrier_privileged_fields();
drop function if exists public.set_updated_at();
drop function if exists public.bump_pricing_config_version();
