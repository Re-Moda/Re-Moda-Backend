const prisma = require('../prismaClient');

async function getAllClosets(userId) {
  try {
    return await prisma.closet.findMany({ where: { user_id: userId } });
  } catch (error) {
    console.error('Error in getAllClosets:', error);
    throw new Error('Failed to fetch closets');
  }
}

async function createCloset(userId, name) {
  try {
    return await prisma.closet.create({ data: { user_id: userId, name } });
  } catch (error) {
    console.error('Error in createCloset:', error);
    throw new Error('Failed to create closet');
  }
}

async function getClosetById(userId, closetId) {
  try {
    const closet = await prisma.closet.findFirst({ where: { id: closetId, user_id: userId } });
    if (!closet) return null;
    return closet;
  } catch (error) {
    console.error('Error in getClosetById:', error);
    throw new Error('Failed to fetch closet');
  }
}

async function updateCloset(userId, closetId, name) {
  try {
    const result = await prisma.closet.updateMany({
    where: { id: closetId, user_id: userId },
    data: { name }
  });
    if (result.count === 0) return { success: false, message: 'Closet not found' };
    return { success: true, message: 'Closet updated' };
  } catch (error) {
    console.error('Error in updateCloset:', error);
    throw new Error('Failed to update closet');
  }
}

async function deleteCloset(userId, closetId) {
  try {
  const closet = await prisma.closet.findFirst({ where: { id: closetId, user_id: userId } });
    if (!closet) return { success: false, message: 'Closet not found' };
  const items = await prisma.clothingItem.findMany({ where: { closet_id: closetId } });
    if (items.length > 0) return { success: false, message: 'Closet not empty' };
  await prisma.closet.delete({ where: { id: closetId } });
    return { success: true, message: 'Closet deleted' };
  } catch (error) {
    console.error('Error in deleteCloset:', error);
    throw new Error('Failed to delete closet');
  }
}

module.exports = { getAllClosets, createCloset, getClosetById, updateCloset, deleteCloset };