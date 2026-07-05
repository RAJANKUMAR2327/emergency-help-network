// Force Node's DNS resolver to use a known-working server — works around
// a Windows issue where Node picks the wrong network adapter's DNS
// config even when other adapters (e.g. VirtualBox virtual adapters)
// have no DNS set, causing MongoDB SRV lookups to fail locally even
// though the OS-level DNS is configured correctly. Harmless on Render/
// production Linux hosts, where this isn't an issue anyway.
require('dns').setServers(['8.8.8.8', '1.1.1.1']);

// Must be the very first require after that — Sentry needs to patch
// modules before anything else requires them.
require('./instrument');

require('dotenv').config();
const Sentry = require('@sentry/node');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const setupSocket = require('./socket/emergencySocket');
const authRoutes = require('./routes/auth');
const emergencyRoutes = require('./routes/emergency');
const notificationRoutes = require('./routes/notification');
const aiRoutes = require('./routes/ai');
const hospitalRoutes = require('./routes/hospital');
const checkinRoutes = require('./routes/checkin');
const donorRoutes = require('./routes/donor');
const userRoutes = require('./routes/users');
const smsRoutes = require('./routes/sms');
const { startCheckInPoller } = require('./services/checkinPoller');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// ALLOWED_ORIGINS is a comma-separated list read from env, e.g. in Render:
//   ALLOWED_ORIGINS=https://ehn-dashboard.vercel.app,https://dashboard.vercel.app
// This avoids hardcoding a URL that goes stale when you relink/rename a Vercel project.
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [
  'https://ehn-api-proxy.rajankumar20030306.workers.dev',
  ...envOrigins,
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean);

if (process.env.NODE_ENV === 'production' && envOrigins.length === 0) {
  console.warn(
    'WARNING: ALLOWED_ORIGINS env var is not set. Your dashboard\'s Vercel URL will be blocked by CORS until you set it on Render.'
  );
}

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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: { success: false, message: 'Too many requests' },
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Real health check — confirms the DB connection is actually up, not just
// that the process is running. mongoose.connection.readyState: 1 = connected.
app.get('/api/health', (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const status = dbConnected ? 200 : 503;
  res.status(status).json({
    success: dbConnected,
    message: dbConnected ? 'Emergency Help Network API running' : 'API running but database not connected',
    env: process.env.NODE_ENV,
    db: dbConnected ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sms', smsRoutes);

// Sentry must capture errors AFTER routes are registered but BEFORE your
// own error handler, so it can report the error and still let your
// errorHandler send the response to the client.
Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Render's free tier spins the service down after ~15 min of no requests,
// causing a 30-60s cold start on the next real user request — unacceptable
// for an emergency app. Self-pinging every 10 min keeps it warm.
// This is a mitigation, not a fix: it only helps while at least one
// instance is already awake, and Render can still enforce a hard sleep
// depending on plan. For real guarantees, move to a paid always-on tier,
// or point an external monitor (UptimeRobot, cron-job.org — free) at
// /api/health instead of relying on self-ping alone.
function startKeepAlive() {
  const selfUrl = process.env.RENDER_EXTERNAL_URL || process.env.SELF_URL;
  if (!selfUrl || process.env.NODE_ENV !== 'production') return;

  setInterval(() => {
    fetch(`${selfUrl}/api/health`).catch((err) => {
      console.warn('Keep-alive ping failed:', err.message);
    });
  }, 10 * 60 * 1000); // every 10 minutes

  console.log(`Keep-alive ping enabled, targeting ${selfUrl}/api/health every 10 min`);
}

const start = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
      startKeepAlive();
      startCheckInPoller(io);
    });
  } catch (err) {
    console.error('STARTUP ERROR:', err.message);
    Sentry.captureException(err);
    process.exit(1);
  }
};

start();

// Render sends SIGTERM on every redeploy and on scale-down. Without
// handling it, in-flight requests (including an emergency being
// triggered mid-deploy) get dropped when the process dies immediately.
// This stops accepting new connections, lets existing ones finish
// (up to a timeout), then closes the DB connection cleanly.
function gracefulShutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed');
    try {
      await mongoose.connection.close(false);
      console.log('MongoDB connection closed');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err.message);
    }
    process.exit(0);
  });

  // Force-exit if graceful shutdown hangs longer than 10s (e.g. a stuck
  // connection) — better to drop it than to hang and get SIGKILLed anyway.
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
});
