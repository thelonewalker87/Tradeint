const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Trade = require('../models/Trade');

/**
 * @route   POST /api/webhooks/mt5
 * @desc    Receive trade data from MT5 Expert Advisor
 * @access  Public (Token-based)
 */
router.post('/mt5', async (req, res) => {
  try {
    const { token, trade } = req.body;
    console.log(`[Webhook] Incoming MT5 payload. Token starts with: ${token ? token.substring(0, 5) : 'NONE'}`);
    if (trade) console.log(`[Webhook] Trade data: ${trade.pair} ${trade.direction} / Result: ${trade.result}`);
      return res.status(400).json({ message: 'Invalid payload: token and trade required' });
    }

    // 1. Authenticate the MT5 terminal via the token
    const user = await User.findOne({ mt5_webhook_token: token });
    if (!user) {
      console.warn(`Unauthorized MT5 attempt with token: ${token.substring(0, 8)}...`);
      return res.status(401).json({ message: 'Invalid MT5 authentication token' });
    }

    // 2. Validate trade data (minimal check for key fields)
    const requiredFields = ['date', 'pair', 'direction', 'entry', 'exit', 'result'];
    for (const field of requiredFields) {
      if (trade[field] === undefined) {
        return res.status(400).json({ message: `Missing trade field: ${field}` });
      }
    }

    // 3. Prevent duplicates (Heuristic: Date + Pair + EntryPrice + Result)
    const duplicate = await Trade.findOne({
      user: user._id,
      date: trade.date,
      pair: trade.pair,
      entry: trade.entry,
      result: trade.result
    });

    if (duplicate) {
      return res.status(200).json({ message: 'Trade already synced', tradeId: duplicate._id });
    }

    // 4. Create and save the new trade linked to the user
    const newTrade = new Trade({
      ...trade,
      user: user._id
    });

    await newTrade.save();

    // 5. Emit real-time update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(user._id.toString()).emit('trade_synced', {
        message: 'New trade synced from MT5',
        trade: newTrade
      });
    }

    console.log(`MT5 Sync: User ${user.email} synced trade ${trade.pair} ${trade.result > 0 ? 'WIN' : 'LOSS'}`);
    
    res.status(201).json({ 
      message: 'Trade synced successfully', 
      tradeId: newTrade._id 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Internal server error processing webhook' });
  }
});

module.exports = router;
