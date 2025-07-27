const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const requireAdmin = require('../middlewares/admin');
const authenticateToken = require('../middlewares/auth');
const multer = require('multer');
const upload = multer();

// Get current user's profile
router.get('/me', authenticateToken, userController.me);

// Upload avatar for current user
router.post('/me/avatar', authenticateToken, upload.single('avatar'), userController.uploadAvatar);

// Get user's upload count
router.get('/me/upload-count', authenticateToken, userController.getUploadCount);

// Get user's coin balance
router.get('/me/coins', authenticateToken, userController.getCoinBalance);

// Add coins to user's balance
router.post('/me/coins/add', authenticateToken, userController.addCoins);

// Spend coins from user's balance
router.post('/me/coins/spend', authenticateToken, userController.spendCoins);

// Admin-only: Get any user by ID (must come after /me routes)
router.get('/:id', authenticateToken, requireAdmin, userController.getUserById);

// Admin-only: Update any user by ID (must come after /me routes)
router.patch('/:id', authenticateToken, requireAdmin, userController.updateUser);

module.exports = router;