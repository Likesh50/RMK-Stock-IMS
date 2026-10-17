const test = require('node:test');
const assert = require('node:assert/strict');
const { allocateFifo } = require('../inventoryValuation');

test('allocates old dispatches only from lots acquired by dispatch date', () => {
  const result = allocateFifo([
    { batch_id: 1, purchase_id: 10, acquired_date: '2026-01-01', remaining_quantity: 10, unit_rate: 100 },
    { batch_id: 2, purchase_id: 20, acquired_date: '2026-02-01', remaining_quantity: 10, unit_rate: 200 }
  ], 2, '2026-01-31');

  assert.equal(result.amount, 200);
  assert.deepEqual(result.allocations.map(allocation => allocation.purchase_id), [10]);
});

test('allocates new dispatches using the remaining purchase batch rate', () => {
  const result = allocateFifo([
    { batch_id: 1, purchase_id: 10, acquired_date: '2026-01-01', remaining_quantity: 0, unit_rate: 100 },
    { batch_id: 2, purchase_id: 20, acquired_date: '2026-02-01', remaining_quantity: 10, unit_rate: 200 }
  ], 2, '2026-02-02');

  assert.equal(result.amount, 400);
  assert.equal(result.allocations[0].unit_rate, 200);
});

test('keeps legacy quantities identifiable as unvalued instead of assigning a rate', () => {
  const result = allocateFifo([
    { batch_id: 1, batch_type: 'legacy', purchase_id: null, acquired_date: '2026-02-02', remaining_quantity: 3, unit_rate: null }
  ], 2, '2026-02-02');

  assert.equal(result.amount, null);
  assert.equal(result.fully_valued, false);
  assert.equal(result.allocations[0].unit_rate, null);
});

test('allows migrated legacy opening stock for a backdated dispatch without inventing its cost', () => {
  const result = allocateFifo([
    {
      batch_id: 7,
      batch_type: 'legacy',
      purchase_id: null,
      acquired_date: '2026-10-16',
      available_date: '2026-10-16',
      remaining_quantity: 1,
      unit_rate: null,
      valuation_status: 'legacy_unvalued'
    }
  ], 1, '2026-10-14');

  assert.equal(result.allocations[0].batch_id, 7);
  assert.equal(result.amount, null);
  assert.equal(result.allocations[0].unit_rate, null);
});

test('consumes migration opening stock before later-entered backdated purchases', () => {
  const result = allocateFifo([
    { batch_id: 1, batch_type: 'purchase', purchase_id: 10, acquired_date: '2025-01-01', available_date: '2026-02-01', remaining_quantity: 10, unit_rate: 100 },
    { batch_id: 2, batch_type: 'legacy', purchase_id: null, acquired_date: '2026-02-01', available_date: '2026-02-01', remaining_quantity: 3, unit_rate: null }
  ], 2, '2026-02-02');

  assert.equal(result.amount, null);
  assert.equal(result.allocations[0].batch_id, 2);
});

test('does not treat purchase line amount as a unit rate', () => {
  const result = allocateFifo([
    { batch_id: 1, purchase_id: 10, acquired_date: '2026-01-01', remaining_quantity: 10, unit_rate: 100, amount: 1000 }
  ], 2, '2026-01-02');

  assert.equal(result.amount, 200);
});

test('rejects quantities that cannot be covered by eligible dated stock', () => {
  assert.throws(
    () => allocateFifo([
      { batch_id: 1, purchase_id: 20, acquired_date: '2026-02-01', remaining_quantity: 10, unit_rate: 200 }
    ], 2, '2026-01-31'),
    /Insufficient eligible batch stock/
  );
});

test('does not use a batch acquired on the dispatch date when event order is unknown', () => {
  assert.throws(
    () => allocateFifo([
      { batch_id: 1, purchase_id: 10, acquired_date: '2026-01-02', remaining_quantity: 10, unit_rate: 100 }
    ], 2, '2026-01-02'),
    /Insufficient eligible batch stock/
  );
});

test('allows a batch on its available date for dispatches, including backdated dispatches', () => {
  const batch = {
    batch_id: 2049,
    batch_type: 'purchase',
    purchase_id: 3580,
    item_id: 1094,
    location_id: 1,
    acquired_date: '2026-10-14',
    available_date: '2026-10-16',
    remaining_quantity: 200,
    unit_rate: 309.32
  };

  assert.throws(
    () => allocateFifo([batch], 100, '2026-10-07'),
    error => error.diagnostics.excluded_batches[0].exclusion_reasons[0] === 'acquired_after_dispatch_date'
  );
  assert.throws(
    () => allocateFifo([batch], 100, '2026-10-14'),
    error => error.diagnostics.excluded_batches[0].exclusion_reasons[0] === 'acquired_after_dispatch_date'
  );

  const result = allocateFifo([batch], 100, '2026-10-16');
  assert.equal(result.amount, 30932);
  assert.equal(result.allocations[0].batch_id, 2049);
});

test('allows same-day acquired stock only when explicitly recorded as acquired today', () => {
  const batch = {
    batch_id: 18,
    batch_type: 'purchase',
    acquired_date: '2026-10-17',
    available_date: '2026-10-17',
    remaining_quantity: 3,
    unit_rate: 125
  };

  assert.throws(
    () => allocateFifo([batch], 1, '2026-10-17'),
    /Insufficient eligible batch stock/
  );
  assert.equal(allocateFifo([batch], 1, '2026-10-17', { allowSameDayAcquired: true }).amount, 125);
});

test('includes eligible quantity and exclusion reasons on insufficient dated stock', () => {
  assert.throws(
    () => allocateFifo([
      { batch_id: 16, batch_type: 'legacy', acquired_date: '2026-10-16', available_date: '2026-10-16', remaining_quantity: 2, unit_rate: null },
      { batch_id: 17, batch_type: 'transfer', acquired_date: '2026-10-15', available_date: '2026-10-17', remaining_quantity: 3, unit_rate: 100 }
    ], 4, '2026-10-16'),
    error => {
      assert.match(error.message, /Insufficient eligible batch stock/);
      assert.equal(error.diagnostics.eligible_quantity, 2);
      assert.deepEqual(error.diagnostics.excluded_batches[0].exclusion_reasons, ['available_after_dispatch_date']);
      return true;
    }
  );
});

test('preserves a transferred lot original FIFO age and permits its available date', () => {
  const batch = {
    batch_id: 3,
    batch_type: 'transfer',
    purchase_id: 10,
    acquired_date: '2026-01-01',
    available_date: '2026-02-01',
    remaining_quantity: 10,
    unit_rate: 100
  };

  assert.equal(allocateFifo([batch], 2, '2026-02-01').amount, 200);
  assert.equal(allocateFifo([batch], 2, '2026-02-02').amount, 200);
});

test('does not allocate a later-entered backdated purchase before it became available', () => {
  assert.throws(
    () => allocateFifo([
      {
        batch_id: 4,
        batch_type: 'purchase',
        purchase_id: 11,
        acquired_date: '2026-01-01',
        available_date: '2026-02-01',
        remaining_quantity: 10,
        unit_rate: 100
      }
    ], 2, '2026-01-31'),
    /Insufficient eligible batch stock/
  );
});

test('does not allocate a future-dated purchase before its purchase date', () => {
  assert.throws(
    () => allocateFifo([
      {
        batch_id: 5,
        batch_type: 'purchase',
        purchase_id: 12,
        acquired_date: '2026-03-01',
        available_date: '2026-02-01',
        remaining_quantity: 10,
        unit_rate: 200
      }
    ], 2, '2026-02-28'),
    /Insufficient eligible batch stock/
  );
});
