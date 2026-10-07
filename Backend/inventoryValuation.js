const roundMoney = value => Number(Number(value).toFixed(2));

const compareBatches = (left, right) => {
  if (left.batch_type === 'legacy' && right.batch_type !== 'legacy') return -1;
  if (right.batch_type === 'legacy' && left.batch_type !== 'legacy') return 1;

  const dateDifference = String(left.acquired_date).localeCompare(String(right.acquired_date));
  if (dateDifference !== 0) return dateDifference;

  const leftPurchaseId = Number(left.purchase_id) || 0;
  const rightPurchaseId = Number(right.purchase_id) || 0;
  if (leftPurchaseId !== rightPurchaseId) return leftPurchaseId - rightPurchaseId;

  return Number(left.batch_id) - Number(right.batch_id);
};

const allocateFifo = (batches, quantity, dispatchDate) => {
  const requestedQuantity = Number(quantity);
  if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
    throw new Error('Dispatch quantity must be a positive whole number');
  }

  const eligibleBatches = batches
    .filter(batch => {
      const isLegacy = batch.batch_type === 'legacy';
      const acquiredDate = String(batch.acquired_date);
      const availableDate = String(batch.available_date || batch.acquired_date);
      const acquiredBeforeDispatch = acquiredDate < dispatchDate || (isLegacy && acquiredDate === dispatchDate);
      const availableBeforeDispatch = availableDate < dispatchDate || (isLegacy && availableDate === dispatchDate);

      return Number(batch.remaining_quantity) > 0 && acquiredBeforeDispatch && availableBeforeDispatch;
    })
    .sort(compareBatches);

  let remainingToAllocate = requestedQuantity;
  const allocations = [];

  for (const batch of eligibleBatches) {
    if (remainingToAllocate === 0) break;

    const allocatedQuantity = Math.min(
      Number(batch.remaining_quantity),
      remainingToAllocate
    );
    const unitRate = batch.unit_rate == null ? null : Number(batch.unit_rate);

    allocations.push({
      batch_id: Number(batch.batch_id),
      purchase_id: batch.purchase_id == null ? null : Number(batch.purchase_id),
      acquired_date: String(batch.acquired_date),
      quantity: allocatedQuantity,
      unit_rate: unitRate,
      amount: unitRate == null ? null : roundMoney(allocatedQuantity * unitRate)
    });

    remainingToAllocate -= allocatedQuantity;
  }

  if (remainingToAllocate > 0) {
    throw new Error('Insufficient eligible batch stock for dispatch date');
  }

  const fullyValued = allocations.every(allocation => allocation.amount != null);
  const amount = fullyValued
    ? roundMoney(allocations.reduce((sum, allocation) => sum + allocation.amount, 0))
    : null;

  return {
    allocations,
    amount,
    fully_valued: fullyValued
  };
};

module.exports = { allocateFifo, roundMoney };