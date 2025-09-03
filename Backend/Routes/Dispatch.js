    const express = require('express');
    const mysql = require("mysql2");
    const db = require('../db'); 

    const router = express.Router();
router.get('/stockAvailability/:item_id/:location_id', async (req, res) => {
  const { item_id, location_id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT quantity 
       FROM stock 
       WHERE item_id = ? AND location_id = ?`,
      [item_id, location_id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching stock availability:', err.message);
    res.status(500).json({ error: 'Failed to fetch stock availability' });
  }
});

    router.get('/items', (req, res) => {
        const sql = 'SELECT item_id, item_name FROM items';
        db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database query failed' });
        }
        // Send results as JSON
        res.json(results);
        });
    });
    /**
     * Create a new dispatch and update stock accordingly
     */
    router.post('/createDispatch', async (req, res) => {
  const { arr, location_id } = req.body;

  if (!Array.isArray(arr) || arr.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty dispatch data' });
  }

  try {
    await db.query('START TRANSACTION');

    for (const item of arr) {
      const { item_id, quantity, receiver, incharge, dispatch_date, block_id, sticker_no } = item;
      console.log(sticker_no);
      console.log(block_id+"JERE");
      // Fetch current stock
      const [stockRows] = await db.query(
        'SELECT quantity FROM stock WHERE item_id = ? AND location_id = ? LIMIT 1',
        [item_id, location_id]
      );

      if (stockRows.length === 0) {
        throw new Error(`No stock found for item_id ${item_id}`);
      }

      const currentQty = stockRows[0].quantity;
      const newQty = currentQty - quantity;

      if (newQty < 0) {
        throw new Error(`Insufficient stock for item_id ${item_id}`);
      }

      // Insert dispatch record (with new fields: block_id, sticker_no)
      await db.query(
        `INSERT INTO dispatch 
          (item_id, quantity, receiver, incharge, dispatch_date, location_id, block_id, sticker_no) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [item_id, quantity, receiver, incharge, dispatch_date, location_id, block_id, sticker_no]
      );

      // Update or remove stock
      if (newQty === 0) {
        // optional: remove stock row if empty
        // await db.query(
        //   'DELETE FROM stock WHERE item_id = ? AND location_id = ?',
        //   [item_id, location_id]
        // );
        await db.query(
          'UPDATE stock SET quantity = 0 WHERE item_id = ? AND location_id = ?',
          [item_id, location_id]
        );
      } else {
        await db.query(
          'UPDATE stock SET quantity = ? WHERE item_id = ? AND location_id = ?',
          [newQty, item_id, location_id]
        );
      }
    }

    await db.query('COMMIT');
    res.json({ success: true, message: 'Dispatch created and stock updated successfully' });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error in dispatch creation:', error.message);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});


    /**
     * Retrieve dispatches by purchase_id
     */
    router.get('/retrieveDispatches/:purchase_id', async (req, res) => {
        const { purchase_id } = req.params;

        try {
            const [dispatches] = await db.query(
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
            const [stock] = await db.query(
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

    router.get('/getDispatches/:date', async (req, res) => {
        const date = req.params.date;
      
        try {
          const [rows] = await db.query(`
            SELECT d.*, i.item_name 
            FROM dispatch d 
            JOIN purchases p ON d.purchase_id = p.purchase_id 
            JOIN items i ON p.item_id = i.item_id 
            WHERE d.dispatch_date = ?`, [date]);
          res.status(200).json(rows);
        } catch (error) {
          console.error('Error fetching dispatches:', error);
          res.status(500).json({ message: 'Internal server error' });
        }
      });
      
      router.post('/updateDispatch', async (req, res) => {
        const { dispatch_id, quantity, location, receiver, incharge } = req.body;
      
        if (!dispatch_id || quantity === undefined || !location || !receiver || !incharge) {
          return res.status(400).json({ message: 'All fields are required' });
        }
      
        try {
          const updateQuery = `UPDATE dispatch SET quantity = ?, location = ?, receiver = ?, incharge = ? WHERE dispatch_id = ?`;
          await db.query(updateQuery, [quantity, location, receiver, incharge, dispatch_id]);
      
          res.status(200).json({ message: 'Dispatch updated successfully' });
        } catch (error) {
          console.error('Error updating dispatch:', error);
          res.status(500).json({ message: 'Internal server error' });
        }
      });

      

    module.exports = router;
