const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Emergency = require('../models/Emergency');
const Message = require('../models/Message');

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

    // Personal room, separate from any emergency room — used for events
    // targeted at this specific user regardless of which emergency (if
    // any) they're currently viewing, e.g. a safety check-in alert firing.
    socket.join(`user_${socket.userId}`);

    // Join a specific emergency room for targeted events.
    // Previously this had no authorization check — any authenticated user
    // who obtained/guessed an emergency ID could join its room and see
    // responder locations plus (now) read/send chat messages meant only
    // for the reporter and accepted responders. Now verifies membership
    // first.
    socket.on('join_emergency_room', async (emergencyId) => {
      try {
        const emergency = await Emergency.findById(emergencyId).select('reporter responders');
        if (!emergency) return;

        const isReporter = emergency.reporter.toString() === socket.userId.toString();
        const isResponder = emergency.responders.some((r) => r.user.toString() === socket.userId.toString());

        if (!isReporter && !isResponder) {
          socket.emit('room_join_denied', { emergencyId, reason: 'Not authorized for this emergency' });
          return;
        }

        socket.join(`emergency_${emergencyId}`);
        console.log(`${socket.user?.name} joined room emergency_${emergencyId}`);
      } catch (err) {
        console.error('join_emergency_room error:', err.message);
      }
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

    // In-emergency text chat — now persisted, not just broadcast.
    // Note: the actual authorization check happens at join time above;
    // since a socket can only emit into rooms it has joined, and joining
    // is gated, this is naturally scoped to reporter+responders too.
    socket.on('send_message', async ({ emergencyId, message }) => {
      if (!message || !message.trim() || !socket.rooms.has(`emergency_${emergencyId}`)) return;

      try {
        const saved = await Message.create({
          emergency: emergencyId,
          sender: socket.userId,
          senderName: socket.user?.name || 'Unknown',
          text: message.trim().slice(0, 1000),
        });

        io.to(`emergency_${emergencyId}`).emit('new_message', {
          _id: saved._id,
          from: saved.senderName,
          senderId: socket.userId,
          message: saved.text,
          timestamp: saved.createdAt,
        });
      } catch (err) {
        console.error('send_message persist error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user?.name}`);
    });
  });
};

module.exports = setupSocket;
