const bcrypt = require('bcrypt');
const authService = require('../services/authService');

async function signup(req, res) {
  const { email, username, password, security_question, security_answer } = req.body;

  // Basic validation (expand as needed)
  if (!email || !username || !password || !security_question || !security_answer) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Check if user exists
  if (await authService.findUserByEmail(email) || await authService.findUserByUsername(username)) {
    return res.status(409).json({ error: 'Email or username already in use.' });
  }

  // Hash password and security answer
  const password_hash = await bcrypt.hash(password, 10);
  const security_answer_hash = await bcrypt.hash(security_answer, 10);

  // Create user
  const user = await authService.createUser({
    email,
    username,
    password_hash,
    security_question,
    security_answer_hash,
  });

  res.status(201).json({ message: 'User created successfully', user: { id: user.id, email: user.email, username: user.username } });
}

module.exports = { signup };