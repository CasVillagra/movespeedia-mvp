# Architecture

## Decisions that shape everything else

### Cubic feet is the source of truth; weight is derived

Inventory volume is stored in cubic feet on `move_items.cubic_feet_each`.
Weight is never entered or stored as an independent figure — it is computed as
`cubic_feet × pricing_config.cubic_feet_to_pounds_factor` at quote time and
frozen onto the quote.

This satisfies two requirements at once: the cubic-foot inventory is preserved
internally, and estimates can be expressed in weight where California rules
call for it. Because the factor lives in `pricing_config`, changing it is an
admin action, not a code change.

### Values the business owns live in the database, not in code

`pricing_config` is a single row holding every pricing input: base rate, rate
per cubic foot, mileage, minimum charge, accessorial fees, the cubic-foot-to-
pound factor, and the three payment-stage percentages. Application code reads
this table and never hardcodes a number.

The table has a check constraint requiring the three stage percentages to sum
to 100, so a mistaken edit fails loudly instead of producing a booking whose
payments don't add up.

### Quotes are frozen, not recomputed

A quote stores its own `breakdown` (line items), totals, derived weight, and
the `pricing_config_version` it was priced under. Later changes to pricing
rules or to the catalog never silently reprice an existing quote, and any
historical quote can still be explained.

`move_items.cubic_feet_each` is likewise a snapshot of the catalog value at the
time the item was added.

Each quote carries `valid_until`, derived from `pricing_config.quote_valid_days`.

### Admin corrections are expected, and audited

The admin can adjust a customer's inventory and a booking's agreed total —
this is a stated requirement, since a customer who forgets a bedroom must not
make the booking unusable. `bookings.agreed_total` starts equal to the quote
total and may diverge from it. Every such change is recorded in `audit_log`
with actor, entity, and before/after snapshots.

## Access control

Three roles on `profiles.role`: `customer`, `carrier`, `admin`. Row level
security is enabled on all 13 tables; there is no table reachable from the
browser without a policy.

Role checks go through `SECURITY DEFINER` helper functions
(`current_user_role()`, `is_admin()`, `current_carrier_id()`) so that policies
can read a user's role without recursing into the `profiles` policies.

Notable rules:

- **Carriers** are publicly listable only when `status = 'active'`.
- A carrier may edit its own profile but **cannot** change its own `status` or
  `price_multiplier` — enforced by a trigger, since RLS cannot restrict
  individual columns.
- A user may edit their own profile but **cannot** change their own `role`.
- A carrier can see a move only once a quote or booking links them to it.
- `pricing_config` is admin-only, because it contains the platform commission.
  Quote calculation therefore runs server-side using the service-role client.
- Carrier service areas and availability are not publicly readable, so carriers
  cannot enumerate each other's capacity. Matching runs server-side.

### The three Supabase clients

| Client | Used by | RLS |
| --- | --- | --- |
| `lib/supabase/client.ts` | Client Components | Enforced |
| `lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers | Enforced |
| `lib/supabase/admin.ts` | Quote calculation, matching, Stripe webhooks | **Bypassed** |

The admin client must never be imported into a Client Component.

## Internationalization

`next-intl` with locale-prefixed routes (`/en/...`, `/es/...`). English is the
default; Spanish is a complete peer locale, not a partial translation. Copy
lives in `messages/en.json` and `messages/es.json`, which are kept key-for-key
identical.

Carrier-supplied prose is bilingual at the column level
(`carriers.description_en` / `description_es`), as is the item catalog
(`catalog_items.name_en` / `name_es`).

## Request pipeline

`src/proxy.ts` runs on every non-asset request: next-intl resolves the locale
first, then the Supabase session is refreshed and its rotated cookies are
written onto that same response. Order matters — both need to own the response,
and locale resolution has to happen first.

(Next.js 16 renamed the `middleware` file convention to `proxy`. The Supabase
helper in `lib/supabase/middleware.ts` keeps its name to match Supabase's own
documentation.)

## Data model

```
profiles ──< carriers ──< carrier_service_areas
    │            │      └< carrier_availability
    │            │
    └──< moves ──┼──< move_items >── catalog_items
           │     │  └< move_photos
           │     │
           └──< quotes ──< bookings ──< payments
                              │
pricing_config              audit_log
```

`bookings.quote_id` is unique and `ON DELETE RESTRICT`: a quote that has been
booked cannot be deleted out from under the booking.

`payments` is unique on `(booking_id, stage)`, so each of the three stages can
exist at most once per booking.
