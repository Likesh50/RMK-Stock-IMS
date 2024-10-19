const express = require('express');
const db = require('../db'); 
const router = express.Router();

router.get('/expiry-items', (req, res) => {
    const query = `
      SELECT 
        i.item_name AS itemName, 
        s.quantity, 
        i.category,
        i.unit, 
        p.shop_address AS shopAddress, 
        p.manufacturing_date AS manufacturingDate, 
        p.expiry_date AS expiryDate
      FROM 
        stock s
      JOIN 
        purchases p ON s.purchase_id = p.purchase_id
      JOIN 
        items i ON p.item_id = i.item_id
      WHERE 
        p.expiry_date < CURDATE() + INTERVAL 30 DAY
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ error: 'Database query error' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ error: 'No items found' });
      }
  
      res.json(results);  // Send the data in the expected format
    });
  });
  
module.exports = router;