const express = require('express');
const db = require('../db'); // Assuming your database connection is set up in db.js
const router = express.Router();

// Route to fetch dispatch report between two dates
router.get('/dispatchReport', async (req, res) => {
  try {
    // Get the start and end dates from the query parameters
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required.'
      });
    }

    // Query to fetch dispatch data between the specified dates (inclusive)
    const query = `
      SELECT 
    i.item_name,
    i.category,
    d.quantity,
    d.dispatch_date,
    d.location,
    d.receiver,
    d.incharge
    
    FROM 
        dispatch d
    JOIN 
        purchases p ON d.purchase_id = p.purchase_id
    JOIN 
        items i ON p.item_id = i.item_id
    WHERE 
        d.dispatch_date BETWEEN ? AND ?
    ORDER BY 
        d.dispatch_date ASC;

    `;

    // Execute the query with the provided dates
    const [rows] = await db.promise().query(query,[startDate,endDate]);

    // Send the data as a response
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching dispatch report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dispatch report'
    });
  }
});
router.get('/purchaseReport', async (req, res) => {
    try {
      // Get the start and end dates from the query parameters
      const { startDate, endDate } = req.query;
  
      // Query to fetch purchase data between the specified dates (inclusive)
      const query = `
        SELECT 
        i.item_name,
        i.category,
        p.quantity,
        p.invoice_no,
        p.amount,
        p.shop_address,
        p.purchase_date,
        p.manufacturing_date,
        p.expiry_date
        FROM 
            purchases p
        JOIN 
            items i ON p.item_id = i.item_id
        WHERE 
            p.purchase_date BETWEEN ? AND ?
        ORDER BY 
            p.purchase_date ASC;

      `;
  
      // Execute the query with the provided dates
      const [rows] = await db.promise().query(query, [startDate, endDate]);
  
      // Send the data as a response
      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error fetching purchase report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch purchase report'
      });
    }
  });
module.exports = router;
