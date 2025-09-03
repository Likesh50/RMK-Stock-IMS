const express = require("express");
const db = require("../db"); // ✅ Import DB connection
const router = express.Router();
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

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const transfer of arr) {
      const { item_id, to_location_id, quantity } = transfer;

      // 🔹 Validate fields
      if (!item_id || !to_location_id || !quantity) {
        await connection.rollback();
        return res.status(400).json({ error: "Each transfer must include item_id, to_location_id, and quantity" });
      }

      if (from_location_id === to_location_id) {
        await connection.rollback();
        return res.status(400).json({ error: "Cannot transfer to the same location" });
      }

      // 🔹 1. Check stock availability
      const [fromStock] = await connection.query(
        "SELECT quantity FROM stock WHERE item_id = ? AND location_id = ?",
        [item_id, from_location_id]
      );

      if (fromStock.length === 0 || fromStock[0].quantity < quantity) {
        await connection.rollback();
        return res.status(400).json({ error: "Not enough stock at source location" });
      }

      // 🔹 2. Deduct from source
      await connection.query(
        "UPDATE stock SET quantity = quantity - ? WHERE item_id = ? AND location_id = ?",
        [quantity, item_id, from_location_id]
      );

      // 🔹 3. Add to destination (insert if not exists)
      const [toStock] = await connection.query(
        "SELECT quantity FROM stock WHERE item_id = ? AND location_id = ?",
        [item_id, to_location_id]
      );

      if (toStock.length === 0) {
        await connection.query(
          "INSERT INTO stock (item_id, location_id, quantity) VALUES (?, ?, ?)",
          [item_id, to_location_id, quantity]
        );
      } else {
        await connection.query(
          "UPDATE stock SET quantity = quantity + ? WHERE item_id = ? AND location_id = ?",
          [quantity, item_id, to_location_id]
        );
      }

      // 🔹 4. Record transfer
      await connection.query(
        `INSERT INTO transfer 
         (item_id, from_location_id, to_location_id, quantity, date, done_by_user_id) 
         VALUES (?, ?, ?, ?, CURDATE(), ?)`,
        [item_id, from_location_id, to_location_id, quantity, done_by_user_id]
      );
    }

    // ✅ Commit all queries
    await connection.commit();
    res.status(201).json({ message: "Transfer completed successfully" });

  } catch (err) {
    await connection.rollback();
    console.error("Error during transfer:", err);
    res.status(500).json({ error: "Transfer failed" });
  } finally {
    connection.release();
  }
});


module.exports = router;
