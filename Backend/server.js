    const express = require("express");
    const app = express();
    const mysql = require("mysql2");
    const cors = require("cors");
    let bodyParser = require('body-parser');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const purchaseRtr = require('./Routes/Purchase');
    const Stocks = require('./Routes/Stocks');
    const Dispatch = require('./Routes/Dispatch');
    const addItems = require('./Routes/addItems');
    const graphItem = require('./Routes/graph');
    const Reports=require("./Routes/Report");
    const miniquant=require("./Routes/miniquant");
    const itemtoexpire=require("./Routes/expiry");
    const itemRoutes = require('./Routes/items');
    const shopRoutes= require("./Routes/shops");
    const Blocks= require("./Routes/blocks");
    const db = require('./db');

    app.use(cors({
      origin: '*',  // You can specify your frontend URL here instead of '*'
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    }));

    app.use(express.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use('/purchase',purchaseRtr);
    app.use('/stocks',Stocks);

    app.use('/dispatch',Dispatch);
    app.use('/blocks',Blocks);
    app.use('/addItems',addItems);
    app.use('/graph',graphItem);
    app.use('/report',Reports);
    app.use("/minquant",miniquant);
    app.use("/expiry",itemtoexpire);
    app.use('/items', itemRoutes);
    app.use('/shops', shopRoutes);
    const JWT_SECRET = 'rmkecmessmanagement-IT-2022-2026';

    app.post('/login', async (req, res) => {
      const { username, password } = req.body;
      try {
        const [result] = await db.query('SELECT * FROM users WHERE uname = ?', [username]);

        if (result.length === 0) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result[0];
        const isMatch = await bcrypt.compare(password, user.pass);

        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        console.log(user);
        const token = jwt.sign(
          { id: user.id, role: user.role, uname: user.uname},
          JWT_SECRET,
          { expiresIn: '1h' }
        );

        return res.json({ token, role: user.role, uname: user.uname,locations:user.location_ids });

      } catch (err) {
        return res.status(500).json({ message: 'Server error', err });
      }
    });
    app.get("/locations",async (req,res)=>{
      try{
        const [rows]=await db.query('SELECT * from locations');
        return res.status(200).json(rows);
      }
      catch{
        return res.status(500).json({message:'Internal server error',err});
      }
    })
  app.post('/signup', async (req, res) => {
    const { username, password, role, locations } = req.body;

    try {
      const [existing] = await db.query('SELECT * FROM users WHERE uname = ?', [username]);

      if (existing.length > 0) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ Convert array to JSON string
      const locationJSON = JSON.stringify(locations);

      await db.query(
        'INSERT INTO users (uname, pass, role, location_ids) VALUES (?, ?, ?, ?)',
        [username, hashedPassword, role, locationJSON]
      );

      return res.status(201).json({ message: 'User created', role });
    } catch (err) {
      console.error('Signup Error:', err);
      return res.status(500).json({ message: 'Error inserting user', err });
    }
  });

app.get('/health', (req, res) => {
  res.status(200).js-on({ status: 'OK', message: 'Server is running!' });
});

    app.listen(3002,()=>{
      console.log("You r up!!!");
    })