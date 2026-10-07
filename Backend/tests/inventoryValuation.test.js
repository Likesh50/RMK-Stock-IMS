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

test('preserves a transferred lot original FIFO age but waits until it is available', () => {
  const batch = {
    batch_id: 3,
    batch_type: 'transfer',
    purchase_id: 10,
    acquired_date: '2026-01-01',
    available_date: '2026-02-01',
    remaining_quantity: 10,
    unit_rate: 100
  };

  assert.throws(
    () => allocateFifo([batch], 2, '2026-02-01'),
    /Insufficient eligible batch stock/
  );
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