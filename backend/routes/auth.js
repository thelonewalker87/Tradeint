const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

// Upgraded MT5-ready Auth
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    // Find or create user to keep it "demo friendly" but with persistence
    let user = await User.findOne({ email });
    
    if (!user) {
      // Auto-signup if user doesn't exist (as per previous demo behavior)
      if (password.length < 4) {
        return res.status(401).json({ message: 'Invalid credentials. Password too short.' });
      }
      
      user = new User({
        email,
        password: password, // In production, use bcrypt here
        name: email.split('@')[0],
        mt5_webhook_token: uuidv4() // Generate unique token for Phase 1
      });
      await user.save();
    } else {
      // Basic creditial check
      if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Ensure existing users get a token if they don't have one
      if (!user.mt5_webhook_token) {
        user.mt5_webhook_token = uuidv4();
        await user.save();
      }
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '7d' }
    );

    return res.status(200).json({ 
        token, 
        user: { id: user._id, email: user.email, name: user.name } 
    });
  } catch (error) {
    console.error('Auth logic error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
