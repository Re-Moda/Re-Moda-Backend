require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://my-remoda.com',
    'https://www.my-remoda.com',
    'https://deploy-preview-13--re-moda-frontend.netlify.app',
    'https://re-moda-frontend.netlify.app'
  ],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Re-Moda Backend is running' });
});

app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/categories', require('./routes/categories'));
app.use('/closets', require('./routes/closets'));
app.use('/outfits', require('./routes/outfits'));
app.use('/clothing-items', require('./routes/clothingItems'));

module.exports = app;