const express = require('express');
const router = express.Router();
const thriftController = require('../controllers/thriftController');
const authenticateToken = require('../middlewares/auth');

router.get('/unused-items', authenticateToken, thriftController.getUnusedItems);

module.exports = router; 