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

// Admin-only: Get any user by ID
router.get('/:id', authenticateToken, requireAdmin, userController.getUserById);

// Admin-only: Update any user by ID
router.patch('/:id', authenticateToken, requireAdmin, userController.updateUser);

module.exports = router;