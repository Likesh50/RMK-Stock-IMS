const express = require("express");
const db = require("../db"); // ✅ Import DB connection
const router = express.Router();

/**
 * ✅ Get all blocks for a location
 * Requires: location_id OR all_blocks=true
 */
router.get("/", async (req, res) => {
  const { location_id, all_blocks } = req.query;

  try {
    let rows;

    // ✅ CASE 1: Fetch ALL blocks (ONLY when explicitly requested)
    if (all_blocks === 'true') {
      [rows] = await db.query(`
        SELECT b.*, l.location_name 
        FROM blocks b
        LEFT JOIN locations l ON b.location_id = l.location_id
        ORDER BY l.location_name ASC, b.block_name ASC
      `);

      return res.json(rows);
    }

    // ✅ CASE 2: Normal behavior (NO CHANGE to existing logic)
    if (!location_id) {
      return res.status(400).json({ error: "location_id is required" });
    }

    [rows] = await db.query(
      `SELECT b.*, l.location_name 
       FROM blocks b
       LEFT JOIN locations l ON b.location_id = l.location_id
       WHERE b.location_id = ?
       ORDER BY b.block_name ASC`,
      [location_id]
    );

    return res.json(rows);

  } catch (err) {
    console.error("Error fetching blocks:", err);
    return res.status(500).json({ error: "Failed to fetch blocks" });
  }
});

/**
 * ✅ Add a new block
 * Requires: block_name, location_id
 */
router.post("/", async (req, res) => {
  const { block_name, location_id } = req.body;

  if (!block_name || !location_id) {
    return res
      .status(400)
      .json({ error: "block_name and location_id are required" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO blocks (block_name, location_id) VALUES (?, ?)",
      [block_name, location_id]
    );
    res
      .status(201)
      .json({ message: "Block added", block_id: result.insertId });
  } catch (err) {
    console.error("Error adding block:", err);
    res.status(500).json({ error: "Failed to add block" });
  }
});

/**
 * ✅ Update a block
 * Requires: block_name, location_id
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { block_name, location_id } = req.body;

  if (!block_name || !location_id) {
    return res
      .status(400)
      .json({ error: "block_name and location_id are required" });
  }

  try {
    const [result] = await db.query(
      "UPDATE blocks SET block_name = ?, location_id = ? WHERE block_id = ?",
      [block_name, location_id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Block not found" });
    }

    res.json({ message: "Block updated" });
  } catch (err) {
    console.error("Error updating block:", err);
    res.status(500).json({ error: "Failed to update block" });
  }
});

/**
 * ✅ Delete a block
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM blocks WHERE block_id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Block not found" });
    }

    res.json({ message: "Block deleted" });
  } catch (err) {
    console.error("Error deleting block:", err);
    res.status(500).json({ error: "Failed to delete block" });
  }
});

module.exports = router;