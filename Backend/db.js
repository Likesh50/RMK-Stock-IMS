const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Kamali@06',
  database: 'inventory',
  waitForConnections: true,
  connectionLimit: 10, 
  queueLimit: 0
});

module.exports = pool.promise();