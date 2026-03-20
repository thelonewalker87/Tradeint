const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  name: {
    type: String
  },
  mt5_webhook_token: {
    type: String,
    unique: true,
    sparse: true // Allows nulls while enforcing uniqueness for non-null values
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
