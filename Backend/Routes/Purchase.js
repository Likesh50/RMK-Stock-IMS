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
  const charges = req.body.charges || {};

  if (!Array.isArray(arr) || !purchaseDate || !locationId) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const subtotal = arr.reduce((sum, row) => {
      const quantity = Number(row.quantity) || 0;
      const rate = Number(row.rate) || 0;
      return sum + (quantity * rate);
    }, 0);
    const sgst = Number(charges.sgst) || 0;
    const cgst = Number(charges.cgst) || 0;
    const freight = Number(charges.freight) || 0;
    const otherCharges = Array.isArray(charges.otherCharges)
      ? charges.otherCharges.map(charge => ({
          label: String(charge.label || 'Other charge').trim() || 'Other charge',
          amount: Number(charge.amount) || 0
        }))
      : [];
    const otherChargesTotal = otherCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const calculatedGrandTotal = subtotal + sgst + cgst + freight + otherChargesTotal;
    const grandTotal = charges.grandTotal === '' || charges.grandTotal === undefined
      ? calculatedGrandTotal
      : Number(charges.grandTotal);

    if (!Number.isFinite(grandTotal) || grandTotal < 0) {
      return res.status(400).json({ message: 'Invalid grand total' });
    }

    // A single header groups every line in this submission and stores invoice-level charges.
    const [headerResult] = await conn.query(`
      INSERT INTO purchase_headers
        (invoice_no, shop_id, purchase_date, location_id, subtotal, sgst, cgst, freight, other_charges, grand_total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      arr[0].invoice,
      arr[0].shop_id,
      purchaseDate,
      locationId,
      subtotal,
      sgst,
      cgst,
      freight,
      JSON.stringify(otherCharges),
      grandTotal
    ]);

    for (const row of arr) {
      const {
        item_id,      // now directly provided
        quantity,
        rate,
        invoice,
        shop_id
      } = row;

      // validation
      if (!item_id || !quantity || rate === undefined || !invoice || !shop_id) {
        throw new Error('Missing fields in one of the rows');
      }

      const qty = Number(quantity);
      const unitRate = Number(rate);
      const lineAmount = qty * unitRate;
      if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unitRate) || unitRate < 0 || !Number.isFinite(lineAmount) || lineAmount < 0) {
        throw new Error('Invalid quantity, rate, or amount');
      }

      // Insert into purchases
      const insertPurchase = `
        INSERT INTO purchases
          (item_id, quantity, invoice_no, amount, line_amount, purchase_header_id, shop_id, purchase_date, location_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await conn.query(insertPurchase, [
        item_id,
        qty,
        invoice,
        unitRate,
        lineAmount,
        headerResult.insertId,
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
