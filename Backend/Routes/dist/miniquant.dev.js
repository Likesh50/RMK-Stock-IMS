"use strict";

var express = require('express');

var db = require('../db'); // Assuming your database connection is set up in db.js


var router = express.Router();
router.get('/minquant', function (req, res) {
  var query = "\n    SELECT \n      i.item_name, \n      i.min_quantity, \n      SUM(s.quantity) AS total_quantity, \n      i.unit, \n      i.category\n    FROM \n      items i\n    JOIN \n      stock s ON i.item_id = s.item_id\n    GROUP BY \n      i.item_id, \n      i.item_name, \n      i.min_quantity, \n      i.unit, \n      i.category\n    HAVING \n      total_quantity < i.min_quantity;\n  "; // Use db.query instead of connection.query

  db.query(query, function (err, results) {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({
        error: 'Database query error'
      });
    } // Check if no results were found


    if (results.length === 0) {
      return res.status(404).json({
        error: 'No items found'
      });
    } // Send results to the frontend


    res.json(results);
  });
});
module.exports = router;