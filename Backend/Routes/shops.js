const express = require('express');
const mysql = require("mysql2");
const db = require('../db'); 
const router = express.Router();

// CREATE a new shop
router.post('/', async (req, res) => {
  const { name, location } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO shops (name, location) VALUES (?, ?)',
      [name, location]
    );
    res.status(201).json({ message: 'Shop created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Error creating shop', error: err });
  }
});

// READ all shops
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM shops');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching shops', error: err });
  }
});

// READ one shop by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM shops WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching shop', error: err });
  }
});

// UPDATE a shop
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, location } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE shops SET name = ?, location = ? WHERE id = ?',
      [name, location, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json({ message: 'Shop updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating shop', error: err });
  }
});

// DELETE a shop
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM shops WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json({ message: 'Shop deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting shop', error: err });
  }
});

module.exports = router;
