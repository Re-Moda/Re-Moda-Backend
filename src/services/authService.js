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

module.exports = { createUser, findUserByEmail, findUserByUsername };