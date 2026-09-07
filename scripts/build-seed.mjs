// Regenerates supabase/seed.sql from the human-editable files in seed/.
//
// When MoveSpeedia sends the real cube sheet and pricing numbers, edit
// seed/catalog_items.csv and seed/pricing_config.json, run `pnpm seed:build`,
// then `pnpm db:reset`. No application code changes.

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sqlString = (value) =>
  value === null || value === undefined ? 'null' : `'${String(value).replace(/'/g, "''")}'`

// Minimal RFC-4180 parser: handles quoted fields and escaped quotes.
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

const csv = parseCsv(readFileSync(resolve(root, 'seed/catalog_items.csv'), 'utf8'))
const header = csv.shift().map((h) => h.trim())
const items = csv.map((cells) => Object.fromEntries(header.map((key, i) => [key, cells[i]])))

const pricing = JSON.parse(readFileSync(resolve(root, 'seed/pricing_config.json'), 'utf8'))

const stageSum = Number(pricing.deposit_pct) + Number(pricing.pre_move_pct) + Number(pricing.delivery_pct)
if (stageSum !== 100) {
  throw new Error(`Payment stage percentages must sum to 100, got ${stageSum}`)
}

const seen = new Set()
csv.forEach((cells, index) => {
  if (cells.length !== header.length) {
    throw new Error(
      `seed/catalog_items.csv row ${index + 2} has ${cells.length} columns, expected ${header.length}. ` +
        'Embedded double quotes must be escaped by doubling them ("").'
    )
  }
})

for (const item of items) {
  for (const key of header) {
    if (item[key] === undefined || String(item[key]).trim() === '') {
      throw new Error(`Catalog item "${item.slug}" is missing a value for "${key}"`)
    }
  }
  if (!(Number(item.cubic_feet) > 0)) {
    throw new Error(`Catalog item "${item.slug}" has a non-positive cubic_feet value`)
  }
  if (!Number.isInteger(Number(item.sort_order))) {
    throw new Error(`Catalog item "${item.slug}" has a non-integer sort_order`)
  }
  if (seen.has(item.slug)) {
    throw new Error(`Duplicate catalog slug "${item.slug}"`)
  }
  seen.add(item.slug)
}

const catalogValues = items
  .map(
    (item) =>
      `  (${sqlString(item.slug)}, ${sqlString(item.category)}, ${sqlString(item.name_en)}, ` +
      `${sqlString(item.name_es)}, ${Number(item.cubic_feet)}, ${Number(item.sort_order)}, true)`
  )
  .join(',\n')

const sql = `-- GENERATED FILE — do not edit by hand.
-- Source: seed/catalog_items.csv and seed/pricing_config.json
-- Regenerate with: pnpm seed:build
--
-- Every value below is a PLACEHOLDER awaiting confirmation from MoveSpeedia.
-- The is_placeholder flags drive the warning banners in the admin dashboard.

insert into public.pricing_config (
  id, base_rate, rate_per_cubic_foot, cubic_feet_to_pounds_factor, minimum_charge,
  included_miles, rate_per_mile, stairs_fee_per_flight, long_carry_fee,
  packing_fee_per_cubic_foot, deposit_pct, pre_move_pct, delivery_pct,
  quote_valid_days, platform_commission_pct, is_placeholder
) values (
  true, ${pricing.base_rate}, ${pricing.rate_per_cubic_foot}, ${pricing.cubic_feet_to_pounds_factor},
  ${pricing.minimum_charge}, ${pricing.included_miles}, ${pricing.rate_per_mile},
  ${pricing.stairs_fee_per_flight}, ${pricing.long_carry_fee}, ${pricing.packing_fee_per_cubic_foot},
  ${pricing.deposit_pct}, ${pricing.pre_move_pct}, ${pricing.delivery_pct},
  ${pricing.quote_valid_days}, ${pricing.platform_commission_pct}, ${pricing.is_placeholder}
)
on conflict (id) do nothing;

insert into public.catalog_items
  (slug, category, name_en, name_es, cubic_feet, sort_order, is_placeholder)
values
${catalogValues}
on conflict (slug) do update set
  category       = excluded.category,
  name_en        = excluded.name_en,
  name_es        = excluded.name_es,
  cubic_feet     = excluded.cubic_feet,
  sort_order     = excluded.sort_order,
  is_placeholder = excluded.is_placeholder;
`

writeFileSync(resolve(root, 'supabase/seed.sql'), sql)
console.log(`seed.sql written — ${items.length} catalog items, pricing config v1`)
