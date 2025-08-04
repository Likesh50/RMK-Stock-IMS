"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var express = require('express');

var db = require('../db');

var router = express.Router();
router.get('/getCategory', function _callee(req, res) {
  var _ref, _ref2, rows;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          console.log("working");
          _context.next = 4;
          return regeneratorRuntime.awrap(db.query('SELECT category, sub_category FROM items GROUP BY category, sub_category'));

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
router.get('/getSubCategories', function _callee2(req, res) {
  var _ref3, _ref4, rows;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(db.query('SELECT DISTINCT sub_category FROM items ORDER BY sub_category where category=?', category));

        case 3:
          _ref3 = _context2.sent;
          _ref4 = _slicedToArray(_ref3, 1);
          rows = _ref4[0];
          return _context2.abrupt("return", res.status(200).json(rows));

        case 9:
          _context2.prev = 9;
          _context2.t0 = _context2["catch"](0);
          console.error('Error fetching subcategories:', _context2.t0);
          return _context2.abrupt("return", res.status(500).json({
            message: 'Internal server error'
          }));

        case 13:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 9]]);
});
router.get('/getItemCategory', function _callee3(req, res) {
  var _ref5, _ref6, rows;

  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          console.log("working");
          _context3.next = 4;
          return regeneratorRuntime.awrap(db.query('SELECT item_name,category,sub_category,unit,min_quantity FROM items ORDER BY item_name'));

        case 4:
          _ref5 = _context3.sent;
          _ref6 = _slicedToArray(_ref5, 1);
          rows = _ref6[0];
          res.status(200).json(rows);
          _context3.next = 14;
          break;

        case 10:
          _context3.prev = 10;
          _context3.t0 = _context3["catch"](0);
          console.error('Error fetching items:', _context3.t0);
          res.status(500).json({
            message: 'Internal server error'
          });

        case 14:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 10]]);
});
router.post('/insert', function _callee4(req, res) {
  var _req$body, category, subCategory, itemName, unit, minimum, _ref7, _ref8, existing;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _req$body = req.body, category = _req$body.category, subCategory = _req$body.subCategory, itemName = _req$body.itemName, unit = _req$body.unit, minimum = _req$body.minimum;
          console.log(req.body);
          _context4.prev = 2;
          _context4.next = 5;
          return regeneratorRuntime.awrap(db.query('SELECT * FROM items WHERE item_name = ?', [itemName]));

        case 5:
          _ref7 = _context4.sent;
          _ref8 = _slicedToArray(_ref7, 1);
          existing = _ref8[0];

          if (!(existing.length > 0)) {
            _context4.next = 10;
            break;
          }

          return _context4.abrupt("return", res.status(400).send('Record already exists'));

        case 10:
          _context4.next = 12;
          return regeneratorRuntime.awrap(db.query('INSERT INTO items (item_name, category, sub_category, unit, min_quantity) VALUES (?, ?, ?, ?, ?)', [itemName, category, subCategory, unit, minimum]));

        case 12:
          return _context4.abrupt("return", res.status(200).send('Item inserted successfully'));

        case 15:
          _context4.prev = 15;
          _context4.t0 = _context4["catch"](2);
          console.error(_context4.t0);
          return _context4.abrupt("return", res.status(500).send('Error inserting item'));

        case 19:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[2, 15]]);
});
router.get('/getBySubCategory', function _callee5(req, res) {
  var sub_category, _ref9, _ref10, rows;

  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          sub_category = req.query.sub_category;
          _context5.prev = 1;
          _context5.next = 4;
          return regeneratorRuntime.awrap(db.query('SELECT * FROM items WHERE sub_category = ? ORDER BY item_name', [sub_category]));

        case 4:
          _ref9 = _context5.sent;
          _ref10 = _slicedToArray(_ref9, 1);
          rows = _ref10[0];
          return _context5.abrupt("return", res.status(200).json(rows));

        case 10:
          _context5.prev = 10;
          _context5.t0 = _context5["catch"](1);
          console.error('Error fetching by subcategory:', _context5.t0);
          return _context5.abrupt("return", res.status(500).json({
            message: 'Internal server error'
          }));

        case 14:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[1, 10]]);
});
module.exports = router;