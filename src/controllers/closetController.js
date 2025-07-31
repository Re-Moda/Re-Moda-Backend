const closetService = require('../services/closetService');

async function getAllClosets(req, res) {
  try {
  const closets = await closetService.getAllClosets(req.user.userId);
    res.json({ success: true, data: closets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch closets' });
  }
}

async function createCloset(req, res) {
  try {
  const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });
  const closet = await closetService.createCloset(req.user.userId, name);
    res.status(201).json({ success: true, data: closet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create closet' });
  }
}

async function getClosetById(req, res) {
  try {
  const closet = await closetService.getClosetById(req.user.userId, Number(req.params.id));
    if (!closet) return res.status(404).json({ success: false, message: 'Closet not found.' });
    res.json({ success: true, data: closet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch closet' });
  }
}

async function updateCloset(req, res) {
  try {
  const { name } = req.body;
    const result = await closetService.updateCloset(req.user.userId, Number(req.params.id), name);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update closet' });
  }
}

async function deleteCloset(req, res) {
  try {
  const result = await closetService.deleteCloset(req.user.userId, Number(req.params.id));
    if (!result.success && result.message === 'Closet not found') return res.status(404).json(result);
    if (!result.success && result.message === 'Closet not empty') return res.status(400).json(result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete closet' });
  }
}

module.exports = { getAllClosets, createCloset, getClosetById, updateCloset, deleteCloset };