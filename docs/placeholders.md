# Placeholder data

Development began before MoveSpeedia supplied the inventory cube sheet and
pricing figures. Every provisional value is isolated in two files so that
replacing them is a **data change, not a code change**.

Nothing in `src/` hardcodes a price or a cubic-foot value.

## What is provisional

| What | Where | Status |
| --- | --- | --- |
| 66 inventory items and their cubic-foot values | `seed/catalog_items.csv` | Awaiting client cube sheet |
| All pricing inputs | `seed/pricing_config.json` | Awaiting client figures |

Both are flagged in the database by an `is_placeholder` column, which drives
the warning banner shown in the app and the admin dashboard. Nobody can mistake
these for approved numbers.

## Current placeholder pricing

| Field | Value | Notes |
| --- | --- | --- |
| `base_rate` | $250.00 | Flat charge per move |
| `rate_per_cubic_foot` | $4.50 | |
| `cubic_feet_to_pounds_factor` | 7.0 | Common industry default |
| `minimum_charge` | $600.00 | |
| `included_miles` | 30 | Miles before per-mile charges apply |
| `rate_per_mile` | $2.50 | |
| `stairs_fee_per_flight` | $75.00 | |
| `long_carry_fee` | $100.00 | |
| `packing_fee_per_cubic_foot` | $1.25 | |
| Payment stages | 25 / 50 / 25 | Deposit / pre-move / delivery |
| `quote_valid_days` | 7 | |
| `platform_commission_pct` | 10 | |

The cubic-foot values in the catalog follow standard moving-industry cube
sheets. They are reasonable, but they are not MoveSpeedia's.

## Replacing them

1. Edit `seed/catalog_items.csv` and `seed/pricing_config.json`.
2. Set `"is_placeholder": false` in the JSON, and change the last column of the
   catalog rows if those values are now confirmed.
3. Run `pnpm seed:build` — this regenerates `supabase/seed.sql` and validates
   the data, failing loudly on a malformed row, a duplicate slug, a
   non-positive volume, or payment stages that don't sum to 100.
4. Run `pnpm db:reset` locally to verify, then apply to the hosted project.

### CSV format note

Embedded double quotes must be escaped by doubling them, per RFC 4180:

```csv
tv-under-50,living_room,"TV, flat screen up to 50""","Televisión de pantalla plana (hasta 50"")",10,100
```

A backslash-escaped quote is not valid CSV and will be rejected by
`pnpm seed:build`.

## Once live, prices change in the admin dashboard

The seed files are for **initial setup**. After the pricing config row exists,
the admin dashboard is the place to change pricing — it edits the same row and
bumps `pricing_config.version`, which keeps historical quotes explainable.
Re-seeding will not overwrite an existing pricing config row.

## Still to be decided by the client

These are open questions, not placeholders — they change what gets built:

- **Do carriers get paid through the platform?** If money must split to
  carriers automatically, that requires Stripe Connect (carrier onboarding,
  KYC, payouts) and is substantially more work than taking payments alone.
  The current schema assumes carriers are paid outside the platform.
- **Refund and cancellation policy.** Required before the three-stage payment
  flow can be finished — specifically what happens after stage two has been
  charged.
- **Carrier licensing.** `carriers` has `cal_t_number`, `dot_number`, and
  `mc_number` fields. Whether these are displayed to customers, and whether
  they are required for a carrier to go active, is a business decision.
