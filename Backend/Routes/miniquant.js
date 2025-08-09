const express = require('express');
const db = require('../db'); // Assuming your database connection is set up in db.js
const router = express.Router();

router.get('/minquant', async (req, res) => {
  const locationId = req.query.location_id;

  if (!locationId) {
    return res.status(400).json({ error: 'Missing location_id in query' });
  }

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
      stock s ON i.item_id = s.item_id AND s.location_id = ?
    GROUP BY 
      i.item_id, i.item_name, i.min_quantity, i.unit, i.category
    HAVING 
      total_quantity < i.min_quantity OR (total_quantity = 0 AND i.min_quantity > 0)
  `;

  try {
    const [results] = await db.query(query, [locationId]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'No items found' });
    }

    res.json(results);
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).json({ error: 'Database query error' });
  }
});


module.exports = router;