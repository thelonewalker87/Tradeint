require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const tradeRoutes = require('./routes/trades');
const authRoutes = require('./routes/auth');
const mt5Routes = require('./routes/mt5');
const webhookRoutes = require('./routes/webhooks');
const auth = require('./middleware/auth');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Attach io to app for use in routes
app.set('io', io);

// API Routes
app.use('/api/trades', auth, tradeRoutes); // Protected
app.use('/api/auth', authRoutes);
app.use('/api/mt5', mt5Routes); 
app.use('/api/webhooks', webhookRoutes); // Internal token-based auth

// Socket Connection
io.on('connection', (socket) => {
  console.log('Client connected to sync-gate');
  socket.on('join_user', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their sync room`);
  });
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tradeint-global';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas (Tradeint Global DB)');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });
