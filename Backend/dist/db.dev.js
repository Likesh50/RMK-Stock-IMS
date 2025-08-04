"use strict";

var mysql = require('mysql2');

var pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'pass123',
  database: 'inventory',
  waitForConnections: true,
  connectionLimit: 10,
  // can scale as needed
  queueLimit: 0
});
module.exports = pool.promise();