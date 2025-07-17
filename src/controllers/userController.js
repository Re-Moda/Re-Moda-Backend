const authService = require('../services/authService');

async function me(req, res) {  // user can only access their own info - using user id from jwt token in middleware
    try {
        const user = await authService.findUserById(req.user.userId);  // req.user is set by JWT middleware & contains userId 
        if (!user) {
            return res.status(404).json({error: 'User not found.'});
        }
        res.json({id: user.id, username: user.username, email: user.email});
    } catch (error) {
      res.status(500).json({error: 'Server error.'});
    }
}

async function getUserById(req, res) {  // (COME BACK TO THIS: prisma roles?)admin/dev can access any user's info 
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

async function updateUser(req, res) {
    const userId = Number(req.params.id);
    
    if (userId !== req.user.userId) {  // compare user id w/ jwt id to prevent unauthorized access to other id's
        return res.status(403).json({error: 'Unauthorized access.'});
    }

    const { username, email } = req.body;  
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const updatedUser = await authService.updateUser(userId, updateData);

    res.json({id: updatedUser.id, username: updatedUser.username, email: updatedUser.email});
}

module.exports = { me, getUserById, updateUser }