var express = require('express');
const db = require('../db');
var router = express.Router();
router.get('/getItems', async (req, res) => {
    try {
      console.log("working");
      const [rows] = await db.promise().query('SELECT item_name,category FROM items ORDER BY item_name');
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  router.post('/getCategoryVendor', async (req, res) => {
    const { item } = req.body;
  
    if (!item) {
      return res.status(400).json({ message: 'Item is required' });
    }
    try {
      const [rows] = await db.promise().query('SELECT category FROM items WHERE item_name = ?', [item]);
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  router.post('/add', async (req, res) => {
    console.log("Processing request...");
    const arr = req.body.arr; 
    const date = req.body.date;
    console.log(arr);
    console.log(date);
  
    try {
      for (let item of arr) {  
        const { item: itemName, category, quantity,manufacturingDate, amount,expiry,invoice, address } = item;
        const purchaseQuantity = Number(quantity) || 0;
        const total = Number(amount) || 0;
        const expiryMonths = Number(expiry);


        let manifacturedate = new Date(manufacturingDate);
        const rawDate = manifacturedate.toISOString().split('T')[0];
        manifacturedate.setMonth(manifacturedate.getMonth() + expiryMonths);
      
        const year = manifacturedate.getFullYear();
        const month = String(manifacturedate.getMonth() + 1).padStart(2, '0'); 
        const day = String(manifacturedate.getDate()).padStart(2, '0');

        const FormattedManufacturingDate=`${year}-${month}-${day}`;
        
        console.log(itemName, purchaseQuantity, total, FormattedManufacturingDate);
  

        const getItemQuery = 'SELECT item_id FROM items WHERE item_name = ? AND category = ?';

        const [itemResult] = await db.promise().query(getItemQuery, [itemName, category]);
        const item_id = itemResult[0].item_id;

        // Insert the purchase record
        const insertPurchaseQuery = `INSERT INTO purchases (item_id, quantity, invoice_no, amount, shop_address, purchase_date,manufacturing_date, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const [purchaseResult] = await db.promise().query(insertPurchaseQuery, [item_id, quantity, invoice, amount, address, date, rawDate, FormattedManufacturingDate]);

        // Get the inserted purchase ID
        const purchase_id = purchaseResult.insertId;

        // Insert the record into the stock table
        const insertStockQuery = `INSERT INTO stock (purchase_id, item_id, quantity) VALUES (?, ?, ?)`;
        await db.promise().query(insertStockQuery, [purchase_id, item_id, quantity]);

        console.log('Purchase and stock records inserted successfully');

      }
  
      res.send("Items processed successfully");
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).send("An error occurred");
    }

    
  });

  
  
  
    
  module.exports=router;