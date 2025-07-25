const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authenticateToken = require('../middlewares/auth');

// Implemented a fixed category system for clothing items.
// This endpoint returns the three predefined categories: "Top", "Bottom", and "Shoe".
// The categories are hardcoded to ensure consistent classification across all users.
// When the LLM scans clothing items, it will automatically assign them to one of these categories.
router.get('/', authenticateToken, categoryController.getCategories);

module.exports = router;