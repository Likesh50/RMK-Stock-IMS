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
     * 🧠 Strategy:
     * - Fetch dispatch + transfer records
     * - For each item, pull the latest price from purchases table
     *   using (SELECT p.amount FROM purchases p ... ORDER BY p.purchase_date DESC LIMIT 1)
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
        -- Latest per-item purchase price (any location)
        (
          SELECT p.amount
          FROM purchases p
          WHERE p.item_id = i.item_id
          ORDER BY p.purchase_date DESC
          LIMIT 1
        ) AS price,
        -- total = quantity * price
        (d.quantity * (
          SELECT p.amount
          FROM purchases p
          WHERE p.item_id = i.item_id
          ORDER BY p.purchase_date DESC
          LIMIT 1
        )) AS total,
        'dispatch' AS source_type
      FROM 
        dispatch d
      JOIN 
        items i ON d.item_id = i.item_id
      LEFT JOIN 
        blocks b ON d.block_id = b.block_id
      WHERE 
        d.dispatch_date BETWEEN ? AND ?
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
        (
          SELECT p.amount
          FROM purchases p
          WHERE p.item_id = i.item_id
          ORDER BY p.purchase_date DESC
          LIMIT 1
        ) AS price,
        (t.quantity * (
          SELECT p.amount
          FROM purchases p
          WHERE p.item_id = i.item_id
          ORDER BY p.purchase_date DESC
          LIMIT 1
        )) AS total,
        'transfer' AS source_type
      FROM transfer t
      JOIN items i ON t.item_id = i.item_id
      LEFT JOIN locations l ON l.location_id = t.to_location_id
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
      price: Number(r.price) || 0,
      total: Number(r.total) || 0,
      dispatch_date: r.dispatch_date,
      block_name: r.block_name || null,
      sticker_no: r.sticker_no || null,
      receiver: r.receiver || null,
      incharge: r.incharge || null,
      source_type: r.source_type
    }));

    // ---- Calculate Grand Total ----
    const grandTotal = normalizedRows.reduce((sum, row) => sum + (row.total || 0), 0);

    res.json({
      success: true,
      data: normalizedRows,
      grandTotal: Number(grandTotal.toFixed(2))
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
        p.amount AS price,
        (p.quantity * p.amount) AS total,
        s.name AS source_name,
        p.location_id,
        NULL AS other_location_id
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
        -- get latest purchase price for item as price (if you store dispatch price elsewhere, replace)
        (
          SELECT p2.amount FROM purchases p2
          WHERE p2.item_id = d.item_id
          ORDER BY p2.purchase_date DESC LIMIT 1
        ) AS price,
        d.quantity * (
          SELECT COALESCE(p2.amount,0) FROM purchases p2
          WHERE p2.item_id = d.item_id
          ORDER BY p2.purchase_date DESC LIMIT 1
        ) AS total,
        COALESCE(b.block_name, CONCAT('Dispatch from loc ', d.location_id)) AS source_name,
        d.location_id,
        NULL AS other_location_id
      FROM dispatch d
      LEFT JOIN blocks b ON b.block_id = d.block_id
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
        (
          SELECT p2.amount FROM purchases p2
          WHERE p2.item_id = t.item_id
          ORDER BY p2.purchase_date DESC LIMIT 1
        ) AS price,
        t.quantity * (
          SELECT COALESCE(p2.amount,0) FROM purchases p2
          WHERE p2.item_id = t.item_id
          ORDER BY p2.purchase_date DESC LIMIT 1
        ) AS total,
        CONCAT('TRANSFER to ', COALESCE(loc_to.location_name, t.to_location_id)) AS source_name,
        t.from_location_id AS location_id,
        t.to_location_id AS other_location_id
      FROM transfer t
      LEFT JOIN locations loc_to ON loc_to.location_id = t.to_location_id
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
        (
          SELECT p2.amount FROM purchases p2
          WHERE p2.item_id = t.item_id
          ORDER BY p2.purchase_date DESC LIMIT 1
        ) AS price,
        t.quantity * (
          SELECT COALESCE(p2.amount,0) FROM purchases p2
          WHERE p2.item_id = t.item_id
          ORDER BY p2.purchase_date DESC LIMIT 1
        ) AS total,
        CONCAT('TRANSFER from ', COALESCE(loc_from.location_name, t.from_location_id)) AS source_name,
        t.to_location_id AS location_id,
        t.from_location_id AS other_location_id
      FROM transfer t
      LEFT JOIN locations loc_from ON loc_from.location_id = t.from_location_id
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
      ${purchaseSelect}
      UNION ALL
      ${dispatchSelect}
      UNION ALL
      ${transferOutSelect}
      UNION ALL
      ${transferInSelect}
      ORDER BY dt ASC
    `;

    // Run query
    const [rows] = await db.query(finalQuery, params);

    // Normalize rows: convert numbers, ensure price/total numeric
    const normalized = rows.map(r => ({
      date: r.dt,
      source_type: r.source_type,
      quantity: Number(r.quantity) || 0,
      price: r.price != null ? Number(r.price) || 0 : 0,
      total: r.total != null ? Number(r.total) || 0 : (Number(r.quantity) || 0) * (Number(r.price) || 0),
      source_name: r.source_name || null,
      location_id: r.location_id || null,
      other_location_id: r.other_location_id || null
    }));

    // Compute summary totals relative to the optional location_id:
    // purchases: sum of source_type === 'purchase'
    // dispatches: sum of 'dispatch'
    // transfer_out: 'transfer_out'
    // transfer_in: 'transfer_in'
    const summary = normalized.reduce((acc, row) => {
      const q = Number(row.quantity) || 0;
      const amt = Number(row.total) || 0;
      if (row.source_type === 'purchase') {
        acc.purchaseQty += q;
        acc.purchaseAmount += amt;
      } else if (row.source_type === 'dispatch') {
        acc.dispatchQty += q;
        acc.dispatchAmount += amt;
      } else if (row.source_type === 'transfer_out') {
        acc.transferOutQty += q;
        acc.transferOutAmount += amt;
      } else if (row.source_type === 'transfer_in') {
        acc.transferInQty += q;
        acc.transferInAmount += amt;
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
      transferInAmount: 0
    });

    // Totals required per your formula:
    // availableQty = purchases - dispatch - transferOut + transferIn
    // totalPurchaseAmount = purchaseAmount + transferInAmount
    // totalDispatchAmount = dispatchAmount + transferOutAmount
    const availableQty = summary.purchaseQty - summary.dispatchQty - summary.transferOutQty + summary.transferInQty;
    const totalPurchaseAmount = summary.purchaseAmount + summary.transferInAmount;
    const totalDispatchAmount = summary.dispatchAmount + summary.transferOutAmount;

    res.json({
      success: true,
      data: normalized,
      summary: {
        purchaseQty: summary.purchaseQty,
        purchaseAmount: Number(summary.purchaseAmount.toFixed(2)),
        dispatchQty: summary.dispatchQty,
        dispatchAmount: Number(summary.dispatchAmount.toFixed(2)),
        transferInQty: summary.transferInQty,
        transferInAmount: Number(summary.transferInAmount.toFixed(2)),
        transferOutQty: summary.transferOutQty,
        transferOutAmount: Number(summary.transferOutAmount.toFixed(2)),
        availableQty: Number(availableQty),
        totalPurchaseAmount: Number(totalPurchaseAmount.toFixed(2)),
        totalDispatchAmount: Number(totalDispatchAmount.toFixed(2))
      }
    });

  } catch (err) {
    console.error('Error /report/itemMovement', err);
    res.status(500).json({ success: false, message: 'Failed to fetch item movement' });
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

    // Build the purchases SELECT
    let purchaseSelect = `
      SELECT 
        i.item_name,
        i.category,
        i.sub_category,
        p.quantity,
        p.invoice_no,
        p.amount AS price,
        (p.quantity * p.amount) AS total,
        s.name AS shop_name,
        p.purchase_date,
        p.location_id,
        NULL AS from_location_id,
        NULL AS transfer_id,
        NULL AS done_by_user_id,
        'purchase' AS source_type
      FROM purchases p
      JOIN items i ON p.item_id = i.item_id
      JOIN shops s ON p.shop_id = s.id
      WHERE p.purchase_date BETWEEN ? AND ?
        AND p.location_id = ?
    `;

    // Build the transfers SELECT (records transferred TO the location)
    // IMPORTANT: fetch the from-location's name from locations and return it as shop_name
    let transferSelect = `
      SELECT
        i.item_name,
        i.category,
        i.sub_category,
        t.quantity,
        NULL AS invoice_no,
        NULL AS price,
        0 AS total,
        CONCAT("TRANSFER from ",loc.location_name) AS shop_name,
        t.date AS purchase_date,
        t.to_location_id AS location_id,
        t.from_location_id,
        t.transfer_id,
        t.done_by_user_id,
        'transfer' AS source_type
      FROM transfer t
      JOIN items i ON t.item_id = i.item_id
      LEFT JOIN locations loc ON loc.location_id = t.from_location_id
      WHERE t.date BETWEEN ? AND ?
        AND t.to_location_id = ?
    `;

    // Apply optional filters to both halves
    const params = [startDate, endDate, location_id, startDate, endDate, location_id];
    if (item_id) {
      purchaseSelect += ` AND p.item_id = ?`;
      transferSelect += ` AND t.item_id = ?`;
      params.push(item_id, item_id); // purchase then transfer
    }

    if (subcategory) {
      purchaseSelect += ` AND i.sub_category = ?`;
      transferSelect += ` AND i.sub_category = ?`;
      params.push(subcategory, subcategory); // purchase then transfer
    }

    // Combine with UNION ALL and order by date
    const query = `
      ${purchaseSelect}
      UNION ALL
      ${transferSelect}
      ORDER BY purchase_date ASC
    `;

    const [rows] = await db.query(query, params);

    // Normalize values
    const normalizedRows = rows.map(r => {
      // ensure numeric conversion and preserve some transfer-specific fields
      const quantity = Number(r.quantity) || 0;
      const price = r.price != null ? Number(r.price) || 0 : 0;
      // For purchases total should already be present; for transfers we set 0 above
      const total = (r.total != null) ? Number(r.total) || (quantity * price) : (quantity * price);

      return {
        item_name: r.item_name,
        category: r.category,
        sub_category: r.sub_category,
        quantity,
        invoice_no: r.invoice_no || null,
        price,
        total: Number(total.toFixed(2)),
        shop_name: r.shop_name || null, // for transfers this is now the location_name from locations
        purchase_date: r.purchase_date,   // client can format
        location_id: r.location_id,
        // transfer-specific
        from_location_id: r.from_location_id || null,
        transfer_id: r.transfer_id || null,
        done_by_user_id: r.done_by_user_id || null,
        source_type: r.source_type // 'purchase' or 'transfer'
      };
    });

    // Grand total — sums totals (transfers contribute 0 unless price exists)
    const grandTotal = normalizedRows.reduce((sum, row) => sum + (row.total || 0), 0);

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

module.exports = router;
