    const express = require('express');
    const mysql = require("mysql2");
    const db = require('../db'); 

    const router = express.Router();


    router.get('/items', (req, res) => {
        const sql = 'SELECT item_id, item_name FROM items'; // Selecting only the needed fields for the dropdown
    
        db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query failed' });
        }
        // Send results as JSON
        res.json(results);
        });
    });
    router.get('/expiry/:item_id', async (req, res) => {
        const { item_id } = req.params;
        try {
            const [expiryDates] = await db.promise().query(
                `SELECT p.expiry_date, p.purchase_id
                FROM purchases p
                JOIN stock s ON p.item_id = s.item_id
                WHERE s.item_id = ?
                GROUP BY p.expiry_date, p.purchase_id`,
                [item_id]
            );
            res.json(expiryDates);
        } catch (error) {
            console.error('Error retrieving expiry dates:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
    
    // Retrieve current stock for an item by item_id
    router.get('/retrieveStock/:item_id/:purchase_id', async (req, res) => {
        const { item_id, purchase_id } = req.params;
    
        try {
            const [stock] = await db.promise().query(
                'SELECT quantity FROM stock WHERE item_id = ? AND purchase_id = ?',
                [item_id, purchase_id]
            );
    
            if (stock.length === 0) {
                return res.status(404).json({ message: 'No stock found for this item and purchase.' });
            }
    
            res.json(stock[0]); // Send the first entry as the current stock for the selected purchase
        } catch (error) {
            console.error('Error retrieving stock:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
     
    /**
     * Create a new dispatch and update stock accordingly
     */
    router.post('/createDispatch', async (req, res) => {
        const dispatchData = req.body;
        
        if (!Array.isArray(dispatchData) || dispatchData.length === 0) {
            return res.status(400).json({ error: 'Invalid or empty dispatch data' });
        }

        try {
            // Start transaction
            await db.promise().query('START TRANSACTION');

            const queries = [];

            for (const item of dispatchData) {
                const { purchase_id, item_id, quantity, location, receiver, incharge, dispatch_date } = item;
                console.log(item);
                console.log("THE PURCHASE ID IS"+purchase_id);
                // Insert into dispatch table
                queries.push({
                    sql: `
                        INSERT INTO dispatch (purchase_id,quantity, location, receiver, incharge, dispatch_date)
                        VALUES (?,?, ?, ?, ?, ?)`,
                    values: [purchase_id,quantity, location, receiver, incharge, dispatch_date]
                });
                

                // Update stock for the dispatched item
                const [currentStock] = await db.promise().query(
                    'SELECT quantity FROM stock WHERE purchase_id = ? AND item_id = ? LIMIT 1',
                    [purchase_id, item_id]
                );

                if (currentStock.length === 0) {
                    throw new Error('No stock found for the specified purchase and item.');
                }

                const newQuantity = currentStock[0].quantity - quantity;

                if (newQuantity < 0) {
                    throw new Error('Insufficient stock for the item.');
                }

                if (newQuantity === 0) {
                    // If stock becomes zero, remove the entry from stock table
                    queries.push({
                        sql: 'DELETE FROM stock WHERE purchase_id = ? AND item_id = ?',
                        values: [purchase_id, item_id]
                    });
                } else {
                    // Otherwise, just update the stock quantity
                    queries.push({
                        sql: 'UPDATE stock SET quantity = ? WHERE purchase_id = ? AND item_id = ?',
                        values: [newQuantity, purchase_id, item_id]
                    });
                }
            }

            // Execute all queries in the transaction
            for (const query of queries) {
                await db.promise().query(query.sql, query.values);
            }

            // Commit transaction
            await db.promise().query('COMMIT');

            res.json({ message: 'Dispatch created and stock updated successfully' });
        } catch (error) {
            // Rollback in case of an error
            await db.promise().query('ROLLBACK');
            console.error('Error creating dispatch:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    /**
     * Retrieve dispatches by purchase_id
     */
    router.get('/retrieveDispatches/:purchase_id', async (req, res) => {
        const { purchase_id } = req.params;

        try {
            const [dispatches] = await db.promise().query(
                'SELECT * FROM dispatch WHERE purchase_id = ?',
                [purchase_id]
            );

            if (dispatches.length === 0) {
                return res.status(404).json({ message: 'No dispatches found for this purchase.' });
            }

            res.json(dispatches);
        } catch (error) {
            console.error('Error retrieving dispatches:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    /**
     * Retrieve current stock for an item by item_id
     */
    router.get('/retrieveStock/:item_id', async (req, res) => {
        const { item_id } = req.params;

        try {
            const [stock] = await db.promise().query(
                'SELECT * FROM stock WHERE item_id = ?',
                [item_id]
            );

            if (stock.length === 0) {
                return res.status(404).json({ message: 'No stock found for this item.' });
            }

            res.json(stock);
        } catch (error) {
            console.error('Error retrieving stock:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });

    module.exports = router;
