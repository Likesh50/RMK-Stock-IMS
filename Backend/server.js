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
app.use('/addItems',addItems);
app.use('/graph',graphItem);
app.use('/report',Reports);
app.use("/minquant",miniquant);
app.use("/expiry",itemtoexpire);
const JWT_SECRET = 'rmkecmessmanagement-IT-2022-2026';

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE uname = ?', [username], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', err });
    }

    if (result.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result[0];

    bcrypt.compare(password, user.pass, (err, isMatch) => {
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }


      const token = jwt.sign({ id: user.id, role: user.role,uname:user.uname }, JWT_SECRET, { expiresIn: '1h' });
      return res.json({ token, role: user.role,uname:user.uname });
    });
  });
});
app.post('/signup', (req, res) => {
  const { username, password, role } = req.body;


  db.query('SELECT * FROM users WHERE uname = ?', [username], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', err });
    }

    if (result.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query('INSERT INTO users (uname, pass, role) VALUES (?, ?, ?)', [username, hashedPassword, role], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error inserting user', err });
      }

      return res.status(201).json({ message: 'User created', role });
    });
  });
});

app.listen(3002,()=>{
  console.log("You r up!!!");
})