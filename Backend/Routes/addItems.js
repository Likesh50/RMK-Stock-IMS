var express = require('express');
const db = require('../db');
var router = express.Router();
router.get('/getCategory', async (req, res) => {
    try {
      console.log("working");
      const [rows] = await db.query('SELECT DISTINCT category, sub_category FROM items order by sub_category');

      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  
  router.get('/getSubCategories', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT DISTINCT sub_category FROM items ORDER BY sub_category where category=?'
    ,category);
    return res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching subcategories:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

  router.get('/getItemCategory', async (req, res) => {
    try {
      console.log("working");
      const [rows] = await db.query('SELECT item_name,category,sub_category,unit,min_quantity FROM items ORDER BY item_name');
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
router.post('/insert', async (req, res) => {
  const { category, subCategory, itemName, unit, minimum } = req.body;
  console.log(req.body);
  try {
    const [existing] = await db.query('SELECT * FROM items WHERE item_name = ?', [itemName]);
    if (existing.length > 0) {
      return res.status(400).send('Record already exists');
    }

    await db.query(
      'INSERT INTO items (item_name, category, sub_category, unit, min_quantity) VALUES (?, ?, ?, ?, ?)',
      [itemName, category, subCategory, unit, minimum]
    );

    return res.status(200).send('Item inserted successfully');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error inserting item');
  }
});
router.get('/getBySubCategory', async (req, res) => {
  const { sub_category } = req.query;

  try {
    const [rows] = await db.query(
      'SELECT * FROM items WHERE sub_category = ? ORDER BY item_name',
      [sub_category]
    );
    return res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching by subcategory:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports=router;