const bcrypt = require('bcrypt');
const authService = require('../services/authService');
const prisma = require('../prismaClient');
const jwt = require('jsonwebtoken');

async function signup(req, res) {
  try {
  const { email, username, password, security_question, security_answer } = req.body;
  if (!email || !username || !password || !security_question || !security_answer) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  
  // Try to fix database schema if needed
  try {
    const { fixDatabaseSchema } = require('../utils/databaseFix');
    await fixDatabaseSchema();
  } catch (fixError) {
    console.log('Database fix attempted but failed:', fixError.message);
  }
  
  if (await authService.findUserByEmail(email) || await authService.findUserByUsername(username)) {
      return res.status(409).json({ success: false, message: 'Email or username already in use.' });
  }
  const password_hash = await bcrypt.hash(password, 10);
  const security_answer_hash = await bcrypt.hash(security_answer, 10);
  const user = await authService.createUser({
    email,
    username,
    password_hash,
    security_question,
    security_answer_hash,
  });
    const closet = await prisma.closet.create({
      data: {
        user_id: user.id,
        name: 'My Closet'
      }
    });
    const categories = await prisma.category.createMany({
      data: [
        { user_id: user.id, title: 'Top' },
        { user_id: user.id, title: 'Bottom' },
        { user_id: user.id, title: 'Shoe' }
      ]
    });
    res.status(201).json({ success: true, data: { user, closet, categories } });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ success: false, message: error.message || 'Signup failed' });
  }
}

async function signin(req, res) {
  try {
    console.log('=== SIGNIN DEBUG START ===');
    console.log('Signin attempt with body:', req.body);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
    
  const { username, password } = req.body;
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

    console.log('Looking for user with username:', username);
    const user = await authService.findUserByUsername(username);
    console.log('User found:', !!user);
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }
    
    console.log('User found, checking password');
  const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }
  
    console.log('Password matches, creating JWT token');
  const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET, 
    { expiresIn: '1h' }
  );

    console.log('Signin successful for user:', username);
    console.log('=== SIGNIN DEBUG END ===');
  return res.status(200).json({
      success: true,
    message: 'Sign in successful.',
    token,
      data: { id: user.id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('=== SIGNIN ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== END SIGNIN ERROR ===');
    res.status(500).json({ success: false, message: error.message || 'Signin failed' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email, username } = req.body;
    if (!email && !username) {
      return res.status(400).json({ success: false, message: 'Username or email is required.' });
  }
  let user;
  if (username) {
    user = await authService.findUserByUsername(username);
  } else if (email) {
    user = await authService.findUserByEmail(email);
  }
  if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
  }
    return res.json({ success: true, data: { security_question: user.security_question } });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process forgot password' });
  }
}

async function resetPassword(req, res) {
  try {
  const { username, email, security_answer, new_password } = req.body;
    if ((!username && !email) || !security_answer || !new_password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  let user;
  if (username) {
    user = await authService.findUserByUsername(username);
  } else if (email) {
    user = await authService.findUserByEmail(email);
  }
  if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
  }
  const isMatch = await bcrypt.compare(security_answer, user.security_answer_hash);
  if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
  }
  const password_hash = await bcrypt.hash(new_password, 10);
  await authService.updateUserPassword(user.id, password_hash);
    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reset password' });
}
}

module.exports = { signup, signin, forgotPassword, resetPassword };