const express = require('express');
const db = require('../db'); // Assuming you have a DB connection module
const router = express.Router();
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM items ORDER BY item_name,sub_category,category`);
        res.json(rows);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Database fetch error' });
    }
});

// ✅ Fetch single item
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(`SELECT * FROM items WHERE item_id = ?`, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: `Item with ID ${id} not found` });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Database fetch error' });
    }
});

// ✅ Update item
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { item_name, unit, category, min_quantity,sub_category } = req.body;
    const query = `
        UPDATE items 
        SET item_name = ?, unit = ?, category = ?, min_quantity = ? ,sub_category = ?
        WHERE item_id = ?
    `;
    const data = [item_name, unit.toUpperCase(), category, min_quantity,sub_category,id];

    try {
        const [result] = await db.query(query, data);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Item with ID ${id} not found` });
        }
        res.json({ message: `Item with ID ${id} updated successfully` });
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Database update error' });
    }
});

// ✅ Delete item
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query(`DELETE FROM items WHERE item_id = ?`, [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Item with ID ${id} not found` });
        }
        res.json({ message: `Item with ID ${id} deleted successfully` });
    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Database delete error' });
    }
});

module.exports = router;
