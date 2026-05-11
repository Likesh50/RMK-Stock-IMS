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
    s.item_id,
    i.item_name AS itemName,
    i.sub_category AS sub_category,
    i.category AS category,
    i.unit AS unit,

    SUM(s.quantity) AS totalQuantity,

    COALESCE(
      MAX(
        (
          SELECT p.amount
          FROM purchases p
          WHERE p.item_id = s.item_id
          AND p.location_id = s.location_id
          ORDER BY p.purchase_date DESC
          LIMIT 1
        )
      ),
      0
    ) AS price

  FROM stock s

  JOIN items i 
    ON s.item_id = i.item_id

  WHERE s.location_id = ?

  GROUP BY 
    s.item_id,
    i.item_name,
    i.sub_category,
    i.category,
    i.unit

  ORDER BY 
    i.category,
    i.item_name;
`;

    const [rows] = await db.query(query, [locationId]);

    const formattedData = rows.map(stock => {
      const quantity = Number(stock.totalQuantity) || 0;
      const price = Number(stock.price) || 0;

      return {
        item_id: stock.item_id,
        itemName: stock.itemName,
        subCategory: stock.sub_category,
        category: stock.category,
        quantity,
        unit: stock.unit,
        price,
        total: quantity * price
      };
    });

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
