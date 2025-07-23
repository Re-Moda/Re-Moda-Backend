const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getBalance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ coin_balance: user.coin_balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get coin balance.' });
  }
};
