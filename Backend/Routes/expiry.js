const express = require('express');
const db = require('../db'); 
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs'); // For deleting uploaded files after processing
const cors = require('cors'); // CORS for cross-origin requests

const app = express();
const router = express.Router();

// Middleware to parse JSON and handle CORS
app.use(express.json());
app.use(cors());

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Route to get items based on expiry date
router.get('/expiry-items', (req, res) => {
    // Get 'days' parameter from query, default to 30 if not provided
    const days = req.query.days || 30;

    const query = `
      SELECT 
        i.item_name AS itemName, 
        s.quantity, 
        i.category,
        i.unit, 
        p.shop_address AS shopAddress, 
        p.manufacturing_date AS manufacturingDate, 
        p.expiry_date AS expiryDate
      FROM 
        stock s
      JOIN 
        purchases p ON s.purchase_id = p.purchase_id
      JOIN 
        items i ON p.item_id = i.item_id
      WHERE 
        p.expiry_date < CURDATE() + INTERVAL ? DAY
    `;

    db.query(query, [parseInt(days)], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ error: 'Database query error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'No items found' });
      }

      res.json(results);  // Send the data in the expected format
    });
});

// Route to filter items by category
router.get('/filter-category', (req, res) => {
  // Get category parameter from query string
  const category = req.query.category;

  // If no category is provided, return an error
  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  const query = 'SELECT * FROM items WHERE category = ?';

  db.query(query, [category], (err, results) => {
      if (err) {
          console.error('Error querying database:', err);
          return res.status(500).json({ error: 'Internal server error' });
      }

      if (results.length === 0) {
          return res.status(404).json({ message: `No items found for the category: ${category}` });
      }

      res.json(results);
  });
});

// Route to upload and process Excel files
router.post('/dispatch-upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    const filePath = req.file.path;

    try {
        // Parse the Excel file
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Assuming the first sheet contains the relevant data
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (!data || data.length === 0) {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
            return res.status(400).send('No valid data found in the Excel file');
        }

        // Prepare SQL query to insert data into dispatch table
        const sql = `INSERT INTO dispatch (purchase_id, quantity, location, receiver, incharge, dispatch_date) VALUES ?`;
        const values = data.map((row) => [
            row.purchase_id,
            row.quantity,
            row.location,
            row.receiver,
            row.incharge,
            row.dispatch_date, // Ensure correct date format in the data
        ]);

        // Insert data into the database
        db.query(sql, [values], (err, result) => {
            // Delete the uploaded file after processing
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting file:', err);
            });

            if (err) {
                console.error('Error inserting data:', err.message);
                return res.status(500).send('Error inserting data.');
            }

            res.send(`Successfully inserted ${result.affectedRows} rows.`);
        });
    } catch (err) {
        // Delete the uploaded file if there's an error during parsing or processing
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
        console.error('Error processing the Excel file:', err);
        return res.status(500).send('Error processing the Excel file.');
    }
});

// Export the router to be used in the main app file
module.exports = router;



