const authService = require('../services/authService');
const { uploadFileToS3 } = require('../services/s3Service');
const prisma = require('../prismaClient');

async function me(req, res) {  // user can only access their own info - using user id from jwt token in middleware
    try {
        const user = await authService.findUserById(req.user.userId);  // req.user is set by JWT middleware & contains userId 
        if (!user) {
            return res.status(404).json({error: 'User not found.'});
        }
        res.json({
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url // include avatar_url
        });
    } catch (error) {
      res.status(500).json({error: 'Server error.'});
    }
}

async function uploadAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const s3Url = await uploadFileToS3(req.file);
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatar_url: s3Url },
    });
    res.json({ avatar_url: user.avatar_url });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload avatar.' });
  }
}

async function getUserById(req, res) {  // admin-only
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' });
    }
    try {
        const user = await authService.findUserById(Number(req.params.id));
        if(!user) {
            return res.status(404).json({error: 'User not found.'});
        }
        res.json({id: user.id, username: user.username, email: user.email});
    } catch (error) {
        res.status(500).json({error: 'Server error.'});
    }
}

async function updateUser(req, res) {  // admin-only
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' });
    }
    const userId = Number(req.params.id);
    const { username, email } = req.body;  
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const updatedUser = await authService.updateUser(userId, updateData);

    res.json({id: updatedUser.id, username: updatedUser.username, email: updatedUser.email});
}

module.exports = { me, getUserById, updateUser, uploadAvatar };