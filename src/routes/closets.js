const express = require('express');
const router = express.Router();
const closetController = require('../controllers/closetController');
const authenticateToken = require('../middlewares/auth');

router.get('/', authenticateToken, closetController.getAllClosets);
router.post('/', authenticateToken, closetController.createCloset);
router.get('/:id', authenticateToken, closetController.getClosetById);
router.patch('/:id', authenticateToken, closetController.updateCloset);
router.delete('/:id', authenticateToken, closetController.deleteCloset);

module.exports = router;
