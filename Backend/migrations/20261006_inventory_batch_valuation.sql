-- Run once against the inventory database before deploying the batch valuation API.
-- Existing stock quantities are preserved as legacy batches with unknown cost.
-- Historical dispatches/transfers are deliberately not assigned guessed batches.

CREATE TABLE IF NOT EXISTS inventory_batches (
  batch_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_key VARCHAR(191) NOT NULL,
  batch_type ENUM('legacy', 'purchase', 'transfer') NOT NULL,
  item_id INT NOT NULL,
  location_id INT NOT NULL,
  purchase_id INT NULL,
  parent_batch_id BIGINT UNSIGNED NULL,
  source_transfer_id INT NULL,
  acquired_date DATE NOT NULL,
  available_date DATE NOT NULL,
  received_quantity INT NOT NULL,
  remaining_quantity INT NOT NULL,
  unit_rate DECIMAL(12,2) NULL,
  valuation_status ENUM('valued', 'unvalued', 'legacy_unvalued') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (batch_id),
  UNIQUE KEY uq_inventory_batches_source_key (source_key),
  KEY idx_inventory_batches_fifo (item_id, location_id, available_date, acquired_date, purchase_id, batch_id),
  KEY idx_inventory_batches_purchase (purchase_id),
  KEY idx_inventory_batches_parent (parent_batch_id),
  KEY idx_inventory_batches_transfer (source_transfer_id)
);

CREATE TABLE IF NOT EXISTS dispatch_allocations (
  allocation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  dispatch_id INT NOT NULL,
  batch_id BIGINT UNSIGNED NOT NULL,
  quantity INT NOT NULL,
  unit_rate DECIMAL(12,2) NULL,
  amount DECIMAL(12,2) NULL,
  valuation_status ENUM('valued', 'unvalued') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (allocation_id),
  UNIQUE KEY uq_dispatch_batch (dispatch_id, batch_id),
  KEY idx_dispatch_allocations_batch (batch_id)
);

CREATE TABLE IF NOT EXISTS transfer_allocations (
  allocation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  transfer_id INT NOT NULL,
  source_batch_id BIGINT UNSIGNED NOT NULL,
  destination_batch_id BIGINT UNSIGNED NOT NULL,
  quantity INT NOT NULL,
  unit_rate DECIMAL(12,2) NULL,
  amount DECIMAL(12,2) NULL,
  valuation_status ENUM('valued', 'unvalued') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (allocation_id),
  UNIQUE KEY uq_transfer_source_batch (transfer_id, source_batch_id),
  KEY idx_transfer_allocations_source_batch (source_batch_id),
  KEY idx_transfer_allocations_destination_batch (destination_batch_id)
);

CREATE TABLE IF NOT EXISTS report_value_overrides (
  override_key VARCHAR(191) NOT NULL,
  price DECIMAL(12,2) NULL,
  amount DECIMAL(12,2) NULL,
  total DECIMAL(12,2) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (override_key)
);

CREATE TABLE IF NOT EXISTS report_value_override_history (
  history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  override_key VARCHAR(191) NOT NULL,
  field_name ENUM('price', 'amount', 'total') NOT NULL,
  old_value DECIMAL(12,2) NULL,
  new_value DECIMAL(12,2) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (history_id),
  KEY idx_report_override_history_key (override_key, changed_at)
);

SET @sql = (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE dispatch ADD COLUMN valuation_status ENUM(''valued'', ''unvalued'', ''legacy_unallocated'') NOT NULL DEFAULT ''legacy_unallocated''',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'dispatch'
    AND COLUMN_NAME = 'valuation_status'
);
PREPARE statement FROM @sql;
EXECUTE statement;
DEALLOCATE PREPARE statement;

INSERT INTO inventory_batches (
  source_key,
  batch_type,
  item_id,
  location_id,
  acquired_date,
  available_date,
  received_quantity,
  remaining_quantity,
  unit_rate,
  valuation_status
)
SELECT
  CONCAT('legacy:', s.item_id, ':', s.location_id),
  'legacy',
  s.item_id,
  s.location_id,
  CURDATE(),
  CURDATE(),
  s.quantity,
  s.quantity,
  NULL,
  'legacy_unvalued'
FROM stock s
WHERE s.quantity > 0
ON DUPLICATE KEY UPDATE source_key = VALUES(source_key);