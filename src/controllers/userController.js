const authService = require('../services/authService');
const { uploadFileToS3 } = require('../services/s3Service');
const prisma = require('../prismaClient');

async function me(req, res) {  // user can only access their own info - using user id from jwt token in middleware
    try {
        const user = await authService.findUserById(req.user.userId);  // req.user is set by JWT middleware & contains userId 
        if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
        }
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url // include avatar_url
      }
    });
  } catch (error) {
    console.error('Error in me:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}

async function uploadAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const s3Url = await uploadFileToS3(req.file);
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatar_url: s3Url },
    });
    res.json({ success: true, data: { avatar_url: user.avatar_url } });
  } catch (error) {
    console.error('Error in uploadAvatar:', error);
    res.status(500).json({ success: false, message: 'Failed to upload avatar.' });
  }
}

// Get user's upload count
async function getUploadCount(req, res) {
  try {
    const userId = req.user.userId;
    
    const uploadCount = await prisma.clothingItem.count({
      where: {
        closet: {
          user_id: userId
        }
      }
    });

    res.json({
      success: true,
      data: {
        count: uploadCount,
        hasMetMinimum: uploadCount >= 4
      }
    });
    } catch (error) {
    console.error('Error in getUploadCount:', error);
    res.status(500).json({ success: false, message: 'Failed to get upload count.' });
    }
}

// Get user's coin balance
async function getCoinBalance(req, res) {
  try {
    const user = await authService.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    console.log('🔍 DEBUG: User coin_balance from DB:', user.coin_balance);
    console.log('🔍 DEBUG: User coin_balance type:', typeof user.coin_balance);

    // If coin_balance is null/undefined/0, set it to 1000 and update the database
    let coinBalance = user.coin_balance;
    if (coinBalance === null || coinBalance === undefined || coinBalance === 0) {
      console.log('🔧 DEBUG: Setting coin_balance to 1000 for user:', req.user.userId);
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { coin_balance: 1000 }
      });
      coinBalance = 1000;
      console.log('✅ DEBUG: Updated coin_balance to:', coinBalance);
    } else {
      console.log('✅ DEBUG: Using existing coin_balance:', coinBalance);
    }

    console.log('🎯 DEBUG: Final coin_balance being returned:', coinBalance);

    res.json({
      success: true,
      data: {
        coin_balance: coinBalance
      }
    });
  } catch (error) {
    console.error('Error in getCoinBalance:', error);
    res.status(500).json({ success: false, message: 'Failed to get coin balance.' });
  }
}

// Add coins to user's balance
async function addCoins(req, res) {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required.' });
    }

    // Check if user has coin_balance set, if not set it to 1000 first
    const user = await authService.findUserById(req.user.userId);
    if (user.coin_balance === null || user.coin_balance === undefined || user.coin_balance === 0) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { coin_balance: 1000 }
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        coin_balance: {
          increment: amount
        }
      }
    });

    res.json({
      success: true,
      data: {
        coin_balance: updatedUser.coin_balance,
        added_amount: amount
      }
    });
    } catch (error) {
    console.error('Error in addCoins:', error);
    res.status(500).json({ success: false, message: 'Failed to add coins.' });
    }
}

// Spend coins from user's balance
async function spendCoins(req, res) {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required.' });
    }

    const user = await authService.findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // If coin_balance is null/undefined/0, set it to 100 first
    let currentBalance = user.coin_balance;
    if (currentBalance === null || currentBalance === undefined || currentBalance === 0) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { coin_balance: 1000 }
      });
      currentBalance = 1000;
    }

    if (currentBalance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient coin balance.',
        data: {
          current_balance: currentBalance,
          required_amount: amount
        }
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        coin_balance: {
          decrement: amount
        }
      }
    });

    res.json({
      success: true,
      data: {
        coin_balance: updatedUser.coin_balance,
        spent_amount: amount
      }
    });
  } catch (error) {
    console.error('Error in spendCoins:', error);
    res.status(500).json({ success: false, message: 'Failed to spend coins.' });
  }
}

async function getUserById(req, res) {  // admin-only
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  try {
    const user = await authService.findUserById(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
    }
}

async function updateUser(req, res) {  // admin-only
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  try {
    const userId = Number(req.params.id);
    const { username, email } = req.body;  
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    const updatedUser = await authService.updateUser(userId, updateData);
    res.json({ success: true, data: { id: updatedUser.id, username: updatedUser.username, email: updatedUser.email } });
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
}

module.exports = { 
  me, 
  getUserById, 
  updateUser, 
  uploadAvatar, 
  getUploadCount, 
  getCoinBalance, 
  addCoins, 
  spendCoins 
};