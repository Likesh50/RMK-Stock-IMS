-- Run this once against the `inventory` database before deploying the updated API.
-- Existing purchases.amount remains the per-unit rate for backwards compatibility.

CREATE TABLE IF NOT EXISTS purchase_headers (
  purchase_header_id INT NOT NULL AUTO_INCREMENT,
  invoice_no VARCHAR(255) NOT NULL,
  shop_id INT NOT NULL,
  purchase_date DATE NOT NULL,
  location_id INT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  sgst DECIMAL(12,2) NOT NULL DEFAULT 0,
  cgst DECIMAL(12,2) NOT NULL DEFAULT 0,
  freight DECIMAL(12,2) NOT NULL DEFAULT 0,
  other_charges JSON NULL,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (purchase_header_id),
  INDEX idx_purchase_headers_purchase_date (purchase_date),
  INDEX idx_purchase_headers_invoice_no (invoice_no)
);

-- Use INFORMATION_SCHEMA checks so this is safe to re-run on the MySQL version
-- used by this project (which does not support ADD COLUMN IF NOT EXISTS).
SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE purchases ADD COLUMN line_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER amount',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'line_amount'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE purchases ADD COLUMN purchase_header_id INT NULL AFTER line_amount',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND COLUMN_NAME = 'purchase_header_id'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX idx_purchases_purchase_header_id ON purchases (purchase_header_id)',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'purchases' AND INDEX_NAME = 'idx_purchases_purchase_header_id'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

-- Preserve totals for records created before this feature. They remain header-less,
-- so their report GST & Others is correctly shown as zero.
UPDATE purchases
SET line_amount = quantity * amount
WHERE line_amount = 0;
