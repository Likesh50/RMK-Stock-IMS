const express = require('express');
const db = require('../db'); 
const moment = require('moment');

const router = express.Router();
router.get('/availablestock', async (req, res) => {
  try {
    const locationId = req.query.location_id;

    if (!locationId) {
      return res.status(400).json({
        success: false,
        message: 'Missing location_id'
      });
    }

    const query = `
      SELECT 
        i.item_name AS itemName,
        i.sub_category AS sub_category,
        i.category AS category,
        i.unit AS unit,
        SUM(s.quantity) AS totalQuantity
      FROM stock s
      JOIN items i ON s.item_id = i.item_id
      WHERE s.location_id = ?
      GROUP BY i.item_name, i.sub_category, i.category, i.unit
      ORDER BY i.item_name,i.category;
    `;

    const [rows] = await db.query(query, [locationId]);

    const formattedData = rows.map(stock => ({
      itemName: stock.itemName,
      
      subCategory: stock.sub_category,
      category: stock.category,
      quantity: parseFloat(stock.totalQuantity),
      unit: stock.unit
    }));

    res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error in /availablestock route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available stock'
    });
  }
});


// Helper functions to calculate the days left to expire and days since purchase
const calculateDaysLeft = (expiryDate) => {
    const today = moment();
    const expiry = moment(expiryDate);
    return expiry.diff(today, 'days');
};

const calculateDaysSince = (purchaseDate) => {
    const today = moment();
    const purchase = moment(purchaseDate);
    return today.diff(purchase, 'days');
};

module.exports = router;
