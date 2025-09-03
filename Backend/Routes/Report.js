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
        p.amount,
        s.name AS shop_name,
        s.location AS shop_location,
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

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching purchase report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase report'
    });
  }
});

module.exports = router;
