require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());


app.use(express.json());
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/categories', require('./routes/categories'));
app.use('/closets', require('./routes/closets'));
app.use('/outfits', require('./routes/outfits'));
app.use('/clothing-items', require('./routes/clothingItems'));

module.exports = app;
