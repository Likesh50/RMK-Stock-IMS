"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var express = require('express');

var mysql = require("mysql2");

var db = require('../db');

var router = express.Router();
router.get('/items', function (req, res) {
  var sql = 'SELECT item_id, item_name FROM items';
  db.query(sql, function (error, results) {
    if (error) {
      return res.status(500).json({
        error: 'Database query failed'
      });
    } // Send results as JSON


    res.json(results);
  });
});
router.get('/expiry/:item_id', function _callee(req, res) {
  var item_id, _ref, _ref2, expiryDates;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          item_id = req.params.item_id;
          _context.prev = 1;
          _context.next = 4;
          return regeneratorRuntime.awrap(db.query("SELECT p.expiry_date, p.purchase_id\n                FROM purchases p\n                JOIN stock s ON p.item_id = s.item_id\n                WHERE s.item_id = ?\n                GROUP BY p.expiry_date, p.purchase_id", [item_id]));

        case 4:
          _ref = _context.sent;
          _ref2 = _slicedToArray(_ref, 1);
          expiryDates = _ref2[0];
          res.json(expiryDates);
          _context.next = 14;
          break;

        case 10:
          _context.prev = 10;
          _context.t0 = _context["catch"](1);
          console.error('Error retrieving expiry dates:', _context.t0);
          res.status(500).json({
            error: 'Internal Server Error'
          });

        case 14:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 10]]);
}); // Retrieve current stock for an item by item_id

router.get('/retrieveStock/:item_id/:purchase_id', function _callee2(req, res) {
  var _req$params, item_id, purchase_id, _ref3, _ref4, stock;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _req$params = req.params, item_id = _req$params.item_id, purchase_id = _req$params.purchase_id;
          _context2.prev = 1;
          _context2.next = 4;
          return regeneratorRuntime.awrap(db.query('SELECT quantity FROM stock WHERE item_id = ? AND purchase_id = ?', [item_id, purchase_id]));

        case 4:
          _ref3 = _context2.sent;
          _ref4 = _slicedToArray(_ref3, 1);
          stock = _ref4[0];

          if (!(stock.length === 0)) {
            _context2.next = 9;
            break;
          }

          return _context2.abrupt("return", res.status(404).json({
            message: 'No stock found for this item and purchase.'
          }));

        case 9:
          res.json(stock[0]); // Send the first entry as the current stock for the selected purchase

          _context2.next = 16;
          break;

        case 12:
          _context2.prev = 12;
          _context2.t0 = _context2["catch"](1);
          console.error('Error retrieving stock:', _context2.t0);
          res.status(500).json({
            error: 'Internal Server Error'
          });

        case 16:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[1, 12]]);
});
/**
 * Create a new dispatch and update stock accordingly
 */

router.post('/createDispatch', function _callee3(req, res) {
  var dispatchData, queries, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item, purchase_id, item_id, quantity, location, receiver, incharge, dispatch_date, current_time_result, current_time, _ref5, _ref6, currentStock, newQuantity, _i2, _queries, query;

  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          dispatchData = req.body;

          if (!(!Array.isArray(dispatchData) || dispatchData.length === 0)) {
            _context3.next = 3;
            break;
          }

          return _context3.abrupt("return", res.status(400).json({
            error: 'Invalid or empty dispatch data'
          }));

        case 3:
          _context3.prev = 3;
          _context3.next = 6;
          return regeneratorRuntime.awrap(db.query('START TRANSACTION'));

        case 6:
          queries = [];
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context3.prev = 10;
          _iterator = dispatchData[Symbol.iterator]();

        case 12:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context3.next = 36;
            break;
          }

          item = _step.value;
          purchase_id = item.purchase_id, item_id = item.item_id, quantity = item.quantity, location = item.location, receiver = item.receiver, incharge = item.incharge, dispatch_date = item.dispatch_date;
          console.log(item); // Correctly extract the current time value

          _context3.next = 18;
          return regeneratorRuntime.awrap(db.query('SELECT CURRENT_TIME() as currentTime'));

        case 18:
          current_time_result = _context3.sent;
          current_time = current_time_result[0][0].currentTime; // Get the time as a string

          console.log("THE PURCHASE ID IS" + purchase_id); // Insert into dispatch table

          queries.push({
            sql: "\n                        INSERT INTO dispatch (purchase_id,quantity, location, receiver, incharge, dispatch_date,dispatch_time)\n                        VALUES (?,?, ?, ?, ?, ?,?)",
            values: [purchase_id, quantity, location, receiver, incharge, dispatch_date, current_time]
          }); // Update stock for the dispatched item

          _context3.next = 24;
          return regeneratorRuntime.awrap(db.query('SELECT quantity FROM stock WHERE purchase_id = ? AND item_id = ? LIMIT 1', [purchase_id, item_id]));

        case 24:
          _ref5 = _context3.sent;
          _ref6 = _slicedToArray(_ref5, 1);
          currentStock = _ref6[0];

          if (!(currentStock.length === 0)) {
            _context3.next = 29;
            break;
          }

          throw new Error('No stock found for the specified purchase and item.');

        case 29:
          newQuantity = currentStock[0].quantity - quantity;

          if (!(newQuantity < 0)) {
            _context3.next = 32;
            break;
          }

          throw new Error('Insufficient stock for the item.');

        case 32:
          if (newQuantity === 0) {
            // If stock becomes zero, remove the entry from stock table
            queries.push({
              sql: 'DELETE FROM stock WHERE purchase_id = ? AND item_id = ?',
              values: [purchase_id, item_id]
            });
          } else {
            // Otherwise, just update the stock quantity
            queries.push({
              sql: 'UPDATE stock SET quantity = ? WHERE purchase_id = ? AND item_id = ?',
              values: [newQuantity, purchase_id, item_id]
            });
          }

        case 33:
          _iteratorNormalCompletion = true;
          _context3.next = 12;
          break;

        case 36:
          _context3.next = 42;
          break;

        case 38:
          _context3.prev = 38;
          _context3.t0 = _context3["catch"](10);
          _didIteratorError = true;
          _iteratorError = _context3.t0;

        case 42:
          _context3.prev = 42;
          _context3.prev = 43;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 45:
          _context3.prev = 45;

          if (!_didIteratorError) {
            _context3.next = 48;
            break;
          }

          throw _iteratorError;

        case 48:
          return _context3.finish(45);

        case 49:
          return _context3.finish(42);

        case 50:
          _i2 = 0, _queries = queries;

        case 51:
          if (!(_i2 < _queries.length)) {
            _context3.next = 58;
            break;
          }

          query = _queries[_i2];
          _context3.next = 55;
          return regeneratorRuntime.awrap(db.query(query.sql, query.values));

        case 55:
          _i2++;
          _context3.next = 51;
          break;

        case 58:
          _context3.next = 60;
          return regeneratorRuntime.awrap(db.query('COMMIT'));

        case 60:
          res.json({
            message: 'Dispatch created and stock updated successfully'
          });
          _context3.next = 69;
          break;

        case 63:
          _context3.prev = 63;
          _context3.t1 = _context3["catch"](3);
          _context3.next = 67;
          return regeneratorRuntime.awrap(db.query('ROLLBACK'));

        case 67:
          console.error('Error creating dispatch:', _context3.t1);
          res.status(500).json({
            error: 'Internal Server Error'
          });

        case 69:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[3, 63], [10, 38, 42, 50], [43,, 45, 49]]);
});
/**
 * Retrieve dispatches by purchase_id
 */

router.get('/retrieveDispatches/:purchase_id', function _callee4(req, res) {
  var purchase_id, _ref7, _ref8, dispatches;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          purchase_id = req.params.purchase_id;
          _context4.prev = 1;
          _context4.next = 4;
          return regeneratorRuntime.awrap(db.query('SELECT * FROM dispatch WHERE purchase_id = ?', [purchase_id]));

        case 4:
          _ref7 = _context4.sent;
          _ref8 = _slicedToArray(_ref7, 1);
          dispatches = _ref8[0];

          if (!(dispatches.length === 0)) {
            _context4.next = 9;
            break;
          }

          return _context4.abrupt("return", res.status(404).json({
            message: 'No dispatches found for this purchase.'
          }));

        case 9:
          res.json(dispatches);
          _context4.next = 16;
          break;

        case 12:
          _context4.prev = 12;
          _context4.t0 = _context4["catch"](1);
          console.error('Error retrieving dispatches:', _context4.t0);
          res.status(500).json({
            error: 'Internal Server Error'
          });

        case 16:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[1, 12]]);
});
/**
 * Retrieve current stock for an item by item_id
 */

router.get('/retrieveStock/:item_id', function _callee5(req, res) {
  var item_id, _ref9, _ref10, stock;

  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          item_id = req.params.item_id;
          _context5.prev = 1;
          _context5.next = 4;
          return regeneratorRuntime.awrap(db.query('SELECT * FROM stock WHERE item_id = ?', [item_id]));

        case 4:
          _ref9 = _context5.sent;
          _ref10 = _slicedToArray(_ref9, 1);
          stock = _ref10[0];

          if (!(stock.length === 0)) {
            _context5.next = 9;
            break;
          }

          return _context5.abrupt("return", res.status(404).json({
            message: 'No stock found for this item.'
          }));

        case 9:
          res.json(stock);
          _context5.next = 16;
          break;

        case 12:
          _context5.prev = 12;
          _context5.t0 = _context5["catch"](1);
          console.error('Error retrieving stock:', _context5.t0);
          res.status(500).json({
            error: 'Internal Server Error'
          });

        case 16:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[1, 12]]);
});
router.get('/getDispatches/:date', function _callee6(req, res) {
  var date, _ref11, _ref12, rows;

  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          date = req.params.date;
          _context6.prev = 1;
          _context6.next = 4;
          return regeneratorRuntime.awrap(db.query("\n            SELECT d.*, i.item_name \n            FROM dispatch d \n            JOIN purchases p ON d.purchase_id = p.purchase_id \n            JOIN items i ON p.item_id = i.item_id \n            WHERE d.dispatch_date = ?", [date]));

        case 4:
          _ref11 = _context6.sent;
          _ref12 = _slicedToArray(_ref11, 1);
          rows = _ref12[0];
          res.status(200).json(rows);
          _context6.next = 14;
          break;

        case 10:
          _context6.prev = 10;
          _context6.t0 = _context6["catch"](1);
          console.error('Error fetching dispatches:', _context6.t0);
          res.status(500).json({
            message: 'Internal server error'
          });

        case 14:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[1, 10]]);
});
router.post('/updateDispatch', function _callee7(req, res) {
  var _req$body, dispatch_id, quantity, location, receiver, incharge, updateQuery;

  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _req$body = req.body, dispatch_id = _req$body.dispatch_id, quantity = _req$body.quantity, location = _req$body.location, receiver = _req$body.receiver, incharge = _req$body.incharge;

          if (!(!dispatch_id || quantity === undefined || !location || !receiver || !incharge)) {
            _context7.next = 3;
            break;
          }

          return _context7.abrupt("return", res.status(400).json({
            message: 'All fields are required'
          }));

        case 3:
          _context7.prev = 3;
          updateQuery = "UPDATE dispatch SET quantity = ?, location = ?, receiver = ?, incharge = ? WHERE dispatch_id = ?";
          _context7.next = 7;
          return regeneratorRuntime.awrap(db.query(updateQuery, [quantity, location, receiver, incharge, dispatch_id]));

        case 7:
          res.status(200).json({
            message: 'Dispatch updated successfully'
          });
          _context7.next = 14;
          break;

        case 10:
          _context7.prev = 10;
          _context7.t0 = _context7["catch"](3);
          console.error('Error updating dispatch:', _context7.t0);
          res.status(500).json({
            message: 'Internal server error'
          });

        case 14:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[3, 10]]);
});
module.exports = router;