const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

/**
 * @route   GET /api/mt5/token
 * @desc    Get user's MT5 Webhook Token and Webhook URL
 * @access  Private
 */
router.get('/token', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.mt5_webhook_token) {
      user.mt5_webhook_token = uuidv4();
      await user.save();
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const webhookUrl = `${protocol}://${host}/api/webhooks/mt5`;

    res.json({
      token: user.mt5_webhook_token,
      webhookUrl: webhookUrl
    });
  } catch (error) {
    console.error('CRITICAL: Error fetching MT5 token:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error fetching MT5 configuration', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

module.exports = router;
