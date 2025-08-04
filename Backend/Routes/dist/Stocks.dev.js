"use strict";

var express = require('express');

var db = require('../db');

var moment = require('moment');

var router = express.Router();
router.get('/availablestock', function _callee(req, res) {
  var query;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          try {
            // Query to join stocks, items, and purchases tables
            query = "\n            SELECT \n i.item_name AS itemName,\n                i.category AS category,\n                i.unit AS unit,\n                s.quantity AS quantity,\n                p.expiry_date AS expiryDate,\n                p.purchase_date AS purchaseDate\n            FROM stock s\n            JOIN items i ON s.item_id = i.item_id\n            JOIN purchases p ON s.purchase_id = p.purchase_id\n            ORDER BY i.item_name, p.expiry_date;\n        "; // Fetch data from the database

            db.query(query, function (error, rows) {
              if (error) {
                console.error('Error fetching available stock:', error);
                return res.status(500).json({
                  success: false,
                  message: 'Failed to fetch available stock'
                });
              } // Format the data and calculate days left to expire and days since purchase


              var formattedData = rows.map(function (stock) {
                return {
                  itemName: stock.itemName,
                  category: stock.category,
                  quantity: stock.quantity,
                  unit: stock.unit,
                  expiry_date: stock.expiryDate,
                  purchase_date: stock.purchaseDate,
                  daysLeftToExpire: calculateDaysLeft(stock.expiryDate),
                  daysSincePurchase: calculateDaysSince(stock.purchaseDate)
                };
              });
              res.json({
                success: true,
                data: formattedData
              });
            });
          } catch (error) {
            console.error('Error in /availablestock route:', error);
            res.status(500).json({
              success: false,
              message: 'Failed to fetch available stock'
            });
          }

        case 1:
        case "end":
          return _context.stop();
      }
    }
  });
}); // Helper functions to calculate the days left to expire and days since purchase

var calculateDaysLeft = function calculateDaysLeft(expiryDate) {
  var today = moment();
  var expiry = moment(expiryDate);
  return expiry.diff(today, 'days');
};

var calculateDaysSince = function calculateDaysSince(purchaseDate) {
  var today = moment();
  var purchase = moment(purchaseDate);
  return today.diff(purchase, 'days');
};

module.exports = router;