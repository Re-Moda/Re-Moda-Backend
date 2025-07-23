const prisma = require('../prismaClient');

async function createUser({ email, username, password_hash, security_question, security_answer_hash }) {
  return prisma.user.create({
    data: {
      email,
      username,
      password_hash,
      security_question,
      security_answer_hash,
    },
  });
}

async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function findUserByUsername(username) {
  return prisma.user.findUnique({ where: { username } });
}

async function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function updateUserPassword(id, password_hash) {
  return prisma.user.update({
    where: { id },
    data: { password_hash }
  })
}

async function updateUser(id, updateData) {
  return prisma.user.update({
    where: { id },
    data: updateData 
  })
}

module.exports = { createUser, findUserByEmail, findUserByUsername, findUserById, updateUserPassword, updateUser };