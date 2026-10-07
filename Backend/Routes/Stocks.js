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
        COALESCE(b.batchQuantity, 0) AS batchQuantity,
        COALESCE(b.unvaluedQuantity, 0) AS unvaluedQuantity,
        COALESCE(b.valuedAmount, 0) AS valuedAmount,
        rvo.price AS overridePrice,
        rvo.total AS overrideTotal
      FROM stock s
      JOIN items i ON s.item_id = i.item_id
      LEFT JOIN (
        SELECT
          item_id,
          location_id,
          SUM(remaining_quantity) AS batchQuantity,
          SUM(CASE
            WHEN remaining_quantity > 0
              AND (unit_rate IS NULL OR valuation_status <> 'valued')
            THEN remaining_quantity
            ELSE 0
          END) AS unvaluedQuantity,
          SUM(CASE
            WHEN remaining_quantity > 0
              AND unit_rate IS NOT NULL
              AND valuation_status = 'valued'
            THEN remaining_quantity * unit_rate
            ELSE 0
          END) AS valuedAmount
        FROM inventory_batches
        GROUP BY item_id, location_id
      ) b ON b.item_id = s.item_id AND b.location_id = s.location_id
      LEFT JOIN report_value_overrides rvo
        ON rvo.override_key = CONCAT('stock:', s.item_id, ':', s.location_id)
      WHERE s.location_id = ?
      GROUP BY
        s.item_id,
        i.item_name,
        i.sub_category,
        i.category,
        i.unit,
        b.batchQuantity,
        b.unvaluedQuantity,
        b.valuedAmount
      ORDER BY i.category, i.item_name;
    `;

    const [rows] = await db.query(query, [locationId]);

    const formattedData = rows.map(stock => {
      const quantity = Number(stock.totalQuantity) || 0;
      const batchQuantity = Number(stock.batchQuantity) || 0;
      const unvaluedQuantity = Number(stock.unvaluedQuantity) || 0;
      const batchBalancesMatch = batchQuantity === quantity;
      const isValued = batchBalancesMatch && unvaluedQuantity === 0;
      const valuedAmount = Number(stock.valuedAmount) || 0;
      const calculatedPrice = isValued && quantity > 0
        ? valuedAmount / quantity
        : isValued ? 0 : null;
      const calculatedTotal = isValued ? Number(valuedAmount.toFixed(2)) : null;
      const price = stock.overridePrice == null ? calculatedPrice : Number(stock.overridePrice);
      const total = stock.overrideTotal == null ? calculatedTotal : Number(stock.overrideTotal);

      return {
        item_id: stock.item_id,
        itemName: stock.itemName,
        subCategory: stock.sub_category,
        category: stock.category,
        quantity,
        unit: stock.unit,
        price,
        total,
        valuation_status: stock.overridePrice != null || stock.overrideTotal != null
          ? 'overridden'
          : isValued ? 'valued' : 'unvalued',
        override_key: `stock:${stock.item_id}:${locationId}`,
        unvalued_quantity: isValued ? 0 : Math.max(unvaluedQuantity, Math.abs(quantity - batchQuantity))
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
    return today.diff(purchaseDate, 'days');
};

module.exports = router;