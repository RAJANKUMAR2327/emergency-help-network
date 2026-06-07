require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const setupSocket = require('./socket/emergencySocket');

const authRoutes = require('./routes/auth');
const emergencyRoutes = require('./routes/emergency');

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupSocket(io);
app.set('io', io);

app.use(helmet());
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001'], credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) =>
  res.json({ success: true, message: 'Emergency Help Network API running' })
);

app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
// existing routes
app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);

// ADD THIS:
const notificationRoutes = require('./routes/notification');
app.use('/api/notifications', notificationRoutes);