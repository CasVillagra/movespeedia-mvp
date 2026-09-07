-- MoveSpeedia MVP — functions and triggers

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at      before update on public.profiles      for each row execute function public.set_updated_at();
create trigger carriers_set_updated_at      before update on public.carriers      for each row execute function public.set_updated_at();
create trigger catalog_items_set_updated_at before update on public.catalog_items for each row execute function public.set_updated_at();
create trigger moves_set_updated_at         before update on public.moves         for each row execute function public.set_updated_at();
create trigger move_items_set_updated_at    before update on public.move_items    for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at      before update on public.bookings      for each row execute function public.set_updated_at();
create trigger payments_set_updated_at      before update on public.payments      for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Role helpers
--
-- SECURITY DEFINER so RLS policies can read a user's role without recursing
-- into the profiles policies themselves.
-- ---------------------------------------------------------------------------

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

-- The carrier record owned by the current user, if any.
create or replace function public.current_carrier_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.carriers where owner_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Profile provisioning on signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Keep moves.total_cubic_feet in sync with move_items
-- ---------------------------------------------------------------------------

create or replace function public.recalculate_move_cubic_feet()
returns trigger
language plpgsql
security definer
set search_path = public
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

create trigger move_items_recalculate_cubic_feet
  after insert or update or delete on public.move_items
  for each row execute function public.recalculate_move_cubic_feet();

-- ---------------------------------------------------------------------------
-- Bump pricing_config.version on every change
--
-- Quotes store the version they were priced under, so a historical quote can
-- always be explained even after the admin changes the rules.
-- ---------------------------------------------------------------------------

create or replace function public.bump_pricing_config_version()
returns trigger
language plpgsql
as $$
begin
  new.version = old.version + 1;
  new.updated_at = now();
  return new;
end;
$$;

create trigger pricing_config_bump_version
  before update on public.pricing_config
  for each row execute function public.bump_pricing_config_version();
