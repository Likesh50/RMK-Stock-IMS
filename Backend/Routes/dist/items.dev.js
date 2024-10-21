"use strict";

var express = require('express');

var db = require('../db'); // Assuming you have a DB connection module


var router = express.Router(); // Fetch all items

router.get('/', function (req, res) {
  var query = "SELECT * FROM items";
  db.query(query, function (err, result) {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({
        error: 'Database fetch error'
      });
    }

    res.json(result); // Send all items as JSON
  });
}); // Fetch a single item by ID

router.get('/:id', function (req, res) {
  var id = req.params.id;
  var query = "SELECT * FROM items WHERE item_id = ?";
  db.query(query, [id], function (err, result) {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({
        error: 'Database fetch error'
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        error: "Item with ID ".concat(id, " not found")
      });
    }

    res.json(result[0]); // Send the single item as JSON
  });
}); // Update an item (already provided)

router.put('/:id', function (req, res) {
  var id = req.params.id;
  var _req$body = req.body,
      item_name = _req$body.item_name,
      unit = _req$body.unit,
      category = _req$body.category,
      min_quantity = _req$body.min_quantity;
  var query = "\n        UPDATE items \n        SET item_name = ?, unit = ?, category = ?, min_quantity = ? \n        WHERE item_id = ?\n    ";
  var data = [item_name, unit.toUpperCase(), category, min_quantity, id];
  db.query(query, data, function (err, result) {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({
        error: 'Database update error'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Item with ID ".concat(id, " not found")
      });
    }

    res.json({
      message: "Item with ID ".concat(id, " updated successfully")
    });
  });
}); // Delete an item (already provided)

router["delete"]('/:id', function (req, res) {
  var id = req.params.id;
  var query = "DELETE FROM items WHERE item_id = ?";
  db.query(query, [id], function (err, result) {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({
        error: 'Database delete error'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Item with ID ".concat(id, " not found")
      });
    }

    res.json({
      message: "Item with ID ".concat(id, " deleted successfully")
    });
  });
});
module.exports = router;