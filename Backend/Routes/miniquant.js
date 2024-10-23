const express = require('express');
const db = require('../db'); // Assuming your database connection is set up in db.js
const router = express.Router();

router.get('/minquant', (req, res) => {
  const query = `
    SELECT 
    i.item_name, 
    i.min_quantity, 
    COALESCE(SUM(s.quantity), 0) AS total_quantity, 
    i.unit, 
    i.category
    FROM 
        items i
    LEFT JOIN 
        stock s ON i.item_id = s.item_id
    GROUP BY 
        i.item_id, 
        i.item_name, 
        i.min_quantity, 
        i.unit, 
        i.category
    HAVING 
        (total_quantity < i.min_quantity) OR (total_quantity = 0 AND i.min_quantity > 0);
  `;

  // Use db.query instead of connection.query
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Database query error' });
    }

    // Check if no results were found
    if (results.length === 0) {
      return res.status(404).json({ error: 'No items found' });
    }

    // Send results to the frontend
    res.json(results);
  });
});

module.exports = router;