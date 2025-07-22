require('dotenv').config();
const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173', // allow your frontend
  credentials: true // if you use cookies or need credentials
}));
app.use(express.json());
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/categories', require('./routes/categories'));
app.use('/closets', require('./routes/closets'));
app.use('/outfits', require('./routes/outfits'));
app.use('/clothing-items', require('./routes/clothingItems'));

module.exports = app;
