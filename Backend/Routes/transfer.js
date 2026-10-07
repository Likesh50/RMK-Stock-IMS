const express = require("express");
const db = require("../db"); // ✅ Import DB connection
const router = express.Router();
const { allocateFifo } = require('../inventoryValuation');
// ✅ Get all transfers
router.get("/getTransfers", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM transfer ORDER BY transfer_id DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching transfers:", err);
    res.status(500).json({ error: "Failed to fetch transfers" });
  }
});

// ✅ Create a new transfer
// ✅ Create a new transfer with full stock check + transaction
router.post('/createTransfer', async (req, res) => {
  const { arr, from_location_id, done_by_user_id } = req.body;

  // Basic validation
  if (!arr || arr.length === 0 || !from_location_id || !done_by_user_id) {
    return res.status(400).json({ error: "Invalid transfer request" });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [[{ transferDate }]] = await connection.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS transferDate");

    for (const transfer of arr) {
      const { item_id, to_location_id, quantity } = transfer;
      const itemId = Number(item_id);
      const sourceLocationId = Number(from_location_id);
      const destinationLocationId = Number(to_location_id);
      const transferQuantity = Number(quantity);

      if (
        !Number.isInteger(itemId) || itemId <= 0 ||
        !Number.isInteger(sourceLocationId) || sourceLocationId <= 0 ||
        !Number.isInteger(destinationLocationId) || destinationLocationId <= 0 ||
        !Number.isInteger(transferQuantity) || transferQuantity <= 0
      ) {
        throw new Error('Each transfer must include valid item, locations, and positive whole quantity');
      }

      // 🔹 Validate fields
      if (sourceLocationId === destinationLocationId) {
        throw new Error('Cannot transfer to the same location');
      }

      // 🔹 1. Check stock availability
      const [fromStock] = await connection.query(
        "SELECT quantity FROM stock WHERE item_id = ? AND location_id = ? FOR UPDATE",
        [itemId, sourceLocationId]
      );

      if (fromStock.length === 0 || Number(fromStock[0].quantity) < transferQuantity) {
        throw new Error('Not enough stock at source location');
      }

      const [sourceBatches] = await connection.query(
        `SELECT batch_id, batch_type, purchase_id,
          DATE_FORMAT(acquired_date, '%Y-%m-%d') AS acquired_date,
          DATE_FORMAT(available_date, '%Y-%m-%d') AS available_date,
          remaining_quantity, unit_rate
         FROM inventory_batches
         WHERE item_id = ? AND location_id = ? AND remaining_quantity > 0
         ORDER BY acquired_date, COALESCE(purchase_id, 0), batch_id
         FOR UPDATE`,
        [itemId, sourceLocationId]
      );
      const valuation = allocateFifo(sourceBatches, transferQuantity, transferDate);

      const [toStock] = await connection.query(
        "SELECT quantity FROM stock WHERE item_id = ? AND location_id = ? FOR UPDATE",
        [itemId, destinationLocationId]
      );

      const [transferResult] = await connection.query(
        `INSERT INTO transfer
         (item_id, from_location_id, to_location_id, quantity, date, done_by_user_id)
         VALUES (?, ?, ?, ?, CURDATE(), ?)`,
        [itemId, sourceLocationId, destinationLocationId, transferQuantity, done_by_user_id]
      );

      for (const allocation of valuation.allocations) {
        const [batchUpdate] = await connection.query(
          `UPDATE inventory_batches
           SET remaining_quantity = remaining_quantity - ?
           WHERE batch_id = ? AND remaining_quantity >= ?`,
          [allocation.quantity, allocation.batch_id, allocation.quantity]
        );

        if (batchUpdate.affectedRows !== 1) {
          throw new Error('Batch quantity changed during transfer allocation');
        }

        const [destinationBatchResult] = await connection.query(
          `INSERT INTO inventory_batches
            (
              source_key,
              batch_type,
              item_id,
              location_id,
              parent_batch_id,
              source_transfer_id,
              acquired_date,
              available_date,
              received_quantity,
              remaining_quantity,
              unit_rate,
              valuation_status
            )
          VALUES (?, 'transfer', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `transfer:${transferResult.insertId}:${allocation.batch_id}:${destinationLocationId}`,
            itemId,
            destinationLocationId,
            allocation.batch_id,
            transferResult.insertId,
            allocation.acquired_date,
            transferDate,
            allocation.quantity,
            allocation.quantity,
            allocation.unit_rate,
            allocation.unit_rate == null ? 'unvalued' : 'valued'
          ]
        );

        await connection.query(
          `INSERT INTO transfer_allocations
            (transfer_id, source_batch_id, destination_batch_id, quantity, unit_rate, amount, valuation_status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            transferResult.insertId,
            allocation.batch_id,
            destinationBatchResult.insertId,
            allocation.quantity,
            allocation.unit_rate,
            allocation.amount,
            allocation.amount == null ? 'unvalued' : 'valued'
          ]
        );
      }

      await connection.query(
        'UPDATE stock SET quantity = quantity - ? WHERE item_id = ? AND location_id = ?',
        [transferQuantity, itemId, sourceLocationId]
      );

      if (toStock.length === 0) {
        await connection.query(
          "INSERT INTO stock (item_id, location_id, quantity) VALUES (?, ?, ?)",
          [itemId, destinationLocationId, transferQuantity]
        );
      } else {
        await connection.query(
          "UPDATE stock SET quantity = quantity + ? WHERE item_id = ? AND location_id = ?",
          [transferQuantity, itemId, destinationLocationId]
        );
      }
    }

    // ✅ Commit all queries
    await connection.commit();
    res.status(201).json({ message: "Transfer completed successfully" });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Error during transfer:", err);
    res.status(500).json({ error: "Transfer failed" });
  } finally {
    if (connection) connection.release();
  }
});


module.exports = router;
