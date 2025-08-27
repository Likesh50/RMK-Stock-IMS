const express = require("express");
const db = require("../db"); // ✅ Import DB connection
const router = express.Router();

/**
 * ✅ Get all blocks for a location
 * Requires: location_id from query (frontend must send ?location_id=1)
 */
router.get("/", async (req, res) => {
  const { location_id } = req.query;

  if (!location_id) {
    return res.status(400).json({ error: "location_id is required" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM blocks WHERE location_id = ? ORDER BY block_id ASC",
      [location_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching blocks:", err);
    res.status(500).json({ error: "Failed to fetch blocks" });
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
