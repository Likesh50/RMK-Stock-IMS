const express = require('express');
const db = require('../db'); // Ensure this is a correctly configured DB module
const router = express.Router();

// Fetch all items
router.get('/', (req, res) => {
    const query = `SELECT * FROM items ORDER BY category, item_name`;

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Database fetch error' });
        }

        res.json(result); // Send all items as JSON
    });
});

// Fetch a single item by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const query = `SELECT * FROM items WHERE item_id = ?`;

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Database fetch error' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: `Item with ID ${id} not found` });
        }

        res.json(result[0]); // Send the single item as JSON
    });
});

// Update an item
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { item_name, unit, category, min_quantity } = req.body;

    if (!item_name || !unit || !category || !min_quantity) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const query = `
        UPDATE items 
        SET item_name = ?, unit = ?, category = ?, min_quantity = ? 
        WHERE item_id = ?
    `;
    const data = [item_name, unit.toUpperCase(), category, min_quantity, id];

    db.query(query, data, (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Database update error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Item with ID ${id} not found` });
        }

        res.json({ message: `Item with ID ${id} updated successfully` });
    });
});

// Delete an item
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM items WHERE item_id = ?`;

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Database delete error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Item with ID ${id} not found` });
        }

        res.json({ message: `Item with ID ${id} deleted successfully` });
    });
});


module.exports = router;
