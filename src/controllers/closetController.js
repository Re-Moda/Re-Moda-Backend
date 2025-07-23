const closetService = require('../services/closetService');

async function getAllClosets(req, res) {
  const closets = await closetService.getAllClosets(req.user.userId);
  res.json(closets);
}

async function createCloset(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  const closet = await closetService.createCloset(req.user.userId, name);
  res.status(201).json(closet);
}

async function getClosetById(req, res) {
  const closet = await closetService.getClosetById(req.user.userId, Number(req.params.id));
  if (!closet) return res.status(404).json({ error: 'Closet not found.' });
  res.json(closet);
}

async function updateCloset(req, res) {
  const { name } = req.body;
  const closet = await closetService.updateCloset(req.user.userId, Number(req.params.id), name);
  if (!closet) return res.status(404).json({ error: 'Closet not found or not yours.' });
  res.json(closet);
}

async function deleteCloset(req, res) {
  const result = await closetService.deleteCloset(req.user.userId, Number(req.params.id));
  if (result === 'not_found') return res.status(404).json({ error: 'Closet not found or not yours.' });
  if (result === 'not_empty') return res.status(400).json({ error: 'Closet is not empty.' });
  res.json({ message: 'Closet deleted.' });
}

module.exports = { getAllClosets, createCloset, getClosetById, updateCloset, deleteCloset };