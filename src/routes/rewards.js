const express = require('express');
const router = express.Router();
const rewardsController = require('../controllers/rewardsController');
const authenticateToken = require('../middlewares/auth');

router.get('/balance', authenticateToken, rewardsController.getBalance);

module.exports = router;
