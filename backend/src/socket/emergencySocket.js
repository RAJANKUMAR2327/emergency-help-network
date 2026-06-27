const jwt = require('jsonwebtoken');
const User = require('../models/User');

const setupSocket = (io) => {
  // Authenticate every socket connection
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      const user = await User.findById(decoded.id).select('name role location');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user?.name} (${socket.userId})`);

    // Join a specific emergency room for targeted events
    socket.on('join_emergency_room', (emergencyId) => {
      socket.join(`emergency_${emergencyId}`);
      console.log(`${socket.user?.name} joined room emergency_${emergencyId}`);
    });

    socket.on('leave_emergency_room', (emergencyId) => {
      socket.leave(`emergency_${emergencyId}`);
    });

    // Responder broadcasts their location — shape matches frontend EmergencyContext
    socket.on('responder_location_update', ({ emergencyId, longitude, latitude }) => {
      socket.to(`emergency_${emergencyId}`).emit('responder_moved', {
        userId: socket.userId,
        name: socket.user?.name,
        currentLocation: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
      });
    });

    // In-emergency text chat
    socket.on('send_message', ({ emergencyId, message }) => {
      io.to(`emergency_${emergencyId}`).emit('new_message', {
        from: socket.user?.name,
        message,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user?.name}`);
    });
  });
};

module.exports = setupSocket;
