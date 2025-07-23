const bcrypt = require('bcrypt');
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');


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

async function signin(req, res) {
  const { username, password } = req.body;

  if(!username || !password) {
    return res.status(400).json({error: 'All fields are required.'})
  }

  const user = await authService.findUserByUsername(username);  // fetch user eveytime user tries to login

  if(!user) {
    return res.status(401).json({error: 'Invalid credentials.'})
  }
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if(!isMatch) {
    return res.status(401).json({error: 'Invalid credentials.'})
  }
  
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },  // <-- add role here
    process.env.JWT_SECRET, 
    { expiresIn: '1h' }
  );

  return res.status(200).json({
    message: 'Sign in successful.',
    token,
    user: { id: user.id, username: user.username, email: user.email }  // returning user object to frontend in response
  })
}

async function forgotPassword(req, res) {
  const { email, username } = req.body;  // stopped here

  if(!email && !username) {
    return res.status(400).json({error: 'Username or email is required.'});
  }

  let user;
  if (username) {
    user = await authService.findUserByUsername(username);
  } else if (email) {
    user = await authService.findUserByEmail(email);
  }

  if (!user) {
    return res.status(404).json({error: 'User not found.'});
  }

  return res.json({security_question: user.security_question});
}

async function resetPassword(req, res) {
  const { username, email, security_answer, new_password } = req.body;
  
  if ((!username && !email) || !security_answer || !new_password) {  // for && error triggers only if both fields are missing at the same time
    return res.status(400).json({error: 'All fields are required.'});  // 400 is bad request - client side error
  }

  let user;
  if (username) {
    user = await authService.findUserByUsername(username);
  } else if (email) {
    user = await authService.findUserByEmail(email);
  }

  if (!user) {
    return res.status(400).json({error: 'Invalid credentials.'});  
  }

  const isMatch = await bcrypt.compare(security_answer, user.security_answer_hash);
  if (!isMatch) {
    return res.status(400).json({error: 'Invalid credentials.'});  
  }

  const password_hash = await bcrypt.hash(new_password, 10);

  await authService.updateUserPassword(user.id, password_hash);

  return res.status(200).json({message: 'Password updated successfully.'});
}


module.exports = { signup, signin, forgotPassword, resetPassword };