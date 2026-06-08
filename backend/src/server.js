require('dotenv').config();
console.log('Step 1: dotenv loaded, PORT=' + process.env.PORT);
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
console.log('Step 2: packages loaded');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const setupSocket = require('./socket/emergencySocket');
const authRoutes = require('./routes/auth');
const emergencyRoutes = require('./routes/emergency');
const notificationRoutes = require('./routes/notification');
const aiRoutes = require('./routes/ai');
const hospitalRoutes = require('./routes/hospital');
console.log('Step 3: all modules loaded');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET','POST'], credentials: true } });
setupSocket(io);
app.set('io', io);
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Emergency Help Network API running' }));
app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use(errorHandler);
console.log('Step 4: routes registered');
const PORT = process.env.PORT || 5000;
const start = async () => {
  try {
    console.log('Step 5: connecting to MongoDB...');
    await connectDB();
    server.listen(PORT, () => {
      console.log('====================================');
      console.log('Server running on port ' + PORT);
      console.log('Health: http://localhost:' + PORT + '/api/health');
      console.log('====================================');
    });
  } catch (err) {
    console.error('STARTUP ERROR:', err.message);
    process.exit(1);
  }
};
start();
