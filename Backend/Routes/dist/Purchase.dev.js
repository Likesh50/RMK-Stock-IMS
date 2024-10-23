"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var express = require('express');

var db = require('../db');

var moment = require('moment');

var router = express.Router();
router.get('/getItems', function _callee(req, res) {
  var _ref, _ref2, rows;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          console.log("working");
          _context.next = 4;
          return regeneratorRuntime.awrap(db.promise().query('SELECT item_name,category FROM items ORDER BY item_name'));

        case 4:
          _ref = _context.sent;
          _ref2 = _slicedToArray(_ref, 1);
          rows = _ref2[0];
          res.status(200).json(rows);
          _context.next = 14;
          break;

        case 10:
          _context.prev = 10;
          _context.t0 = _context["catch"](0);
          console.error('Error fetching items:', _context.t0);
          res.status(500).json({
            message: 'Internal server error'
          });

        case 14:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 10]]);
});
router.post('/getCategoryVendor', function _callee2(req, res) {
  var item, _ref3, _ref4, rows;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          item = req.body.item;

          if (item) {
            _context2.next = 3;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            message: 'Item is required'
          }));

        case 3:
          _context2.prev = 3;
          _context2.next = 6;
          return regeneratorRuntime.awrap(db.promise().query('SELECT category FROM items WHERE item_name = ?', [item]));

        case 6:
          _ref3 = _context2.sent;
          _ref4 = _slicedToArray(_ref3, 1);
          rows = _ref4[0];
          res.status(200).json(rows);
          _context2.next = 16;
          break;

        case 12:
          _context2.prev = 12;
          _context2.t0 = _context2["catch"](3);
          console.error('Error fetching category:', _context2.t0);
          res.status(500).json({
            message: 'Internal server error'
          });

        case 16:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[3, 12]]);
});
router.post('/add', function _callee3(req, res) {
  var arr, date, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item, itemName, category, quantity, manufacturingDate, amount, expiry, invoice, address, purchaseQuantity, total, expiryMonths, manifacturedate, rawDate, year, month, day, FormattedManufacturingDate, getItemQuery, _ref5, _ref6, itemResult, item_id, insertPurchaseQuery, _ref7, _ref8, purchaseResult, purchase_id, insertStockQuery;

  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          console.log("Processing request...");
          arr = req.body.arr;
          date = req.body.date;
          console.log(arr);
          console.log(date);
          _context3.prev = 5;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context3.prev = 9;
          _iterator = arr[Symbol.iterator]();

        case 11:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context3.next = 46;
            break;
          }

          item = _step.value;
          itemName = item.item, category = item.category, quantity = item.quantity, manufacturingDate = item.manufacturingDate, amount = item.amount, expiry = item.expiry, invoice = item.invoice, address = item.address;
          purchaseQuantity = Number(quantity) || 0;
          total = Number(amount) || 0;
          expiryMonths = Number(expiry);
          manifacturedate = new Date(manufacturingDate);
          rawDate = manifacturedate.toISOString().split('T')[0];
          manifacturedate.setMonth(manifacturedate.getMonth() + expiryMonths);
          year = manifacturedate.getFullYear();
          month = String(manifacturedate.getMonth() + 1).padStart(2, '0');
          day = String(manifacturedate.getDate()).padStart(2, '0');
          FormattedManufacturingDate = "".concat(year, "-").concat(month, "-").concat(day);
          console.log(itemName, purchaseQuantity, total, FormattedManufacturingDate);
          getItemQuery = 'SELECT item_id FROM items WHERE item_name = ? AND category = ?';
          _context3.next = 28;
          return regeneratorRuntime.awrap(db.promise().query(getItemQuery, [itemName, category]));

        case 28:
          _ref5 = _context3.sent;
          _ref6 = _slicedToArray(_ref5, 1);
          itemResult = _ref6[0];
          item_id = itemResult[0].item_id;
          insertPurchaseQuery = "INSERT INTO purchases (item_id, quantity, invoice_no, amount, shop_address, purchase_date,manufacturing_date, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
          _context3.next = 35;
          return regeneratorRuntime.awrap(db.promise().query(insertPurchaseQuery, [item_id, quantity, invoice, amount, address, date, rawDate, FormattedManufacturingDate]));

        case 35:
          _ref7 = _context3.sent;
          _ref8 = _slicedToArray(_ref7, 1);
          purchaseResult = _ref8[0];
          purchase_id = purchaseResult.insertId;
          insertStockQuery = "INSERT INTO stock (purchase_id, item_id, quantity) VALUES (?, ?, ?)";
          _context3.next = 42;
          return regeneratorRuntime.awrap(db.promise().query(insertStockQuery, [purchase_id, item_id, quantity]));

        case 42:
          console.log('Purchase and stock records inserted successfully');

        case 43:
          _iteratorNormalCompletion = true;
          _context3.next = 11;
          break;

        case 46:
          _context3.next = 52;
          break;

        case 48:
          _context3.prev = 48;
          _context3.t0 = _context3["catch"](9);
          _didIteratorError = true;
          _iteratorError = _context3.t0;

        case 52:
          _context3.prev = 52;
          _context3.prev = 53;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 55:
          _context3.prev = 55;

          if (!_didIteratorError) {
            _context3.next = 58;
            break;
          }

          throw _iteratorError;

        case 58:
          return _context3.finish(55);

        case 59:
          return _context3.finish(52);

        case 60:
          res.send("Items processed successfully");
          _context3.next = 67;
          break;

        case 63:
          _context3.prev = 63;
          _context3.t1 = _context3["catch"](5);
          console.error("Error processing request:", _context3.t1);
          res.status(500).send("An error occurred");

        case 67:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[5, 63], [9, 48, 52, 60], [53,, 55, 59]]);
});
router.get('/getPurchases/:date', function _callee4(req, res) {
  var date, _ref9, _ref10, rows;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          date = req.params.date;
          _context4.prev = 1;
          _context4.next = 4;
          return regeneratorRuntime.awrap(db.promise().query('SELECT i.item_name,p.* FROM purchases p,items i WHERE p.item_id=i.item_id and p.purchase_date = ?', [date]));

        case 4:
          _ref9 = _context4.sent;
          _ref10 = _slicedToArray(_ref9, 1);
          rows = _ref10[0];
          res.status(200).json(rows);
          _context4.next = 14;
          break;

        case 10:
          _context4.prev = 10;
          _context4.t0 = _context4["catch"](1);
          console.error('Error fetching purchases:', _context4.t0);
          res.status(500).json({
            message: 'Internal server error'
          });

        case 14:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[1, 10]]);
});
router.post('/updatePurchase', function _callee5(req, res) {
  var _req$body, purchase_id, quantity, invoice_no, amount, shop_address, manufacturing_date, expiry_date, formattedManufacturingDate, formattedExpiryDate, updateQuery;

  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _req$body = req.body, purchase_id = _req$body.purchase_id, quantity = _req$body.quantity, invoice_no = _req$body.invoice_no, amount = _req$body.amount, shop_address = _req$body.shop_address, manufacturing_date = _req$body.manufacturing_date, expiry_date = _req$body.expiry_date;
          formattedManufacturingDate = moment(manufacturing_date).format('YYYY-MM-DD');
          formattedExpiryDate = moment(expiry_date).format('YYYY-MM-DD');

          if (!(!purchase_id || quantity === undefined || !invoice_no || amount === undefined || !shop_address || !manufacturing_date || !expiry_date)) {
            _context5.next = 5;
            break;
          }

          return _context5.abrupt("return", res.status(400).json({
            message: 'All fields are required'
          }));

        case 5:
          _context5.prev = 5;
          updateQuery = "UPDATE purchases SET quantity = ?, invoice_no = ?, amount = ?, shop_address = ?, manufacturing_date = ?, expiry_date = ? WHERE purchase_id = ?";
          _context5.next = 9;
          return regeneratorRuntime.awrap(db.promise().query(updateQuery, [quantity, invoice_no, amount, shop_address, formattedManufacturingDate, formattedExpiryDate, purchase_id]));

        case 9:
          res.status(200).json({
            message: 'Purchase updated successfully'
          });
          _context5.next = 16;
          break;

        case 12:
          _context5.prev = 12;
          _context5.t0 = _context5["catch"](5);
          console.error('Error updating purchase:', _context5.t0);
          res.status(500).json({
            message: 'Internal server error'
          });

        case 16:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[5, 12]]);
});
module.exports = router;