const prisma = require('../prismaClient');

async function getAllClosets(userId) {
  return prisma.closet.findMany({ where: { user_id: userId } });
}

async function createCloset(userId, name) {
  return prisma.closet.create({ data: { user_id: userId, name } });
}

async function getClosetById(userId, closetId) {
  return prisma.closet.findFirst({ where: { id: closetId, user_id: userId } });
}

async function updateCloset(userId, closetId, name) {
  return prisma.closet.updateMany({
    where: { id: closetId, user_id: userId },
    data: { name }
  });
}

async function deleteCloset(userId, closetId) {
  const closet = await prisma.closet.findFirst({ where: { id: closetId, user_id: userId } });
  if (!closet) return 'not_found';
  const items = await prisma.clothingItem.findMany({ where: { closet_id: closetId } });
  if (items.length > 0) return 'not_empty';
  await prisma.closet.delete({ where: { id: closetId } });
  return 'deleted';
}

module.exports = { getAllClosets, createCloset, getClosetById, updateCloset, deleteCloset };