-- GENERATED FILE — do not edit by hand.
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
  true, 250, 4.5, 7,
  600, 30, 2.5,
  75, 100, 1.25,
  25, 50, 25,
  7, 10, true
)
on conflict (id) do nothing;

insert into public.catalog_items
  (slug, category, name_en, name_es, cubic_feet, sort_order, is_placeholder)
values
  ('sofa-3-cushion', 'living_room', 'Sofa, 3-cushion', 'Sofá de 3 plazas', 50, 10, true),
  ('sofa-loveseat', 'living_room', 'Loveseat / 2-cushion sofa', 'Sofá de 2 plazas (love seat)', 35, 20, true),
  ('sectional-piece', 'living_room', 'Sectional sofa (per piece)', 'Sofá seccional (por pieza)', 30, 30, true),
  ('armchair', 'living_room', 'Armchair', 'Sillón', 25, 40, true),
  ('recliner', 'living_room', 'Recliner', 'Sillón reclinable', 30, 50, true),
  ('coffee-table', 'living_room', 'Coffee table', 'Mesa de centro', 10, 60, true),
  ('end-table', 'living_room', 'End table', 'Mesa lateral', 5, 70, true),
  ('bookcase-small', 'living_room', 'Bookcase, small', 'Librero chico', 10, 80, true),
  ('bookcase-large', 'living_room', 'Bookcase, large', 'Librero grande', 30, 90, true),
  ('tv-under-50', 'living_room', 'TV, flat screen up to 50"', 'Televisión de pantalla plana (hasta 50")', 10, 100, true),
  ('tv-over-50', 'living_room', 'TV, flat screen over 50"', 'Televisión de pantalla plana (más de 50")', 16, 110, true),
  ('tv-stand', 'living_room', 'TV stand / media console', 'Mueble para TV', 15, 120, true),
  ('floor-lamp', 'living_room', 'Floor lamp', 'Lámpara de pie', 3, 130, true),
  ('rug-large', 'living_room', 'Rug, large (rolled)', 'Alfombra grande (enrollada)', 10, 140, true),
  ('ottoman', 'living_room', 'Ottoman', 'Otomana / puff', 5, 150, true),
  ('mattress-twin', 'bedroom', 'Mattress, twin', 'Colchón individual', 20, 10, true),
  ('mattress-full', 'bedroom', 'Mattress, full', 'Colchón matrimonial', 25, 20, true),
  ('mattress-queen', 'bedroom', 'Mattress, queen', 'Colchón queen size', 30, 30, true),
  ('mattress-king', 'bedroom', 'Mattress, king', 'Colchón king size', 35, 40, true),
  ('box-spring-twin', 'bedroom', 'Box spring, twin', 'Base de cama individual (box spring)', 20, 50, true),
  ('box-spring-queen', 'bedroom', 'Box spring, queen', 'Base de cama queen (box spring)', 30, 60, true),
  ('bed-frame', 'bedroom', 'Bed frame / headboard', 'Cabecera y base de cama', 15, 70, true),
  ('dresser-single', 'bedroom', 'Dresser, single', 'Cómoda sencilla', 20, 80, true),
  ('dresser-double', 'bedroom', 'Dresser, double', 'Cómoda doble', 30, 90, true),
  ('chest-of-drawers', 'bedroom', 'Chest of drawers', 'Cajonera', 25, 100, true),
  ('nightstand', 'bedroom', 'Nightstand', 'Buró', 5, 110, true),
  ('wardrobe', 'bedroom', 'Wardrobe / armoire', 'Ropero / armario', 40, 120, true),
  ('mirror-large', 'bedroom', 'Mirror, large', 'Espejo grande', 5, 130, true),
  ('crib', 'bedroom', 'Crib', 'Cuna', 15, 140, true),
  ('dining-table', 'dining_room', 'Dining table', 'Mesa de comedor', 30, 10, true),
  ('dining-chair', 'dining_room', 'Dining chair', 'Silla de comedor', 5, 20, true),
  ('china-cabinet', 'dining_room', 'China cabinet / hutch', 'Vitrina / trinchador', 45, 30, true),
  ('buffet', 'dining_room', 'Buffet / sideboard', 'Buffet / aparador', 30, 40, true),
  ('bar-stool', 'dining_room', 'Bar stool', 'Banco de bar', 5, 50, true),
  ('refrigerator', 'appliances', 'Refrigerator, standard', 'Refrigerador estándar', 45, 10, true),
  ('refrigerator-large', 'appliances', 'Refrigerator, large / French door', 'Refrigerador grande (dos puertas)', 60, 20, true),
  ('freezer-upright', 'appliances', 'Freezer, upright', 'Congelador vertical', 30, 30, true),
  ('range-stove', 'appliances', 'Range / stove', 'Estufa', 30, 40, true),
  ('dishwasher', 'appliances', 'Dishwasher', 'Lavavajillas', 20, 50, true),
  ('microwave', 'appliances', 'Microwave', 'Horno de microondas', 5, 60, true),
  ('washer', 'appliances', 'Washing machine', 'Lavadora', 25, 70, true),
  ('dryer', 'appliances', 'Clothes dryer', 'Secadora', 25, 80, true),
  ('kitchen-cart', 'appliances', 'Kitchen cart', 'Carrito de cocina', 10, 90, true),
  ('desk-small', 'office', 'Desk, small', 'Escritorio pequeño', 20, 10, true),
  ('desk-executive', 'office', 'Desk, executive', 'Escritorio ejecutivo', 40, 20, true),
  ('office-chair', 'office', 'Office chair', 'Silla de oficina', 10, 30, true),
  ('filing-cabinet-2', 'office', 'Filing cabinet, 2-drawer', 'Archivero de 2 gavetas', 10, 40, true),
  ('filing-cabinet-4', 'office', 'Filing cabinet, 4-drawer', 'Archivero de 4 gavetas', 20, 50, true),
  ('computer-monitor', 'office', 'Computer and monitor', 'Computadora y monitor', 5, 60, true),
  ('printer', 'office', 'Printer', 'Impresora', 5, 70, true),
  ('bicycle', 'garage_outdoor', 'Bicycle', 'Bicicleta', 10, 10, true),
  ('lawn-mower', 'garage_outdoor', 'Lawn mower, push', 'Podadora de césped', 15, 20, true),
  ('grill', 'garage_outdoor', 'Grill / BBQ', 'Asador / parrilla', 20, 30, true),
  ('patio-table', 'garage_outdoor', 'Patio table', 'Mesa de patio', 20, 40, true),
  ('patio-chair', 'garage_outdoor', 'Patio chair', 'Silla de patio', 5, 50, true),
  ('ladder', 'garage_outdoor', 'Ladder', 'Escalera de mano', 10, 60, true),
  ('tool-chest', 'garage_outdoor', 'Tool chest', 'Caja de herramientas', 15, 70, true),
  ('garden-tools', 'garage_outdoor', 'Garden tools (bundle)', 'Herramientas de jardín (paquete)', 10, 80, true),
  ('exercise-equipment', 'garage_outdoor', 'Treadmill / exercise equipment', 'Caminadora / equipo de ejercicio', 30, 90, true),
  ('box-small', 'boxes', 'Small box (1.5 cu ft)', 'Caja chica (1.5 pies³)', 1.5, 10, true),
  ('box-medium', 'boxes', 'Medium box (3.0 cu ft)', 'Caja mediana (3.0 pies³)', 3, 20, true),
  ('box-large', 'boxes', 'Large box (4.5 cu ft)', 'Caja grande (4.5 pies³)', 4.5, 30, true),
  ('box-extra-large', 'boxes', 'Extra large box (6.0 cu ft)', 'Caja extragrande (6.0 pies³)', 6, 40, true),
  ('box-wardrobe', 'boxes', 'Wardrobe box', 'Caja para ropa colgada', 10, 50, true),
  ('box-dish-pack', 'boxes', 'Dish pack', 'Caja para vajilla', 5.2, 60, true),
  ('box-picture', 'boxes', 'Picture / mirror box', 'Caja para cuadros y espejos', 3, 70, true)
on conflict (slug) do update set
  category       = excluded.category,
  name_en        = excluded.name_en,
  name_es        = excluded.name_es,
  cubic_feet     = excluded.cubic_feet,
  sort_order     = excluded.sort_order,
  is_placeholder = excluded.is_placeholder;
