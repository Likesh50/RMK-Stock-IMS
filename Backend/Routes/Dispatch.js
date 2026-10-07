    const express = require('express');
    const mysql = require("mysql2");
    const db = require('../db'); 
    const { allocateFifo } = require('../inventoryValuation');

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

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    for (const item of arr) {
      const { item_id, quantity, receiver, incharge, dispatch_date, block_id, sticker_no } = item;
      const itemId = Number(item_id);
      const requestedQuantity = Number(quantity);
      const locationId = Number(location_id);
      const dispatchDate = /^\d{4}-\d{2}-\d{2}$/.test(String(dispatch_date))
        ? String(dispatch_date)
        : '';

      if (!Number.isInteger(itemId) || itemId <= 0 || !Number.isInteger(locationId) || locationId <= 0 || !dispatchDate) {
        throw new Error('Invalid item, location or dispatch date');
      }

      const [stockRows] = await connection.query(
        'SELECT quantity FROM stock WHERE item_id = ? AND location_id = ? FOR UPDATE',
        [itemId, locationId]
      );

      if (stockRows.length === 0) {
        throw new Error(`No stock found for item_id ${item_id}`);
      }

      const currentQty = Number(stockRows[0].quantity);
      if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
        throw new Error('Dispatch quantity must be a positive whole number');
      }

      const newQty = currentQty - requestedQuantity;

      if (newQty < 0) {
        throw new Error(`Insufficient stock for item_id ${itemId}`);
      }

      const [batchRows] = await connection.query(
        `SELECT batch_id, batch_type, purchase_id,
          DATE_FORMAT(acquired_date, '%Y-%m-%d') AS acquired_date,
          DATE_FORMAT(available_date, '%Y-%m-%d') AS available_date,
          remaining_quantity, unit_rate
         FROM inventory_batches
         WHERE item_id = ? AND location_id = ? AND remaining_quantity > 0
         ORDER BY acquired_date, COALESCE(purchase_id, 0), batch_id
         FOR UPDATE`,
        [itemId, locationId]
      );
      const valuation = allocateFifo(batchRows, requestedQuantity, dispatchDate);

      const [dispatchResult] = await connection.query(
        `INSERT INTO dispatch 
          (
            item_id,
            quantity,
            receiver,
            incharge,
            dispatch_date,
            location_id,
            block_id,
            sticker_no,
            remaining_quantity,
            valuation_status
          ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
        [
          itemId,
          requestedQuantity,
          receiver,
          incharge,
          dispatchDate,
          locationId,
          block_id,
          sticker_no,
          newQty,
          valuation.fully_valued ? 'valued' : 'unvalued'
        ]
      );

      for (const allocation of valuation.allocations) {
        const [batchUpdate] = await connection.query(
          `UPDATE inventory_batches
           SET remaining_quantity = remaining_quantity - ?
           WHERE batch_id = ? AND remaining_quantity >= ?`,
          [allocation.quantity, allocation.batch_id, allocation.quantity]
        );

        if (batchUpdate.affectedRows !== 1) {
          throw new Error('Batch quantity changed during dispatch allocation');
        }

        await connection.query(
          `INSERT INTO dispatch_allocations
            (dispatch_id, batch_id, quantity, unit_rate, amount, valuation_status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            dispatchResult.insertId,
            allocation.batch_id,
            allocation.quantity,
            allocation.unit_rate,
            allocation.amount,
            allocation.amount == null ? 'unvalued' : 'valued'
          ]
        );
      }

      await connection.query(
        'UPDATE stock SET quantity = ? WHERE item_id = ? AND location_id = ?',
        [newQty, itemId, locationId]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Dispatch created and stock updated successfully' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error in dispatch creation:', error.message);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  } finally {
    if (connection) connection.release();
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
            SELECT d.*, d.location_id AS location, i.item_name
            FROM dispatch d 
            JOIN items i ON d.item_id = i.item_id
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
      
        let connection;
        try {
          connection = await db.getConnection();
          await connection.beginTransaction();
          const [existingRows] = await connection.query(
            'SELECT quantity, location_id FROM dispatch WHERE dispatch_id = ? FOR UPDATE',
            [dispatch_id]
          );

          if (existingRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Dispatch not found' });
          }

          if (
            Number(quantity) !== Number(existingRows[0].quantity) ||
            Number(location) !== Number(existingRows[0].location_id)
          ) {
            await connection.rollback();
            return res.status(409).json({
              message: 'Dispatch quantity or location cannot be changed after stock allocation'
            });
          }

          await connection.query(
            'UPDATE dispatch SET receiver = ?, incharge = ? WHERE dispatch_id = ?',
            [receiver, incharge, dispatch_id]
          );
          await connection.commit();
      
          res.status(200).json({ message: 'Dispatch updated successfully' });
        } catch (error) {
          if (connection) await connection.rollback();
          console.error('Error updating dispatch:', error);
          res.status(500).json({ message: 'Internal server error' });
        } finally {
          if (connection) connection.release();
        }
      });

      

    module.exports = router;
