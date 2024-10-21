"use strict";

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
app.post('/login', function (req, res) {
  var _req$body = req.body,
      username = _req$body.username,
      password = _req$body.password;
  db.query('SELECT * FROM users WHERE uname = ?', [username], function (err, result) {
    if (err) {
      return res.status(500).json({
        message: 'Database error',
        err: err
      });
    }

    if (result.length === 0) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    var user = result[0];
    bcrypt.compare(password, user.pass, function (err, isMatch) {
      if (!isMatch) {
        return res.status(401).json({
          message: 'Invalid credentials'
        });
      }

      var token = jwt.sign({
        id: user.id,
        role: user.role,
        uname: user.uname
      }, JWT_SECRET, {
        expiresIn: '1h'
      });
      return res.json({
        token: token,
        role: user.role,
        uname: user.uname
      });
    });
  });
});
app.post('/signup', function (req, res) {
  var _req$body2 = req.body,
      username = _req$body2.username,
      password = _req$body2.password,
      role = _req$body2.role;
  db.query('SELECT * FROM users WHERE uname = ?', [username], function (err, result) {
    if (err) {
      return res.status(500).json({
        message: 'Database error',
        err: err
      });
    }

    if (result.length > 0) {
      return res.status(400).json({
        message: 'Username already exists'
      });
    }

    var hashedPassword = bcrypt.hashSync(password, 10);
    db.query('INSERT INTO users (uname, pass, role) VALUES (?, ?, ?)', [username, hashedPassword, role], function (err, result) {
      if (err) {
        return res.status(500).json({
          message: 'Error inserting user',
          err: err
        });
      }

      return res.status(201).json({
        message: 'User created',
        role: role
      });
    });
  });
});
app.listen(3002, function () {
  console.log("You r up!!!");
});