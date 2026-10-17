-- Read-only audit for determining whether dispatch costs can be reconstructed.
-- Run with the `inventory` database selected. This file contains SELECTs only.
-- Export each result set as CSV, keeping the result-set numbers in the filenames.

-- 1. Confirm database and relevant columns. This also tells us whether the
--    source tables have timestamps or other ordering evidence.
SELECT DATABASE() AS database_name, VERSION() AS mysql_version;

SELECT
  TABLE_NAME AS table_name,
  ORDINAL_POSITION AS column_position,
  COLUMN_NAME AS column_name,
  COLUMN_TYPE AS column_type,
  IS_NULLABLE AS is_nullable,
  COLUMN_DEFAULT AS column_default
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'purchases', 'dispatch', 'transfer', 'stock', 'items', 'locations',
    'inventory_batches', 'dispatch_allocations', 'transfer_allocations',
    'report_value_overrides'
  )
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- 2. Summary of coverage and valuation status.
SELECT
  (SELECT COUNT(*) FROM purchases) AS purchase_rows,
  (SELECT COUNT(*) FROM dispatch) AS dispatch_rows,
  (SELECT COUNT(*) FROM transfer) AS transfer_rows,
  (SELECT COUNT(*) FROM stock) AS stock_rows,
  (SELECT COUNT(*) FROM inventory_batches) AS batch_rows,
  (SELECT COUNT(*) FROM dispatch_allocations) AS dispatch_allocation_rows,
  (SELECT COUNT(*) FROM transfer_allocations) AS transfer_allocation_rows,
  (SELECT COUNT(*) FROM report_value_overrides) AS override_rows;

SELECT
  batch_type,
  valuation_status,
  COUNT(*) AS batch_count,
  SUM(received_quantity) AS received_quantity,
  SUM(remaining_quantity) AS remaining_quantity,
  SUM(unit_rate IS NULL) AS batches_without_rate,
  MIN(acquired_date) AS earliest_acquired,
  MAX(acquired_date) AS latest_acquired,
  MIN(available_date) AS earliest_available,
  MAX(available_date) AS latest_available
FROM inventory_batches
GROUP BY batch_type, valuation_status
ORDER BY batch_type, valuation_status;

SELECT
  d.valuation_status,
  COUNT(*) AS dispatch_count,
  SUM(d.quantity) AS dispatched_quantity,
  SUM(COALESCE(a.allocation_rows, 0)) AS allocation_rows,
  SUM(COALESCE(a.allocated_quantity, 0)) AS allocated_quantity,
  SUM(COALESCE(a.unvalued_rows, 0)) AS unvalued_allocation_rows
FROM dispatch d
LEFT JOIN (
  SELECT dispatch_id,
         COUNT(*) AS allocation_rows,
         SUM(quantity) AS allocated_quantity,
         SUM(valuation_status <> 'valued' OR amount IS NULL) AS unvalued_rows
  FROM dispatch_allocations
  GROUP BY dispatch_id
) a ON a.dispatch_id = d.dispatch_id
GROUP BY d.valuation_status
ORDER BY d.valuation_status;

-- 3. Purchase cost source rows. `rate` is the unit rate; `amount` is the
--    historical line amount. Keep invoice/shop/location fields for matching.
SELECT
  p.purchase_id,
  p.purchase_date,
  p.invoice_no,
  p.item_id,
  i.item_name,
  p.location_id,
  p.shop_id,
  p.quantity,
  p.rate,
  p.amount AS line_amount,
  p.line_amount AS migrated_line_amount,
  p.purchase_header_id
FROM purchases p
LEFT JOIN items i ON i.item_id = p.item_id
ORDER BY p.item_id, p.location_id, p.purchase_date, p.purchase_id;

-- 4. Full dispatch event history and any current cost allocations/overrides.
SELECT
  d.dispatch_id,
  d.dispatch_date,
  d.item_id,
  i.item_name,
  d.location_id,
  d.quantity,
  d.remaining_quantity,
  d.valuation_status,
  a.batch_id,
  a.quantity AS allocated_quantity,
  a.unit_rate AS allocated_unit_rate,
  a.amount AS allocated_amount,
  a.valuation_status AS allocation_valuation_status,
  o.price AS manual_price_override,
  o.total AS manual_total_override
FROM dispatch d
LEFT JOIN items i ON i.item_id = d.item_id
LEFT JOIN dispatch_allocations a ON a.dispatch_id = d.dispatch_id
LEFT JOIN report_value_overrides o
  ON o.override_key = CONCAT('dispatch:', d.dispatch_id)
ORDER BY d.item_id, d.location_id, d.dispatch_date, d.dispatch_id, a.batch_id;

-- 5. Full transfer event history and allocation costs. Transfers move costs
--    between locations and are needed to replay each location's stock lots.
SELECT
  t.transfer_id,
  t.date AS transfer_date,
  t.item_id,
  i.item_name,
  t.from_location_id,
  src.location_name AS from_location_name,
  t.to_location_id,
  dst.location_name AS to_location_name,
  t.quantity,
  a.source_batch_id,
  a.destination_batch_id,
  a.quantity AS allocated_quantity,
  a.unit_rate AS allocated_unit_rate,
  a.amount AS allocated_amount,
  a.valuation_status AS allocation_valuation_status
FROM transfer t
LEFT JOIN items i ON i.item_id = t.item_id
LEFT JOIN locations src ON src.location_id = t.from_location_id
LEFT JOIN locations dst ON dst.location_id = t.to_location_id
LEFT JOIN transfer_allocations a ON a.transfer_id = t.transfer_id
ORDER BY t.item_id, t.date, t.transfer_id, a.source_batch_id;

-- 6. Current stock and batch balances by item/location. These must reconcile
--    before any proposed recovery is applied.
SELECT
  s.item_id,
  i.item_name,
  s.location_id,
  l.location_name,
  s.quantity AS stock_quantity,
  COALESCE(b.batch_quantity, 0) AS batch_quantity,
  COALESCE(b.unvalued_quantity, 0) AS unvalued_batch_quantity,
  COALESCE(b.valued_quantity, 0) AS valued_batch_quantity
FROM stock s
LEFT JOIN items i ON i.item_id = s.item_id
LEFT JOIN locations l ON l.location_id = s.location_id
LEFT JOIN (
  SELECT item_id, location_id,
         SUM(remaining_quantity) AS batch_quantity,
         SUM(CASE WHEN unit_rate IS NULL OR valuation_status <> 'valued'
                  THEN remaining_quantity ELSE 0 END) AS unvalued_quantity,
         SUM(CASE WHEN unit_rate IS NOT NULL AND valuation_status = 'valued'
                  THEN remaining_quantity ELSE 0 END) AS valued_quantity
  FROM inventory_batches
  GROUP BY item_id, location_id
) b ON b.item_id = s.item_id AND b.location_id = s.location_id
ORDER BY s.item_id, s.location_id;

-- 7. Existing overrides, if any.
SELECT override_key, price, amount, total, updated_at
FROM report_value_overrides
ORDER BY override_key;
