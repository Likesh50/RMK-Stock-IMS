"use strict";

var express = require('express');

var db = require('../db');

var router = express.Router();
router.get('/expiry-items', function (req, res) {
  // Get 'days' parameter from query, default to 30 if not provided
  var days = req.query.days || 30;
  var query = "\n      SELECT \n        i.item_name AS itemName, \n        s.quantity, \n        i.category,\n        i.unit, \n        p.shop_address AS shopAddress, \n        p.manufacturing_date AS manufacturingDate, \n        p.expiry_date AS expiryDate\n      FROM \n        stock s\n      JOIN \n        purchases p ON s.purchase_id = p.purchase_id\n      JOIN \n        items i ON p.item_id = i.item_id\n      WHERE \n        p.expiry_date < CURDATE() + INTERVAL ? DAY\n    ";
  db.query(query, [parseInt(days)], function (err, results) {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({
        error: 'Database query error'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        error: 'No items found'
      });
    }

    res.json(results); // Send the data in the expected format
  });
});
module.exports = router;