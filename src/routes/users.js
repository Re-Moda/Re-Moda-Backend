const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/auth');

router.get('/me', authenticateToken, userController.me);

router.get('/:id', userController.getUserById);  // admin/dev

router.patch('/:id', authenticateToken, userController.updateUser);

module.exports = router;