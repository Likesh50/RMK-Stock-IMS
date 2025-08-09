"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var express = require("express");

var app = express();

var mysql = require("mysql2");

var cors = require("cors");

var bodyParser = require('body-parser');

var bcrypt = require('bcryptjs');

var jwt = require('jsonwebtoken');

var purchaseRtr = require('./Routes/Purchase');

var Stocks = require('./Routes/Stocks');

var Dispatch = require('./Routes/Dispatch');

var addItems = require('./Routes/addItems');

var graphItem = require('./Routes/graph');

var Reports = require("./Routes/Report");

var miniquant = require("./Routes/miniquant");

var itemtoexpire = require("./Routes/expiry");

var itemRoutes = require('./Routes/items');

var db = require('./db');

app.use(cors({
  origin: '*',
  // You can specify your frontend URL here instead of '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(express.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use('/purchase', purchaseRtr);
app.use('/stocks', Stocks);
app.use('/dispatch', Dispatch);
app.use('/addItems', addItems);
app.use('/graph', graphItem);
app.use('/report', Reports);
app.use("/minquant", miniquant);
app.use("/expiry", itemtoexpire);
app.use('/items', itemRoutes);
var JWT_SECRET = 'rmkecmessmanagement-IT-2022-2026';
app.post('/login', function _callee(req, res) {
  var _req$body, username, password, _ref, _ref2, result, user, isMatch, token;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _req$body = req.body, username = _req$body.username, password = _req$body.password;
          _context.prev = 1;
          _context.next = 4;
          return regeneratorRuntime.awrap(db.query('SELECT * FROM users WHERE uname = ?', [username]));

        case 4:
          _ref = _context.sent;
          _ref2 = _slicedToArray(_ref, 1);
          result = _ref2[0];

          if (!(result.length === 0)) {
            _context.next = 9;
            break;
          }

          return _context.abrupt("return", res.status(401).json({
            message: 'Invalid credentials'
          }));

        case 9:
          user = result[0];
          _context.next = 12;
          return regeneratorRuntime.awrap(bcrypt.compare(password, user.pass));

        case 12:
          isMatch = _context.sent;

          if (isMatch) {
            _context.next = 15;
            break;
          }

          return _context.abrupt("return", res.status(401).json({
            message: 'Invalid credentials'
          }));

        case 15:
          token = jwt.sign({
            id: user.id,
            role: user.role,
            uname: user.uname,
            locations: user.location_ids
          }, JWT_SECRET, {
            expiresIn: '1h'
          });
          return _context.abrupt("return", res.json({
            token: token,
            role: user.role,
            uname: user.uname
          }));

        case 19:
          _context.prev = 19;
          _context.t0 = _context["catch"](1);
          return _context.abrupt("return", res.status(500).json({
            message: 'Server error',
            err: _context.t0
          }));

        case 22:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 19]]);
});
app.get("/locations", function _callee2(req, res) {
  var _ref3, _ref4, rows;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(db.query('SELECT * from locations'));

        case 3:
          _ref3 = _context2.sent;
          _ref4 = _slicedToArray(_ref3, 1);
          rows = _ref4[0];
          return _context2.abrupt("return", res.status(200).json(rows));

        case 9:
          _context2.prev = 9;
          _context2.t0 = _context2["catch"](0);
          return _context2.abrupt("return", res.status(500).json({
            message: 'Internal server error',
            err: err
          }));

        case 12:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 9]]);
});
app.post('/signup', function _callee3(req, res) {
  var _req$body2, username, password, role, locations, _ref5, _ref6, existing, hashedPassword, locationJSON;

  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _req$body2 = req.body, username = _req$body2.username, password = _req$body2.password, role = _req$body2.role, locations = _req$body2.locations;
          _context3.prev = 1;
          _context3.next = 4;
          return regeneratorRuntime.awrap(db.query('SELECT * FROM users WHERE uname = ?', [username]));

        case 4:
          _ref5 = _context3.sent;
          _ref6 = _slicedToArray(_ref5, 1);
          existing = _ref6[0];

          if (!(existing.length > 0)) {
            _context3.next = 9;
            break;
          }

          return _context3.abrupt("return", res.status(400).json({
            message: 'Username already exists'
          }));

        case 9:
          _context3.next = 11;
          return regeneratorRuntime.awrap(bcrypt.hash(password, 10));

        case 11:
          hashedPassword = _context3.sent;
          // ✅ Convert array to JSON string
          locationJSON = JSON.stringify(locations);
          _context3.next = 15;
          return regeneratorRuntime.awrap(db.query('INSERT INTO users (uname, pass, role, location_ids) VALUES (?, ?, ?, ?)', [username, hashedPassword, role, locationJSON]));

        case 15:
          return _context3.abrupt("return", res.status(201).json({
            message: 'User created',
            role: role
          }));

        case 18:
          _context3.prev = 18;
          _context3.t0 = _context3["catch"](1);
          console.error('Signup Error:', _context3.t0);
          return _context3.abrupt("return", res.status(500).json({
            message: 'Error inserting user',
            err: _context3.t0
          }));

        case 22:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[1, 18]]);
});
app.listen(3002, function () {
  console.log("You r up!!!");
});