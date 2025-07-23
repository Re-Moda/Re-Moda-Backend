const prisma = require('../prismaClient');

async function createUser({ email, username, password_hash, security_question, security_answer_hash }) {
  try {
    return await prisma.user.create({
      data: {
        email,
        username,
        password_hash,
        security_question,
        security_answer_hash,
      },
    });
  } catch (error) {
    console.error('Error in createUser:', error);
    throw new Error('Failed to create user');
  }
}

async function findUserByEmail(email) {
  try {
    return await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    console.error('Error in findUserByEmail:', error);
    throw new Error('Failed to find user by email');
  }
}

async function findUserByUsername(username) {
  try {
    return await prisma.user.findUnique({ where: { username } });
  } catch (error) {
    console.error('Error in findUserByUsername:', error);
    throw new Error('Failed to find user by username');
  }
}

async function findUserById(id) {
  try {
    return await prisma.user.findUnique({ where: { id } });
  } catch (error) {
    console.error('Error in findUserById:', error);
    throw new Error('Failed to find user by id');
  }
}

async function updateUserPassword(id, password_hash) {
  try {
    return await prisma.user.update({
      where: { id },
      data: { password_hash }
    });
  } catch (error) {
    console.error('Error in updateUserPassword:', error);
    throw new Error('Failed to update user password');
  }
}

async function updateUser(id, updateData) {
  try {
    return await prisma.user.update({
      where: { id },
      data: updateData 
    });
  } catch (error) {
    console.error('Error in updateUser:', error);
    throw new Error('Failed to update user');
  }
}

module.exports = { createUser, findUserByEmail, findUserByUsername, findUserById, updateUserPassword, updateUser };