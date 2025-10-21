const express = require('express');
const db = require('../db'); // Assuming your database connection is set up in db.js
const router = express.Router();

router.get('/dispatchReport', async (req, res) => {
  try {
    const { startDate, endDate, location_id, item_id, subcategory } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required.'
      });
    }

    let query = `
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
        d.sticker_no
      FROM 
        dispatch d
      JOIN 
        items i ON d.item_id = i.item_id
      LEFT JOIN 
        blocks b ON d.block_id = b.block_id
      WHERE 
        d.dispatch_date BETWEEN ? AND ?
    `;

    const params = [startDate, endDate];

    if (location_id) {
      query += ` AND d.location_id = ?`;
      params.push(location_id);
    }

    if (item_id) {
      query += ` AND d.item_id = ?`;
      params.push(item_id);
    }

    if (subcategory) {
      query += ` AND i.sub_category = ?`;
      params.push(subcategory);
    }

    query += ` ORDER BY d.dispatch_date ASC`;

    const [rows] = await db.query(query, params);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching dispatch report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dispatch report'
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

    let query = `
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
        p.location_id
      FROM 
        purchases p
      JOIN 
        items i ON p.item_id = i.item_id
      JOIN 
        shops s ON p.shop_id = s.id
      WHERE 
        p.purchase_date BETWEEN ? AND ?
        AND p.location_id = ?
    `;

    const params = [startDate, endDate, location_id];

    if (item_id) {
      query += ` AND p.item_id = ?`;
      params.push(item_id);
    }

    if (subcategory) {
      query += ` AND i.sub_category = ?`;
      params.push(subcategory);
    }

    query += ` ORDER BY p.purchase_date ASC`;

    const [rows] = await db.query(query, params);

    // Ensure totals are numbers (in case DB returns strings)
    const normalizedRows = rows.map(r => ({
      ...r,
      quantity: Number(r.quantity) || 0,
      price: Number(r.price) || 0,
      total: Number(r.total) || (Number(r.quantity || 0) * Number(r.price || 0))
    }));

    // Grand total
    const grandTotal = normalizedRows.reduce((sum, row) => sum + row.total, 0);

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
