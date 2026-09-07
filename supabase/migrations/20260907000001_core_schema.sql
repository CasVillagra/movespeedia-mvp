-- MoveSpeedia MVP — core schema
-- Cubic feet is the source of truth for inventory volume.
-- Weight is always DERIVED from cubic feet via pricing_config.cubic_feet_to_pounds_factor,
-- never stored as an independent input. See docs/architecture.md.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('customer', 'carrier', 'admin');
create type public.carrier_status as enum ('pending', 'active', 'inactive');
create type public.move_status as enum ('draft', 'quoted', 'booked', 'in_progress', 'completed', 'cancelled');
create type public.quote_status as enum ('active', 'expired', 'accepted', 'superseded');
create type public.booking_status as enum ('pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled');
create type public.payment_stage as enum ('deposit', 'pre_move', 'delivery');
create type public.payment_status as enum ('pending', 'processing', 'succeeded', 'failed', 'refunded');
create type public.access_type as enum ('ground_floor', 'elevator', 'stairs');

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  role              public.user_role not null default 'customer',
  full_name         text,
  phone             text,
  preferred_locale  text not null default 'en' check (preferred_locale in ('en', 'es')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.profiles is 'Application-level user record. Role drives all RLS policies.';

-- ---------------------------------------------------------------------------
-- Carriers
-- ---------------------------------------------------------------------------

create table public.carriers (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid unique references public.profiles (id) on delete set null,
  company_name        text not null,
  contact_name        text,
  contact_email       text,
  contact_phone       text,
  -- Regulatory identifiers. CPUC requires a Cal T permit for CA intrastate
  -- household goods moves; interstate carriers need USDOT/MC numbers.
  cal_t_number        text,
  dot_number          text,
  mc_number           text,
  insurance_expires_on date,
  description_en      text,
  description_es      text,
  -- Multiplies the platform-computed price for this carrier. 1.000 = platform price.
  price_multiplier    numeric(6,3) not null default 1.000 check (price_multiplier > 0),
  status              public.carrier_status not null default 'pending',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index carriers_status_idx on public.carriers (status);

create table public.carrier_service_areas (
  id            uuid primary key default gen_random_uuid(),
  carrier_id    uuid not null references public.carriers (id) on delete cascade,
  label         text,
  center_zip    text not null,
  radius_miles  integer not null default 25 check (radius_miles > 0),
  created_at    timestamptz not null default now()
);

create index carrier_service_areas_carrier_idx on public.carrier_service_areas (carrier_id);

create table public.carrier_availability (
  id              uuid primary key default gen_random_uuid(),
  carrier_id      uuid not null references public.carriers (id) on delete cascade,
  available_on    date not null,
  capacity_cubic_feet numeric(10,2) not null default 0 check (capacity_cubic_feet >= 0),
  is_available    boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (carrier_id, available_on)
);

create index carrier_availability_date_idx on public.carrier_availability (available_on) where is_available;

-- ---------------------------------------------------------------------------
-- Inventory catalog
-- ---------------------------------------------------------------------------

create table public.catalog_items (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  category      text not null,
  name_en       text not null,
  name_es       text not null,
  cubic_feet    numeric(8,2) not null check (cubic_feet > 0),
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  -- TRUE until the client confirms the value. Surfaced in the admin UI so
  -- placeholder cube values are never mistaken for approved data.
  is_placeholder boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index catalog_items_category_idx on public.catalog_items (category, sort_order);

-- ---------------------------------------------------------------------------
-- Pricing configuration (single row, admin-editable)
-- ---------------------------------------------------------------------------

create table public.pricing_config (
  id                          boolean primary key default true check (id),
  version                     integer not null default 1,
  base_rate                   numeric(10,2) not null,
  rate_per_cubic_foot         numeric(10,4) not null,
  cubic_feet_to_pounds_factor numeric(8,3) not null,
  minimum_charge              numeric(10,2) not null,
  included_miles              integer not null default 0,
  rate_per_mile               numeric(10,4) not null default 0,
  stairs_fee_per_flight       numeric(10,2) not null default 0,
  long_carry_fee              numeric(10,2) not null default 0,
  packing_fee_per_cubic_foot  numeric(10,4) not null default 0,
  deposit_pct                 numeric(5,2) not null,
  pre_move_pct                numeric(5,2) not null,
  delivery_pct                numeric(5,2) not null,
  quote_valid_days            integer not null default 7 check (quote_valid_days > 0),
  platform_commission_pct     numeric(5,2) not null default 0,
  is_placeholder              boolean not null default true,
  updated_by                  uuid references public.profiles (id) on delete set null,
  updated_at                  timestamptz not null default now(),
  constraint payment_stages_sum_to_100
    check (deposit_pct + pre_move_pct + delivery_pct = 100)
);

comment on table public.pricing_config is
  'Single-row config. Every pricing input lives here so the admin can change pricing without a developer.';

-- ---------------------------------------------------------------------------
-- Moves and inventory
-- ---------------------------------------------------------------------------

create table public.moves (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid not null references public.profiles (id) on delete cascade,
  status              public.move_status not null default 'draft',

  origin_line1        text,
  origin_line2        text,
  origin_city         text,
  origin_state        text,
  origin_zip          text,
  origin_access       public.access_type not null default 'ground_floor',
  origin_floor        integer not null default 0 check (origin_floor >= 0),
  origin_long_carry   boolean not null default false,

  destination_line1      text,
  destination_line2      text,
  destination_city       text,
  destination_state      text,
  destination_zip        text,
  destination_access     public.access_type not null default 'ground_floor',
  destination_floor      integer not null default 0 check (destination_floor >= 0),
  destination_long_carry boolean not null default false,

  move_date           date,
  move_date_flexible  boolean not null default false,
  distance_miles      numeric(10,2),

  contact_name        text,
  contact_email       text,
  contact_phone       text,
  notes               text,

  -- Maintained by trigger from move_items.
  total_cubic_feet    numeric(12,2) not null default 0,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index moves_customer_idx on public.moves (customer_id, created_at desc);
create index moves_status_idx on public.moves (status);

create table public.move_items (
  id               uuid primary key default gen_random_uuid(),
  move_id          uuid not null references public.moves (id) on delete cascade,
  catalog_item_id  uuid references public.catalog_items (id) on delete set null,
  -- Set when the customer adds an item not in the catalog.
  custom_name      text,
  quantity         integer not null default 1 check (quantity > 0),
  -- Snapshot of the catalog value at the time of adding, so later catalog
  -- edits never silently reprice an existing move.
  cubic_feet_each  numeric(8,2) not null check (cubic_feet_each > 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint move_item_has_a_name check (catalog_item_id is not null or custom_name is not null)
);

create index move_items_move_idx on public.move_items (move_id);

create table public.move_photos (
  id            uuid primary key default gen_random_uuid(),
  move_id       uuid not null references public.moves (id) on delete cascade,
  storage_path  text not null,
  uploaded_by   uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index move_photos_move_idx on public.move_photos (move_id);

-- ---------------------------------------------------------------------------
-- Quotes, bookings, payments
-- ---------------------------------------------------------------------------

create table public.quotes (
  id                      uuid primary key default gen_random_uuid(),
  move_id                 uuid not null references public.moves (id) on delete cascade,
  carrier_id              uuid not null references public.carriers (id) on delete cascade,
  status                  public.quote_status not null default 'active',
  total_cubic_feet        numeric(12,2) not null,
  estimated_weight_lbs    numeric(12,2) not null,
  -- Frozen line items: [{ code, label_en, label_es, amount }, ...]
  breakdown               jsonb not null default '[]'::jsonb,
  pricing_config_version  integer not null,
  subtotal                numeric(10,2) not null,
  accessorials_total      numeric(10,2) not null default 0,
  total                   numeric(10,2) not null,
  pickup_window_start     date,
  pickup_window_end       date,
  valid_until             timestamptz not null,
  created_at              timestamptz not null default now()
);

create index quotes_move_idx on public.quotes (move_id, created_at desc);
create index quotes_carrier_idx on public.quotes (carrier_id);

create table public.bookings (
  id                        uuid primary key default gen_random_uuid(),
  quote_id                  uuid not null unique references public.quotes (id) on delete restrict,
  move_id                   uuid not null references public.moves (id) on delete cascade,
  carrier_id                uuid not null references public.carriers (id) on delete restrict,
  customer_id               uuid not null references public.profiles (id) on delete cascade,
  status                    public.booking_status not null default 'pending_payment',
  -- Starts equal to quotes.total; admin may adjust when a legitimate change occurs.
  agreed_total              numeric(10,2) not null,
  stripe_customer_id        text,
  stripe_payment_method_id  text,
  scheduled_pickup_date     date,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index bookings_customer_idx on public.bookings (customer_id, created_at desc);
create index bookings_carrier_idx on public.bookings (carrier_id);

create table public.payments (
  id                        uuid primary key default gen_random_uuid(),
  booking_id                uuid not null references public.bookings (id) on delete cascade,
  stage                     public.payment_stage not null,
  amount                    numeric(10,2) not null check (amount >= 0),
  status                    public.payment_status not null default 'pending',
  stripe_payment_intent_id  text unique,
  charged_at                timestamptz,
  failure_reason            text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (booking_id, stage)
);

create index payments_booking_idx on public.payments (booking_id);

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id           bigserial primary key,
  actor_id     uuid references public.profiles (id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  before       jsonb,
  after        jsonb,
  created_at   timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id, created_at desc);

comment on table public.audit_log is
  'Admin can edit customer inventory and booking prices; this records who changed what.';
