const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { type: String, required: true },
  pair: { type: String, required: true },
  direction: { type: String, required: true },
  entry: { type: Number, required: true },
  exit: { type: Number, required: true },
  positionSize: { type: Number, required: true },
  result: { type: Number, required: true },
  rr: { type: Number, required: true },
  ruleViolation: { type: String },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Trade', tradeSchema);
