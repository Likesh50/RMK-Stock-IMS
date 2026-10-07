const express = require('express');
const db = require('../db'); // Assuming your database connection is set up in db.js
const router = express.Router();

router.get('/productStock', async (req, res) => {
  try {
    const { product_id } = req.query;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'product_id is required.'
      });
    }

    // Select all locations and left join stock for the given product_id
    const sql = `
      SELECT
        l.location_id,
        l.location_name,
        COALESCE(s.quantity, 0) AS quantity
      FROM locations l
      LEFT JOIN stock s
        ON s.location_id = l.location_id
        AND s.item_id = ?
      ORDER BY l.location_id ASC
    `;

    const [rows] = await db.query(sql, [product_id]);
    // Normalize result (ensure numeric types)
    const normalized = rows.map(r => ({
      location_id: Number(r.location_id),
      location_name: r.location_name,
      quantity: Number(r.quantity) || 0
    }));

    res.json({
      success: true,
      data: normalized
    });
  } catch (error) {
    console.error('Error fetching product stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product stock'
    });
  }
});


router.get('/dispatchReport', async (req, res) => {
  try {
    const { startDate, endDate, location_id, item_id, subcategory } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required.'
      });
    }

    /**
     * Fetch dispatch and transfer records with valuation from their persisted allocations.
     */

    // ---- DISPATCH SELECT ----
    let dispatchSelect = `
      SELECT 
        i.item_name,
        i.category,
        i.sub_category,
        d.quantity,
        d.dispatch_date,
        b.block_name,
        d.sticker_no,
        d.receiver,
        d.incharge,

        d.remaining_quantity AS available_quantity,

        COALESCE(aOverride.price, CASE
          WHEN d.valuation_status = 'valued'
            AND COALESCE(a.allocated_quantity, 0) = d.quantity
            AND COALESCE(a.unvalued_allocations, 0) = 0
          THEN a.allocated_amount / NULLIF(d.quantity, 0)
          ELSE NULL
        END) AS price,

        COALESCE(aOverride.total, CASE
          WHEN d.valuation_status = 'valued'
            AND COALESCE(a.allocated_quantity, 0) = d.quantity
            AND COALESCE(a.unvalued_allocations, 0) = 0
          THEN a.allocated_amount
          ELSE NULL
        END) AS total,
        d.valuation_status,

        'dispatch' AS source_type,
        CONCAT('dispatch:', d.dispatch_id) AS override_key

      FROM dispatch d

      JOIN items i 
        ON d.item_id = i.item_id

      LEFT JOIN blocks b 
        ON d.block_id = b.block_id
      LEFT JOIN (
        SELECT
          dispatch_id,
          SUM(quantity) AS allocated_quantity,
          SUM(amount) AS allocated_amount,
          SUM(CASE WHEN valuation_status <> 'valued' OR amount IS NULL THEN 1 ELSE 0 END) AS unvalued_allocations
        FROM dispatch_allocations
        GROUP BY dispatch_id
      ) a ON a.dispatch_id = d.dispatch_id
      LEFT JOIN report_value_overrides aOverride
        ON aOverride.override_key = CONCAT('dispatch:', d.dispatch_id)

      WHERE d.dispatch_date BETWEEN ? AND ?
    `;

    // ---- TRANSFER SELECT ----
    let transferSelect = `
      SELECT
        i.item_name,
        i.category,
        i.sub_category,
        t.quantity,
        t.date AS dispatch_date,
        CONCAT('TRANSFER to ', l.location_name) AS block_name,
        NULL AS sticker_no,
        NULL AS receiver,
        NULL AS incharge,
        NULL AS available_quantity,
        COALESCE(tOverride.price, CASE
          WHEN COALESCE(a.allocated_quantity, 0) = t.quantity
            AND COALESCE(a.unvalued_allocations, 0) = 0
          THEN a.allocated_amount / NULLIF(t.quantity, 0)
          ELSE NULL
        END) AS price,
        COALESCE(tOverride.total, CASE
          WHEN COALESCE(a.allocated_quantity, 0) = t.quantity
            AND COALESCE(a.unvalued_allocations, 0) = 0
          THEN a.allocated_amount
          ELSE NULL
        END) AS total,
        CASE
          WHEN COALESCE(a.allocated_quantity, 0) = t.quantity
            AND COALESCE(a.unvalued_allocations, 0) = 0
          THEN 'valued'
          ELSE 'unvalued'
        END AS valuation_status,
        'transfer' AS source_type,
        CONCAT('transfer:', t.transfer_id) AS override_key
      FROM transfer t
      JOIN items i ON t.item_id = i.item_id
      LEFT JOIN locations l ON l.location_id = t.to_location_id
      LEFT JOIN (
        SELECT
          transfer_id,
          SUM(quantity) AS allocated_quantity,
          SUM(amount) AS allocated_amount,
          SUM(CASE WHEN valuation_status <> 'valued' OR amount IS NULL THEN 1 ELSE 0 END) AS unvalued_allocations
        FROM transfer_allocations
        GROUP BY transfer_id
      ) a ON a.transfer_id = t.transfer_id
      LEFT JOIN report_value_overrides tOverride
        ON tOverride.override_key = CONCAT('transfer:', t.transfer_id)
      WHERE
        t.date BETWEEN ? AND ?
        AND t.from_location_id = ?
    `;

    // ---- PARAMS ----
    const params = [startDate, endDate];

    // apply location filter to dispatch (if provided)
    if (location_id) {
      dispatchSelect += ` AND d.location_id = ?`;
      params.push(location_id);
    }

    if (item_id) {
      dispatchSelect += ` AND d.item_id = ?`;
      params.push(item_id);
    }

    if (subcategory) {
      dispatchSelect += ` AND i.sub_category = ?`;
      params.push(subcategory);
    }

    // Add transfer params (startDate, endDate, from_location_id)
    params.push(startDate, endDate, location_id || null);

    if (item_id) {
      transferSelect += ` AND t.item_id = ?`;
      params.push(item_id);
    }

    if (subcategory) {
      transferSelect += ` AND i.sub_category = ?`;
      params.push(subcategory);
    }

    // ---- COMBINE BOTH ----
    const query = `
      ${dispatchSelect}
      UNION ALL
      ${transferSelect}
      ORDER BY dispatch_date ASC
    `;

    // ---- EXECUTE ----
    const [rows] = await db.query(query, params);

    // ---- Normalize results ----
    const normalizedRows = rows.map(r => ({
      item_name: r.item_name,
      category: r.category,
      sub_category: r.sub_category,
      quantity: Number(r.quantity) || 0,
      available_quantity: Number(r.available_quantity) || 0,
      price: r.price == null ? null : Number(r.price),
      total: r.total == null ? null : Number(r.total),
      valuation_status: r.valuation_status || 'legacy_unallocated',
      dispatch_date: r.dispatch_date,
      block_name: r.block_name || null,
      sticker_no: r.sticker_no || null,
      receiver: r.receiver || null,
      incharge: r.incharge || null,
      source_type: r.source_type,
      override_key: r.override_key
    }));

    // ---- Calculate Grand Total ----
    const hasUnvaluedRows = normalizedRows.some(row => row.total == null);
    const grandTotal = hasUnvaluedRows
      ? null
      : normalizedRows.reduce((sum, row) => sum + row.total, 0);

    res.json({
      success: true,
      data: normalizedRows,
      grandTotal: grandTotal == null ? null : Number(grandTotal.toFixed(2)),
      valuation_complete: !hasUnvaluedRows
    });
  } catch (error) {
    console.error('Error fetching dispatch report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dispatch report'
    });
  }
});

// Backend: Add to your router file (same style as other report routes)
router.get('/itemMovement', async (req, res) => {
  try {
    const { item_id, location_id, startDate, endDate } = req.query;

    if (!item_id) {
      return res.status(400).json({ success: false, message: 'item_id is required.' });
    }

    // Date filters: optional, use wide window if not provided
    const start = startDate || '1970-01-01';
    const end = endDate || '9999-12-31';

    // PURCHASES (to any location or optionally to a specific location)
    let purchaseSelect = `
      SELECT
        p.purchase_date AS dt,
        'purchase' AS source_type,
        p.quantity,
        p.rate AS price,
        p.amount AS amount,
        p.amount AS total,
        s.name AS source_name,
        p.location_id,
        NULL AS other_location_id,
        CONCAT('purchase:', p.purchase_id) AS override_key
      FROM purchases p
      LEFT JOIN shops s ON p.shop_id = s.id
      WHERE p.item_id = ?
        AND p.purchase_date BETWEEN ? AND ?
    `;
    const params = [item_id, start, end];

    if (location_id) {
      purchaseSelect += ` AND p.location_id = ? `;
      params.push(location_id);
    }

    // DISPATCH (items dispatched FROM a location)
    let dispatchSelect = `
      SELECT
        d.dispatch_date AS dt,
        'dispatch' AS source_type,
        d.quantity,
        CASE
          WHEN d.valuation_status = 'valued'
            AND COALESCE(da.allocated_quantity, 0) = d.quantity
            AND COALESCE(da.unvalued_allocations, 0) = 0
          THEN da.allocated_amount / NULLIF(d.quantity, 0)
          ELSE NULL
        END AS price,
        NULL AS amount,
        CASE
          WHEN d.valuation_status = 'valued'
            AND COALESCE(da.allocated_quantity, 0) = d.quantity
            AND COALESCE(da.unvalued_allocations, 0) = 0
          THEN da.allocated_amount
          ELSE NULL
        END AS total,
        COALESCE(b.block_name, CONCAT('Dispatch from loc ', d.location_id)) AS source_name,
        d.location_id,
        NULL AS other_location_id,
        CONCAT('dispatch:', d.dispatch_id) AS override_key
      FROM dispatch d
      LEFT JOIN blocks b ON b.block_id = d.block_id
      LEFT JOIN (
        SELECT
          dispatch_id,
          SUM(quantity) AS allocated_quantity,
          SUM(amount) AS allocated_amount,
          SUM(CASE WHEN valuation_status <> 'valued' OR amount IS NULL THEN 1 ELSE 0 END) AS unvalued_allocations
        FROM dispatch_allocations
        GROUP BY dispatch_id
      ) da ON da.dispatch_id = d.dispatch_id
      WHERE d.item_id = ?
        AND d.dispatch_date BETWEEN ? AND ?
    `;
    params.push(item_id, start, end);
    if (location_id) {
      // if location provided, we want dispatches FROM that location
      dispatchSelect += ` AND d.location_id = ? `;
      params.push(location_id);
    }

    // TRANSFERS OUT (transfers where this location is the FROM location)
    let transferOutSelect = `
      SELECT
        t.date AS dt,
        'transfer_out' AS source_type,
        t.quantity,
        CASE
          WHEN COALESCE(ta.allocated_quantity, 0) = t.quantity
            AND COALESCE(ta.unvalued_allocations, 0) = 0
          THEN ta.allocated_amount / NULLIF(t.quantity, 0)
          ELSE NULL
        END AS price,
        NULL AS amount,
        CASE
          WHEN COALESCE(ta.allocated_quantity, 0) = t.quantity
            AND COALESCE(ta.unvalued_allocations, 0) = 0
          THEN ta.allocated_amount
          ELSE NULL
        END AS total,
        CONCAT('TRANSFER to ', COALESCE(loc_to.location_name, t.to_location_id)) AS source_name,
        t.from_location_id AS location_id,
        t.to_location_id AS other_location_id,
        CONCAT('transfer:', t.transfer_id) AS override_key
      FROM transfer t
      LEFT JOIN locations loc_to ON loc_to.location_id = t.to_location_id
      LEFT JOIN (
        SELECT
          transfer_id,
          SUM(quantity) AS allocated_quantity,
          SUM(amount) AS allocated_amount,
          SUM(CASE WHEN valuation_status <> 'valued' OR amount IS NULL THEN 1 ELSE 0 END) AS unvalued_allocations
        FROM transfer_allocations
        GROUP BY transfer_id
      ) ta ON ta.transfer_id = t.transfer_id
      WHERE t.item_id = ?
        AND t.date BETWEEN ? AND ?
    `;
    params.push(item_id, start, end);
    if (location_id) {
      transferOutSelect += ` AND t.from_location_id = ? `;
      params.push(location_id);
    }

    // TRANSFERS IN (transfers where this location is the TO location)
    let transferInSelect = `
      SELECT
        t.date AS dt,
        'transfer_in' AS source_type,
        t.quantity,
        CASE
          WHEN COALESCE(ta.allocated_quantity, 0) = t.quantity
            AND COALESCE(ta.unvalued_allocations, 0) = 0
          THEN ta.allocated_amount / NULLIF(t.quantity, 0)
          ELSE NULL
        END AS price,
        NULL AS amount,
        CASE
          WHEN COALESCE(ta.allocated_quantity, 0) = t.quantity
            AND COALESCE(ta.unvalued_allocations, 0) = 0
          THEN ta.allocated_amount
          ELSE NULL
        END AS total,
        CONCAT('TRANSFER from ', COALESCE(loc_from.location_name, t.from_location_id)) AS source_name,
        t.to_location_id AS location_id,
        t.from_location_id AS other_location_id,
        CONCAT('transfer:', t.transfer_id) AS override_key
      FROM transfer t
      LEFT JOIN locations loc_from ON loc_from.location_id = t.from_location_id
      LEFT JOIN (
        SELECT
          transfer_id,
          SUM(quantity) AS allocated_quantity,
          SUM(amount) AS allocated_amount,
          SUM(CASE WHEN valuation_status <> 'valued' OR amount IS NULL THEN 1 ELSE 0 END) AS unvalued_allocations
        FROM transfer_allocations
        GROUP BY transfer_id
      ) ta ON ta.transfer_id = t.transfer_id
      WHERE t.item_id = ?
        AND t.date BETWEEN ? AND ?
    `;
    params.push(item_id, start, end);
    if (location_id) {
      transferInSelect += ` AND t.to_location_id = ? `;
      params.push(location_id);
    }

    // Combine all queries. If location_id provided, the queries are limited by it as above.
    const finalQuery = `
      SELECT
        movements.dt,
        movements.source_type,
        movements.quantity,
        COALESCE(overrides.price, movements.price) AS price,
        COALESCE(overrides.amount, movements.amount) AS amount,
        COALESCE(overrides.total, movements.total) AS total,
        movements.source_name,
        movements.location_id,
        movements.other_location_id,
        movements.override_key
      FROM (
        ${purchaseSelect}
        UNION ALL
        ${dispatchSelect}
        UNION ALL
        ${transferOutSelect}
        UNION ALL
        ${transferInSelect}
      ) movements
      LEFT JOIN report_value_overrides overrides
        ON overrides.override_key = movements.override_key
      ORDER BY movements.dt ASC
    `;

    // Run query
    const [rows] = await db.query(finalQuery, params);

    // Normalize rows: convert numbers, ensure price/total numeric
    const invoiceTracker = new Set();

    const normalizedRows = rows.map(r => {
      const quantity = Number(r.quantity) || 0;
      const price = r.price == null ? null : Number(r.price);
      const amount = r.amount == null ? null : Number(r.amount);

      let gstOthers = Number(r.gst_others) || 0;
      let total = r.total == null ? null : Number(r.total);

      // GST/charges should be shown only once per invoice.
      // Transfers do not have invoice-level GST.
      if (r.source_type === 'purchase' && r.invoice_no) {
        const invoiceKey = `${r.location_id}-${r.invoice_no}`;

        if (invoiceTracker.has(invoiceKey)) {
          gstOthers = 0;
          total = amount;
        } else {
          invoiceTracker.add(invoiceKey);
        }
      }

      return {
        item_name: r.item_name,
        category: r.category,
        sub_category: r.sub_category,
        quantity,
        invoice_no: r.invoice_no || null,
        price,
        amount: amount == null ? null : Number(amount.toFixed(2)),
        gst_others: Number(gstOthers.toFixed(2)),
        total: total == null ? null : Number(total.toFixed(2)),
        shop_name: r.shop_name || null,
        purchase_date: r.purchase_date,
        location_id: r.location_id,

        // transfer-specific
        from_location_id: r.from_location_id || null,
        transfer_id: r.transfer_id || null,
        done_by_user_id: r.done_by_user_id || null,
        override_key: r.override_key,
        source_type: r.source_type
      };
    });

    // Compute summary totals relative to the optional location_id:
    // purchases: sum of source_type === 'purchase'
    // dispatches: sum of 'dispatch'
    // transfer_out: 'transfer_out'
    // transfer_in: 'transfer_in'
    const summary = normalizedRows.reduce((acc, row) => {
      const q = Number(row.quantity) || 0;
      const amt = Number(row.total) || 0;
      if (row.source_type === 'purchase') {
        acc.purchaseQty += q;
        if (row.total == null) acc.purchaseAmountComplete = false;
        else acc.purchaseAmount += amt;
      } else if (row.source_type === 'dispatch') {
        acc.dispatchQty += q;
        if (row.total == null) acc.dispatchAmountComplete = false;
        else acc.dispatchAmount += amt;
      } else if (row.source_type === 'transfer_out') {
        acc.transferOutQty += q;
        if (row.total == null) acc.transferOutAmountComplete = false;
        else acc.transferOutAmount += amt;
      } else if (row.source_type === 'transfer_in') {
        acc.transferInQty += q;
        if (row.total == null) acc.transferInAmountComplete = false;
        else acc.transferInAmount += amt;
      }
      return acc;
    }, {
      purchaseQty: 0,
      purchaseAmount: 0,
      dispatchQty: 0,
      dispatchAmount: 0,
      transferOutQty: 0,
      transferOutAmount: 0,
      transferInQty: 0,
      transferInAmount: 0,
      purchaseAmountComplete: true,
      dispatchAmountComplete: true,
      transferOutAmountComplete: true,
      transferInAmountComplete: true
    });

    // Totals required per your formula:
    // availableQty = purchases - dispatch - transferOut + transferIn
    // totalPurchaseAmount = purchaseAmount + transferInAmount
    // totalDispatchAmount = dispatchAmount + transferOutAmount
    const availableQty = summary.purchaseQty - summary.dispatchQty - summary.transferOutQty + summary.transferInQty;
    const totalPurchaseAmount = summary.purchaseAmountComplete && summary.transferInAmountComplete
      ? summary.purchaseAmount + summary.transferInAmount
      : null;
    const totalDispatchAmount = summary.dispatchAmountComplete && summary.transferOutAmountComplete
      ? summary.dispatchAmount + summary.transferOutAmount
      : null;

    res.json({
      success: true,
      data: normalizedRows,
      summary: {
        purchaseQty: summary.purchaseQty,
        purchaseAmount: summary.purchaseAmountComplete ? Number(summary.purchaseAmount.toFixed(2)) : null,
        dispatchQty: summary.dispatchQty,
        dispatchAmount: summary.dispatchAmountComplete ? Number(summary.dispatchAmount.toFixed(2)) : null,
        transferInQty: summary.transferInQty,
        transferInAmount: summary.transferInAmountComplete ? Number(summary.transferInAmount.toFixed(2)) : null,
        transferOutQty: summary.transferOutQty,
        transferOutAmount: summary.transferOutAmountComplete ? Number(summary.transferOutAmount.toFixed(2)) : null,
        availableQty: Number(availableQty),
        totalPurchaseAmount: totalPurchaseAmount == null ? null : Number(totalPurchaseAmount.toFixed(2)),
        totalDispatchAmount: totalDispatchAmount == null ? null : Number(totalDispatchAmount.toFixed(2))
      }
    });

  } catch (err) {
    console.error('Error /report/itemMovement', err);
    res.status(500).json({ success: false, message: 'Failed to fetch item movement' });
  }
});


router.get('/comparativeAvailableStock', async (req, res) => {
  try {
    const rawLocationIds = req.query.location_ids || req.query.location_id;
    const locationIds = Array.isArray(rawLocationIds)
      ? rawLocationIds.map(String).filter(Boolean)
      : String(rawLocationIds || '').split(',').map(id => id.trim()).filter(Boolean);
    let categories = [];
    try {
      categories = req.query.categories ? JSON.parse(req.query.categories) : [];
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid categories filter' });
    }

    if (!Array.isArray(categories) || categories.some(category => typeof category !== 'string')) {
      return res.status(400).json({ success: false, message: 'Invalid categories filter' });
    }

    if (!locationIds.length) {
      return res.status(400).json({
        success: false,
        message: 'location_ids is required.'
      });
    }

    const placeholders = locationIds.map(() => '?').join(',');
    const locationOrderPlaceholders = locationIds.map(() => '?').join(',');
    const locationQuery = `
      SELECT location_id, location_name
      FROM locations
      WHERE location_id IN (${placeholders})
      ORDER BY FIELD(location_id, ${locationOrderPlaceholders})
    `;
    const [locations] = await db.query(locationQuery, [...locationIds, ...locationIds]);

    if (!locations.length) {
      return res.status(400).json({
        success: false,
        message: 'No matching locations found for selected location_ids.'
      });
    }

    const sql = `
      SELECT
        s.item_id,
        i.item_name,
        i.category,
        i.sub_category,
        i.unit,
        l.location_id,
        l.location_name,
        COALESCE(SUM(s.quantity), 0) AS quantity,
        COALESCE(b.batch_quantity, 0) AS batch_quantity,
        COALESCE(b.unvalued_quantity, 0) AS unvalued_quantity,
        COALESCE(b.valued_amount, 0) AS valued_amount
      FROM stock s
      JOIN items i ON i.item_id = s.item_id
      JOIN locations l ON l.location_id = s.location_id
      LEFT JOIN (
        SELECT
          item_id,
          location_id,
          SUM(remaining_quantity) AS batch_quantity,
          SUM(CASE
            WHEN remaining_quantity > 0
              AND (unit_rate IS NULL OR valuation_status <> 'valued')
            THEN remaining_quantity
            ELSE 0
          END) AS unvalued_quantity,
          SUM(CASE
            WHEN remaining_quantity > 0
              AND unit_rate IS NOT NULL
              AND valuation_status = 'valued'
            THEN remaining_quantity * unit_rate
            ELSE 0
          END) AS valued_amount
        FROM inventory_batches
        GROUP BY item_id, location_id
      ) b ON b.item_id = s.item_id AND b.location_id = s.location_id
      WHERE s.location_id IN (${placeholders})
      ${categories.length ? `AND i.category IN (${categories.map(() => '?').join(',')})` : ''}
      GROUP BY
        s.item_id,
        i.item_name,
        i.category,
        i.sub_category,
        i.unit,
        l.location_id,
        l.location_name,
        b.batch_quantity,
        b.unvalued_quantity,
        b.valued_amount
      ORDER BY i.category, i.item_name, l.location_name;
    `;

    const [rows] = await db.query(sql, [...locationIds, ...categories]);

    const selectedLocationNames = locations.map(loc => loc.location_name);
    const items = {};

    rows.forEach((row) => {
      const locationName = row.location_name;
      const itemId = Number(row.item_id);
      if (!items[itemId]) {
        items[itemId] = {
          item_id: itemId,
          item_name: row.item_name,
          category: row.category,
          sub_category: row.sub_category,
          unit: row.unit,
          totalQty: 0,
          total: 0,
          _locations: {},
        };

        selectedLocationNames.forEach((locName) => {
          items[itemId][locName] = 0;
          items[itemId]._locations[locName] = {
            batchQuantity: 0,
            unvaluedQuantity: 0,
            valuedAmount: 0
          };
        });
      }

      items[itemId][locationName] = Number(row.quantity) || 0;
      items[itemId]._locations[locationName] = {
        batchQuantity: Number(row.batch_quantity) || 0,
        unvaluedQuantity: Number(row.unvalued_quantity) || 0,
        valuedAmount: Number(row.valued_amount) || 0
      };
    });

    const selectedLocationKey = locationIds.map(Number).sort((left, right) => left - right).join(',');
    const overrideKeys = Object.keys(items).map(itemId => `comparative:${itemId}:${selectedLocationKey}`);
    const [overrideRows] = overrideKeys.length
      ? await db.query(
          `SELECT override_key, price, total
           FROM report_value_overrides
           WHERE override_key IN (${overrideKeys.map(() => '?').join(',')})`,
          overrideKeys
        )
      : [[]];
    const overrideByKey = new Map(overrideRows.map(row => [row.override_key, row]));

    const transformed = Object.values(items).map((item) => {
      const totalQty = selectedLocationNames.reduce(
        (sum, locName) => sum + (Number(item[locName]) || 0),
        0
      );
      const isValued = selectedLocationNames.every(locName => {
        const valuation = item._locations[locName];
        return valuation.batchQuantity === (Number(item[locName]) || 0) && valuation.unvaluedQuantity === 0;
      });
      const total = isValued
        ? selectedLocationNames.reduce((sum, locName) => sum + item._locations[locName].valuedAmount, 0)
        : null;
      const { _locations, ...publicItem } = item;
      const overrideKey = `comparative:${item.item_id}:${selectedLocationKey}`;
      const override = overrideByKey.get(overrideKey);
      return {
        ...publicItem,
        totalQty,
        price: override?.price != null
          ? Number(override.price)
          : isValued && totalQty > 0 ? Number((total / totalQty).toFixed(2)) : isValued ? 0 : null,
        total: override?.total != null ? Number(override.total) : total == null ? null : Number(total.toFixed(2)),
        valuation_status: override?.price != null || override?.total != null
          ? 'overridden'
          : isValued ? 'valued' : 'unvalued',
        override_key: overrideKey
      };
    });

    const locationTotals = selectedLocationNames.reduce((acc, locName) => {
      acc[locName] = 0;
      return acc;
    }, {});

    transformed.forEach((item) => {
      selectedLocationNames.forEach((locName) => {
        locationTotals[locName] += Number(item[locName]) || 0;
      });
    });

    const valuationComplete = transformed.every(item => item.total != null);
    const grandTotal = valuationComplete
      ? transformed.reduce((sum, item) => sum + item.total, 0)
      : null;

    res.json({
      success: true,
      data: transformed,
      selectedLocations: locations.map(loc => ({
        location_id: Number(loc.location_id),
        location_name: loc.location_name
      })),
      summary: {
        locationTotals,
        grandTotal: grandTotal == null ? null : Number(grandTotal.toFixed(2)),
        valuation_complete: valuationComplete
      }
    });
  } catch (error) {
    console.error('Error fetching comparative available stock report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comparative available stock report'
    });
  }
});



// 🛒 Purchase Report
router.get('/purchaseReport', async (req, res) => {
  try {
    const { startDate, endDate, location_id, item_id, subcategory } = req.query;

    if (!startDate || !endDate || !location_id) {
      return res.status(400).json({
        success: false,
        message: 'Start date, end date and location_id are required.'
      });
    }

    let purchaseSelect = `
      SELECT
        i.item_name,
        i.category,
        i.sub_category,
        p.purchase_id,
        p.quantity,
        COALESCE(pvo.price, p.rate) AS rate,
        COALESCE(pvo.amount, p.amount) AS amount,
        p.invoice_no,

        COALESCE(pic.cgst, 0) +
        COALESCE(pic.sgst, 0) +
        COALESCE(pic.freight, 0) +
        COALESCE(pic.other_charges, 0) AS gst_others,

        COALESCE(pvo.total, (
          p.amount +
          COALESCE(pic.cgst, 0) +
          COALESCE(pic.sgst, 0) +
          COALESCE(pic.freight, 0) +
          COALESCE(pic.other_charges, 0)
        )) AS total,

        s.name AS shop_name,
        p.purchase_date,
        p.location_id,
        NULL AS from_location_id,
        NULL AS transfer_id,
        NULL AS done_by_user_id,
        'purchase' AS source_type,
        CONCAT('purchase:', p.purchase_id) AS override_key

      FROM purchases p

      JOIN items i
        ON p.item_id = i.item_id

      JOIN shops s
        ON p.shop_id = s.id

      LEFT JOIN purchase_invoice_charges pic
        ON pic.invoice_no = p.invoice_no
        AND pic.location_id = p.location_id

      LEFT JOIN report_value_overrides pvo
        ON pvo.override_key = CONCAT('purchase:', p.purchase_id)

      WHERE p.purchase_date BETWEEN ? AND ?
        AND p.location_id = ?
    `;

    let transferSelect = `
      SELECT
        i.item_name,
        i.category,
        i.sub_category,
        NULL AS purchase_id,
        t.quantity,
        tvo.price AS rate,
        COALESCE(tvo.amount, 0) AS amount,
        NULL AS invoice_no,
        0 AS gst_others,
        COALESCE(tvo.total, 0) AS total,
        CONCAT("TRANSFER from ", loc.location_name) AS shop_name,
        t.date AS purchase_date,
        t.to_location_id AS location_id,
        t.from_location_id,
        t.transfer_id,
        t.done_by_user_id,
        'transfer' AS source_type,
        CONCAT('transfer:', t.transfer_id) AS override_key

      FROM transfer t

      JOIN items i
        ON t.item_id = i.item_id

      LEFT JOIN locations loc
        ON loc.location_id = t.from_location_id
      LEFT JOIN report_value_overrides tvo
        ON tvo.override_key = CONCAT('transfer:', t.transfer_id)

      WHERE t.date BETWEEN ? AND ?
        AND t.to_location_id = ?
    `;

    const params = [
      startDate,
      endDate,
      location_id,
      startDate,
      endDate,
      location_id
    ];

    if (item_id) {
      purchaseSelect += ` AND p.item_id = ?`;
      transferSelect += ` AND t.item_id = ?`;
      params.push(item_id, item_id);
    }

    if (subcategory) {
      purchaseSelect += ` AND i.sub_category = ?`;
      transferSelect += ` AND i.sub_category = ?`;
      params.push(subcategory, subcategory);
    }

    const query = `
      ${purchaseSelect}
      UNION ALL
      ${transferSelect}
      ORDER BY purchase_date ASC
    `;

    const [rows] = await db.query(query, params);

    const invoiceTracker = new Set();

    const normalizedRows = rows.map(r => {
      const quantity = Number(r.quantity) || 0;
      const rate = r.rate != null ? Number(r.rate) || 0 : 0;
      const amount = Number(r.amount) || 0;

      let gstOthers = Number(r.gst_others) || 0;
      let total = Number(r.total) || 0;

      // GST / invoice charges are shown only once per invoice.
      if (r.source_type === 'purchase' && r.invoice_no) {
        const invoiceKey = `${r.location_id}-${r.invoice_no}`;

        if (invoiceTracker.has(invoiceKey)) {
          gstOthers = 0;
          total = amount;
        } else {
          invoiceTracker.add(invoiceKey);
        }
      }

      return {
        item_name: r.item_name,
        category: r.category,
        sub_category: r.sub_category,
        quantity,
        invoice_no: r.invoice_no || null,
        rate,
        price: rate,
        amount: Number(amount.toFixed(2)),
        gst_others: Number(gstOthers.toFixed(2)),
        total: Number(total.toFixed(2)),
        shop_name: r.shop_name || null,
        purchase_date: r.purchase_date,
        location_id: r.location_id,

        from_location_id: r.from_location_id || null,
        transfer_id: r.transfer_id || null,
        done_by_user_id: r.done_by_user_id || null,
        override_key: r.override_key,
        source_type: r.source_type
      };
    });

    const grandTotal = normalizedRows.reduce(
      (sum, row) => sum + Number(row.total || 0),
      0
    );

    res.json({
      success: true,
      data: normalizedRows,
      grandTotal: Number(grandTotal.toFixed(2))
    });

  } catch (error) {
    console.error('Error fetching purchase report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase report'
    });
  }
});


/// ✅ Transfer Report (GET)
router.get('/transferReport', async (req, res) => {
  try {
    const { startDate, endDate, from_location_id, to_location_id, item_id, category } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required.'
      });
    }

    let query = `
      SELECT
        t.transfer_id,
        t.date AS transfer_date,
        i.item_name,
        i.category,
        l1.location_name AS received_fr,
        t.quantity AS qty_received,
        l2.location_name AS issued_to,
        t.quantity AS qty_issued
      FROM transfer t
      JOIN items i ON t.item_id = i.item_id
      LEFT JOIN locations l1 ON t.from_location_id = l1.location_id
      LEFT JOIN locations l2 ON t.to_location_id = l2.location_id
      WHERE t.date BETWEEN ? AND ?
    `;

    const params = [startDate, endDate];

    //csd besties visit
    //fight or not fight dont know

    if (from_location_id) {
      query += ' AND t.from_location_id = ?';
      params.push(from_location_id);
    }
    if (to_location_id) {
      query += ' AND t.to_location_id = ?';
      params.push(to_location_id);
    }
    if (item_id) {
      query += ' AND t.item_id = ?';
      params.push(item_id);
    }
    if (category) {
      query += ' AND i.category = ?';
      params.push(category);
    }

    query += ' ORDER BY t.date ASC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching transfer report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transfer report'
    });
  }
});

router.post('/valueOverride', async (req, res) => {
  const { override_key: overrideKey, field, value } = req.body;
  const allowedFields = new Set(['price', 'amount', 'total']);
  const validKey = /^(purchase|dispatch|transfer):\d+$|^(stock|comparative):\d+:\d+(?:,\d+)*$/;
  const numericValue = Number(value);

  if (
    typeof overrideKey !== 'string' ||
    !validKey.test(overrideKey) ||
    !allowedFields.has(field) ||
    value == null ||
    value === '' ||
    !Number.isFinite(numericValue) ||
    numericValue < 0 ||
    numericValue > 9999999999.99
  ) {
    return res.status(400).json({ success: false, message: 'Invalid report value override' });
  }

  const roundedValue = Number(numericValue.toFixed(2));
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [currentRows] = await connection.query(
      `SELECT ${field} AS old_value FROM report_value_overrides WHERE override_key = ? FOR UPDATE`,
      [overrideKey]
    );
    const oldValue = currentRows.length && currentRows[0].old_value != null
      ? Number(currentRows[0].old_value)
      : null;

    await connection.query(
      `INSERT INTO report_value_overrides (override_key, ${field})
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE ${field} = VALUES(${field})`,
      [overrideKey, roundedValue]
    );
    await connection.query(
      `INSERT INTO report_value_override_history
        (override_key, field_name, old_value, new_value)
       VALUES (?, ?, ?, ?)`,
      [overrideKey, field, oldValue, roundedValue]
    );

    await connection.commit();
    res.json({ success: true, override_key: overrideKey, field, value: roundedValue });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error saving report value override:', error);
    res.status(500).json({ success: false, message: 'Failed to save report value' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;