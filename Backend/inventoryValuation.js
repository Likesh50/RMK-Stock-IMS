const roundMoney = value => Number(Number(value).toFixed(2));

const compareBatches = (left, right) => {
  const leftAvailableDate = String(left.available_date || left.acquired_date);
  const rightAvailableDate = String(right.available_date || right.acquired_date);
  const availabilityDifference = leftAvailableDate.localeCompare(rightAvailableDate);
  if (availabilityDifference !== 0) return availabilityDifference;

  // A migrated opening-stock batch and a later-entered purchase can share the
  // migration/receipt date. Consume the opening stock first; its original age
  // and cost are unknown, so a backdated purchase must not mask it.
  const leftIsLegacy = left.batch_type === 'legacy';
  const rightIsLegacy = right.batch_type === 'legacy';
  if (leftIsLegacy !== rightIsLegacy) return leftIsLegacy ? -1 : 1;

  const dateDifference = String(left.acquired_date).localeCompare(String(right.acquired_date));
  if (dateDifference !== 0) return dateDifference;

  const leftPurchaseId = Number(left.purchase_id) || 0;
  const rightPurchaseId = Number(right.purchase_id) || 0;
  if (leftPurchaseId !== rightPurchaseId) return leftPurchaseId - rightPurchaseId;

  return Number(left.batch_id) - Number(right.batch_id);
};

const allocateFifo = (batches, quantity, dispatchDate, options = {}) => {
  const requestedQuantity = Number(quantity);
  const allowSameDayAcquired = options.allowSameDayAcquired === true;
  if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
    throw new Error('Dispatch quantity must be a positive whole number');
  }

  const eligibility = batches.map(batch => {
      const isLegacy = batch.batch_type === 'legacy';
      const acquiredDate = String(batch.acquired_date);
      const availableDate = String(batch.available_date || batch.acquired_date);
      const remainingQuantity = Number(batch.remaining_quantity);
      const validDates = /^\d{4}-\d{2}-\d{2}$/.test(acquiredDate) && /^\d{4}-\d{2}-\d{2}$/.test(availableDate);
      // Migration opening-stock dates are placeholders (CURDATE), not source
      // acquisition/receipt dates. Keep those unvalued lots usable for
      // backdated entries while purchase and transfer lots stay date-strict.
      const acquiredBeforeDispatch = isLegacy || acquiredDate < dispatchDate ||
        (allowSameDayAcquired && acquiredDate === dispatchDate);
      // available_date is the first calendar date the receipt can be used.
      // Date-only records cannot express ordering within that day.
      const availableBeforeDispatch = isLegacy || availableDate <= dispatchDate;
      const reasons = [];

      if (!Number.isFinite(remainingQuantity) || remainingQuantity <= 0) reasons.push('no_remaining_quantity');
      if (!isLegacy && !validDates) reasons.push('invalid_batch_date');
      if (!isLegacy && validDates && !acquiredBeforeDispatch) reasons.push('acquired_after_dispatch_date');
      if (!isLegacy && validDates && acquiredBeforeDispatch && !availableBeforeDispatch) reasons.push('available_after_dispatch_date');

      return {
        batch,
        eligible: reasons.length === 0,
        reasons,
        remainingQuantity
      };
    });

  const eligibleBatches = eligibility
    .filter(entry => entry.eligible)
    .map(entry => entry.batch)
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
    const error = new Error('Insufficient eligible batch stock for dispatch date');
    error.code = 'INSUFFICIENT_ELIGIBLE_BATCH_STOCK';
    error.statusCode = 409;
    error.diagnostics = {
      eligible_quantity: eligibility
        .filter(entry => entry.eligible)
        .reduce((sum, entry) => sum + entry.remainingQuantity, 0),
      eligible_batches: eligibility
        .filter(entry => entry.eligible)
        .map(entry => ({
          batch_id: Number(entry.batch.batch_id),
          remaining_quantity: entry.remainingQuantity
        })),
      excluded_batches: eligibility
        .filter(entry => !entry.eligible)
        .map(entry => ({
          batch_id: Number(entry.batch.batch_id),
          batch_type: entry.batch.batch_type || null,
          acquired_date: entry.batch.acquired_date || null,
          available_date: entry.batch.available_date || null,
          remaining_quantity: Number.isFinite(entry.remainingQuantity) ? entry.remainingQuantity : null,
          exclusion_reasons: entry.reasons
        }))
    };
    throw error;
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
