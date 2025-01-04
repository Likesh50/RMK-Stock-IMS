const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs"); // Ensure fs is required
const db = require("../db"); // Assuming db.js is correctly configured

const router = express.Router();

// Configure Multer for file uploads
const upload = multer({
  dest: "uploads/", // Temporary directory for file storage
  fileFilter: (req, file, cb) => {
      // Only allow .xlsx and .xls files based on extension and mime type
      const fileTypes = /xlsx|xls/;
      const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
      const mimeType = file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.mimetype === "application/vnd.ms-excel";

      if (extName && mimeType) {
          cb(null, true);
      } else {
          cb(new Error("Only Excel files are allowed!"));
      }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
});

// Route to handle Excel file uploads
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
      return res.status(400).send("No file uploaded.");
  }

  try {
      const filePath = req.file.path;

      // Ensure the file exists
      if (!fs.existsSync(filePath)) {
          return res.status(400).send("File not found.");
      }

      // Read and parse the Excel file
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (sheetData.length === 0) {
          return res.status(400).send("No data found in the Excel file.");
      }

      // Insert data into the MySQL database
      const query = "INSERT INTO items (item_name, unit, category, min_quantity) VALUES ?";
      const values = sheetData.map((row) => [
          row.item_name || null,  // Ensure 'item_name' exists in Excel
          row.unit || null,       // Ensure 'unit' exists in Excel
          row.category || null,   // Ensure 'category' exists in Excel
          row.min_quantity || 0,  // Default 'min_quantity' to 0 if not present
      ]);

      // Execute query to insert data
      await db.promise().query(query, [values]);

      // Optionally, delete the file after upload to avoid clutter
      fs.unlinkSync(filePath);

      res.send("Data successfully uploaded to the database!");
  } catch (err) {
      console.error("Error processing the file:", err);
      res.status(500).send("Failed to process the uploaded file.");
  }
});

// Other routes
router.get("/getCategory", async (req, res) => {
    try {
        console.log("working");
        const [rows] = await db.promise().query("SELECT category FROM items GROUP BY category");
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/getItemCategory", async (req, res) => {
    try {
        console.log("working");
        const [rows] = await db.promise().query("SELECT item_name, category, unit, min_quantity FROM items ORDER BY item_name");
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/insert", async (req, res) => {
    const { category, itemName, unit, minimum } = req.body;

    try {
        const [existingItem] = await db.promise().query("SELECT * FROM items WHERE item_name = ?", [itemName]);

        if (existingItem.length > 0) {
            return res.status(400).send("Record already exists");
        }

        await db.promise().query(
            "INSERT INTO items (item_name, category, unit, min_quantity) VALUES (?, ?, ?, ?)",
            [itemName, category, unit, minimum]
        );

        res.status(200).send("Item inserted successfully");
    } catch (err) {
        console.error("Error inserting item:", err);
        res.status(500).send("Error inserting into items");
    }
});

router.delete("/delete-item/:id", async (req, res) => {
    const itemId = req.params.id;

    try {
        const [results] = await db.promise().query("DELETE FROM items WHERE item_id = ?", [itemId]);

        if (results.affectedRows > 0) {
            res.status(200).send("Item deleted successfully");
        } else {
            res.status(404).send("Item not found");
        }
    } catch (err) {
        console.error("Error deleting item:", err);
        res.status(500).send("Error deleting item");
    }
});

module.exports = router;
