require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const setupSocket = require('./socket/emergencySocket');
const authRoutes = require('./routes/auth');
const emergencyRoutes = require('./routes/emergency');
const notificationRoutes = require('./routes/notification');
const aiRoutes = require('./routes/ai');
const hospitalRoutes = require('./routes/hospital');

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  'https://ehn-api-proxy.rajankumar20030306.workers.dev',
  'https://your-vercel-dashboard.vercel.app',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean);

const io = new Server(server, {
  cors: { origin: process.env.NODE_ENV === 'production' ? ALLOWED_ORIGINS : '*', methods: ['GET', 'POST'], credentials: true },
});
setupSocket(io);
app.set('io', io);

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ALLOWED_ORIGINS : '*',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting — protect auth endpoints from brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  message: { success: false, message: 'Too many requests' },
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'Emergency Help Network API running', env: process.env.NODE_ENV }));
app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('STARTUP ERROR:', err.message);
    process.exit(1);
  }
};

start();
