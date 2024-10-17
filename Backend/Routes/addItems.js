var express = require('express');
const db = require('../db');
var router = express.Router();
router.get('/getCategory', async (req, res) => {
    try {
      console.log("working");
      const [rows] = await db.promise().query('SELECT category FROM items GROUP BY category');
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  router.get('/getItemCategory', async (req, res) => {
    try {
      console.log("working");
      const [rows] = await db.promise().query('SELECT item_name,category,unit,min_quantity FROM items ORDER BY item_name');
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  router.post('/insert', (req, res) => {
    const cat = req.body.category;
    const items = req.body.itemName;
    const unit = req.body.unit;
    const minimum = req.body.minimum;

    console.log(req.body);

    // Check if the record already exists in the category table
    db.query('SELECT * FROM items WHERE item_name = ?', [items], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error checking existing records');
        }

        if (results.length > 0) {
            // Record already exists
            return res.status(400).send('Record already exists');
        }

        // Record does not exist, proceed to insert
        db.query('INSERT INTO items (item_name, category, unit, min_quantity) VALUES (?, ?, ?, ?)', [items, cat, unit, minimum], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error inserting into category');
            }

          return res.status(200).send('Item inserted successfully');
        });
    });
});


module.exports=router;