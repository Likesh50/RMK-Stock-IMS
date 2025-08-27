const express = require("express");
const db = require("../db"); // ✅ Import DB connection
const router = express.Router();

// ✅ Get all shops (optionally filter by location_id if you later add relation)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM shops ORDER BY id ASC");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching shops:", err);
    res.status(500).json({ error: "Failed to fetch shops" });
  }
});

// ✅ Add a new shop
router.post("/", async (req, res) => {
  const { name, address } = req.body;

  if (!name || !address) {
    return res.status(400).json({ error: "Name and address are required" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO shops (name, location) VALUES (?, ?)",
      [name, address]
    );
    res.status(201).json({ message: "Shop added", shop_id: result.insertId });
  } catch (err) {
    console.error("Error adding shop:", err);
    res.status(500).json({ error: "Failed to add shop" });
  }
});

// ✅ Update a shop
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body;

  if (!name || !address) {
    return res.status(400).json({ error: "Name and address are required" });
  }

  try {
    const [result] = await db.query(
      "UPDATE shops SET name = ?, location = ? WHERE id = ?",
      [name, address, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Shop not found" });
    }

    res.json({ message: "Shop updated" });
  } catch (err) {
    console.error("Error updating shop:", err);
    res.status(500).json({ error: "Failed to update shop" });
  }
});

// ✅ Delete a shop
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query("DELETE FROM shops WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Shop not found" });
    }

    res.json({ message: "Shop deleted" });
  } catch (err) {
    console.error("Error deleting shop:", err);
    res.status(500).json({ error: "Failed to delete shop" });
  }
});

module.exports = router;
