const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

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

    const host = req.get('host');
    const protocol = req.protocol;
    const webhookUrl = `${protocol}://${host}/api/webhooks/mt5`;

    res.json({
      token: user.mt5_webhook_token,
      webhookUrl: webhookUrl
    });
  } catch (error) {
    console.error('Error fetching MT5 token:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
