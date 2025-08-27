var express = require('express');
const db = require('../db');
const moment = require('moment');
var router = express.Router();

router.get('/categories', async (req, res) => {
  const { item } = req.query;             // moved to query for GET
  if (!item) {
    return res.status(400).json({ message: 'Item is required' });
  }
  try {
    const [rows] = await db.query(
      'SELECT category FROM items WHERE item_name = ?',
      [item]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/subcategories', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT sub_category FROM items order by sub_category'
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/getItemsBySubcategory', async (req, res) => {
  const { subcategory } = req.query;
  if (!subcategory) {
    return res.status(400).json({ message: 'Subcategory is required' });
  }
  try {
    const [rows] = await db.query(
      'SELECT * FROM items WHERE sub_category = ?',
      [subcategory]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

  router.post('/add', async (req, res) => {
  const arr = req.body.arr;
  const purchaseDate = req.body.date;
  const locationId = req.body.location;

  if (!Array.isArray(arr) || !purchaseDate || !locationId) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    for (const row of arr) {
      const {
        item_id,      // now directly provided
        quantity,
        amount,
        invoice,
        shop_id
      } = row;

      // validation
      if (!item_id || !quantity || !amount || !invoice || !shop_id) {
        throw new Error('Missing fields in one of the rows');
      }

      const qty = Number(quantity);
      const total = Number(amount);

      // Insert into purchases
      const insertPurchase = `
        INSERT INTO purchases
          (item_id, quantity, invoice_no, amount, shop_id, purchase_date, location_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      await conn.query(insertPurchase, [
        item_id,
        qty,
        invoice,
        total,
        shop_id,
        purchaseDate,
        locationId
      ]);

      // Upsert into stock
      const upsertStock = `
        INSERT INTO stock (item_id, quantity, location_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
      `;
      await conn.query(upsertStock, [item_id, qty, locationId]);
    }

    await conn.commit();
    res.status(200).json({ message: 'Items processed successfully' });

  } catch (err) {
    console.error('Error processing purchase/add:', err);
    if (conn) await conn.rollback();
    res.status(500).json({ message: err.message || 'Internal server error' });

  } finally {
    if (conn) conn.release();
  }
});

  router.get('/getPurchases/:date', async (req, res) => {
    const date = req.params.date;
    
    try {
        const [rows] = await db.query('SELECT i.item_name,p.* FROM purchases p,items i WHERE p.item_id=i.item_id and p.purchase_date = ?', [date]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

    
  module.exports=router;