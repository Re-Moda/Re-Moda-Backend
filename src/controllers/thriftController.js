const thriftService = require('../services/thriftService');

exports.getUnusedItems = async (req, res) => {
  try {
    // Optionally filter by userId or location
    const userId = req.query.userId ? parseInt(req.query.userId) : undefined;
    // Add location filter if needed
    const items = await thriftService.getUnusedItems({ userId });
    res.json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get unused items.' });
  }
}; 