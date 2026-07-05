const { orchestrateNotifications } = require('../services/notificationOrchestrator');
const Emergency = require('../models/Emergency');
const User = require('../models/User');
const Message = require('../models/Message');

// Minimum time a reporter must wait between triggering emergencies,
// regardless of the previous one's status. Prevents rapid-fire spam
// immediately after cancelling/resolving one — each trigger fires a full
// SMS/WhatsApp/call/email/push cascade, which has both a real cost
// (Twilio charges per message/call) and a trust cost (helpers who get
// spammed with false alerts stop responding to real ones).
const TRIGGER_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

exports.triggerEmergency = async (req, res, next) => {
  try {
    const { type, severity, description, longitude, latitude, address } = req.body;

    // Block a second emergency while one is still open. A user in a
    // genuinely worsening situation should update/escalate the existing
    // one (future feature), not spawn a duplicate that splits responder
    // attention and double-notifies the same contacts.
    const existingActive = await Emergency.findOne({
      reporter: req.user._id,
      status: { $in: ['active', 'responded'] },
    });
    if (existingActive) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active emergency in progress. Cancel or resolve it before reporting a new one.',
        existingEmergencyId: existingActive._id,
      });
    }

    // Cooldown against rapid re-triggering, checked against the reporter's
    // most recent emergency of any status.
    const lastEmergency = await Emergency.findOne({ reporter: req.user._id }).sort({ createdAt: -1 });
    if (lastEmergency && Date.now() - new Date(lastEmergency.createdAt).getTime() < TRIGGER_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((TRIGGER_COOLDOWN_MS - (Date.now() - new Date(lastEmergency.createdAt).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds}s before reporting another emergency. If this is a genuine emergency, call 112 immediately.`,
      });
    }

    const emergency = await Emergency.create({
      reporter: req.user._id,
      type,
      severity: severity || 'high',
      description,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address,
      },
      timeline: [{ event: 'Emergency triggered', actor: req.user._id }],
    });

    // Find nearby helpers — exclude users who haven't set their location yet (coordinates [0,0])
    const nearbyHelpers = await User.find({
      _id: { $ne: req.user._id },
      role: { $in: ['user', 'helper'] },
      isAvailable: true,
      'location.coordinates.0': { $ne: 0 }, // exclude default [0,0] location
      'location.coordinates.1': { $ne: 0 },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: 3000,
        },
      },
    }).select('fcmToken name phone').limit(20);

    const io = req.app.get('io');
    if (io) {
      io.emit('new_emergency', {
        _id: emergency._id,
        type,
        severity,
        status: 'active',
        createdAt: emergency.createdAt,
        location: { coordinates: [parseFloat(longitude), parseFloat(latitude)], address },
        reporter: { name: req.user.name, phone: req.user.phone, bloodGroup: req.user.bloodGroup },
        responders: [],
      });
    }

    // Run contact notifications and DB updates in background — don't block the response
    setImmediate(async () => {
      try {
        await orchestrateNotifications(emergency, req.user); // NOW CALLED
        await Emergency.findByIdAndUpdate(emergency._id, {
          notifiedUsers: nearbyHelpers.map((h) => h._id),
        });
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.emergenciesReported': 1 } });
      } catch (bgErr) {
        console.error('Background notification error:', bgErr.message);
      }
    });

    res.status(201).json({
      success: true,
      data: emergency,
      notifiedHelpers: nearbyHelpers.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.acceptEmergency = async (req, res, next) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Emergency not found' });

    // Allow accept on both active and responded — multiple helpers can respond
    if (!['active', 'responded'].includes(emergency.status)) {
      return res.status(400).json({ success: false, message: 'Emergency is no longer active' });
    }

    const alreadyResponding = emergency.responders.some(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyResponding) return res.status(400).json({ success: false, message: 'Already responding' });

    emergency.responders.push({ user: req.user._id });
    emergency.status = 'responded';
    emergency.timeline.push({ event: `${req.user.name} accepted`, actor: req.user._id });
    await emergency.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.helpProvided': 1 } });

    const io = req.app.get('io');
    if (io) {
      io.to(`emergency_${emergency._id}`).emit('responder_joined', {
        responder: { id: req.user._id, name: req.user.name },
      });
    }

    res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    next(error);
  }
};

exports.updateResponderLocation = async (req, res, next) => {
  try {
    const { longitude, latitude } = req.body;

    // Verify this user is actually a responder on this emergency
    const emergency = await Emergency.findOne({
      _id: req.params.id,
      'responders.user': req.user._id,
    });
    if (!emergency) return res.status(403).json({ success: false, message: 'Not a responder on this emergency' });

    await Emergency.findOneAndUpdate(
      { _id: req.params.id, 'responders.user': req.user._id },
      {
        $set: {
          'responders.$.currentLocation': {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
        },
      }
    );

    const io = req.app.get('io');
    if (io) {
      // Emit shape that matches frontend EmergencyContext expectation
      io.to(`emergency_${req.params.id}`).emit('responder_moved', {
        userId: req.user._id,
        name: req.user.name,
        currentLocation: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

exports.resolveEmergency = async (req, res, next) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Not found' });

    const responseTime = Math.floor((Date.now() - new Date(emergency.createdAt).getTime()) / 1000);
    emergency.status = 'resolved';
    emergency.resolvedAt = Date.now();
    emergency.responseTimeSeconds = responseTime;
    emergency.timeline.push({ event: 'Emergency resolved', actor: req.user._id });
    await emergency.save();

    const io = req.app.get('io');
    if (io) {
      // Emit to the room — event name matches frontend listener
      io.to(`emergency_${emergency._id}`).emit('emergency_resolved', { emergencyId: emergency._id });
    }

    res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    next(error);
  }
};

exports.cancelEmergency = async (req, res, next) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Not found' });
    if (emergency.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the reporter can cancel this emergency' });
    }
    if (!['active', 'responded'].includes(emergency.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a resolved emergency' });
    }
    emergency.status = 'cancelled';
    emergency.timeline.push({ event: 'Emergency cancelled by reporter', actor: req.user._id });
    await emergency.save();

    const io = req.app.get('io');
    if (io) io.to(`emergency_${emergency._id}`).emit('emergency_resolved', { emergencyId: emergency._id, reason: 'cancelled' });

    res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    next(error);
  }
};

// New: lets the reporter themselves flag their own report as a false
// alarm — distinct from "cancel" (which just means "I no longer need
// help", e.g. a friend showed up). False alarm means "this shouldn't
// have been sent" — tracked separately on the user's stats so repeated
// false alarms are visible for manual review later, without any
// automatic punishment baked in here.
exports.markFalseAlarm = async (req, res, next) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Not found' });
    if (emergency.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the reporter can mark this as a false alarm' });
    }
    if (!['active', 'responded'].includes(emergency.status)) {
      return res.status(400).json({ success: false, message: 'This emergency is already closed' });
    }

    emergency.status = 'false_alarm';
    emergency.timeline.push({ event: 'Marked as false alarm by reporter', actor: req.user._id });
    await emergency.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.falseAlarmCount': 1 } });

    const io = req.app.get('io');
    if (io) io.to(`emergency_${emergency._id}`).emit('emergency_resolved', { emergencyId: emergency._id, reason: 'false_alarm' });

    res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    next(error);
  }
};

// Lets the reporter rate a responder (1-5) after the emergency is
// resolved — feeds into the responder's stats.averageRating, shown as a
// trust signal to future reporters deciding whether to wait for a
// specific helper or hope someone else responds too.
exports.rateResponder = async (req, res, next) => {
  try {
    const { rating } = req.body;
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) return res.status(404).json({ success: false, message: 'Not found' });

    if (emergency.reporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the reporter can rate responders' });
    }
    if (!['resolved', 'cancelled'].includes(emergency.status)) {
      return res.status(400).json({ success: false, message: 'Can only rate responders after the emergency is closed' });
    }

    const responder = emergency.responders.id(req.params.responderId);
    if (!responder) return res.status(404).json({ success: false, message: 'Responder not found on this emergency' });
    if (responder.rating) return res.status(400).json({ success: false, message: 'This responder has already been rated for this emergency' });

    responder.rating = rating;
    responder.ratedAt = new Date();
    await emergency.save();

    // Recompute the responder's average rating across every emergency
    // they've ever responded to and been rated on. Recomputing fresh each
    // time (rather than maintaining a running sum/count) keeps it always
    // consistent and ratings are infrequent enough that this is cheap.
    const agg = await Emergency.aggregate([
      { $match: { 'responders.user': responder.user, 'responders.rating': { $exists: true } } },
      { $unwind: '$responders' },
      { $match: { 'responders.user': responder.user, 'responders.rating': { $exists: true } } },
      { $group: { _id: '$responders.user', avg: { $avg: '$responders.rating' } } },
    ]);

    if (agg.length > 0) {
      await User.findByIdAndUpdate(responder.user, { 'stats.averageRating': Math.round(agg[0].avg * 10) / 10 });
    }

    res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    next(error);
  }
};


exports.getActiveEmergencies = async (req, res, next) => {
  try {
    const { longitude, latitude, radius = 5000 } = req.query;

    // If no lat/lng in query, use the requesting user's stored location
    const userLng = longitude ? parseFloat(longitude) : req.user.location?.coordinates?.[0];
    const userLat = latitude ? parseFloat(latitude) : req.user.location?.coordinates?.[1];

    let query = { status: { $in: ['active', 'responded'] } };

    // Only apply geo filter if we have a valid non-zero location
    if (userLng && userLat && !(userLng === 0 && userLat === 0)) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [userLng, userLat] },
          $maxDistance: parseInt(radius),
        },
      };
    }

    const emergencies = await Emergency.find(query)
      .populate('reporter', 'name phone bloodGroup medicalInfo')
      .populate('responders.user', 'name phone isVerified stats.averageRating')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, count: emergencies.length, data: emergencies });
  } catch (error) {
    next(error);
  }
};

exports.getSingleEmergency = async (req, res, next) => {
  try {
    const emergency = await Emergency.findById(req.params.id)
      .populate('reporter', 'name phone bloodGroup medicalInfo profilePhoto')
      .populate('responders.user', 'name phone role isVerified stats.averageRating');

    if (!emergency) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    next(error);
  }
};

// Shared check: only the reporter or an accepted responder may read/send
// chat messages for an emergency — anyone else with a valid token
// shouldn't be able to read a stranger's emergency chat just by guessing
// or being handed an ID.
async function assertChatAccess(emergencyId, userId) {
  const emergency = await Emergency.findById(emergencyId).select('reporter responders');
  if (!emergency) return { emergency: null, allowed: false };
  const isReporter = emergency.reporter.toString() === userId.toString();
  const isResponder = emergency.responders.some((r) => r.user.toString() === userId.toString());
  return { emergency, allowed: isReporter || isResponder };
}

exports.getMessages = async (req, res, next) => {
  try {
    const { allowed } = await assertChatAccess(req.params.id, req.user._id);
    if (!allowed) return res.status(403).json({ success: false, message: 'Not authorized to view this chat' });

    const messages = await Message.find({ emergency: req.params.id })
      .sort({ createdAt: 1 })
      .limit(200);

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// REST fallback for sending — the socket path (emergencySocket.js) is the
// primary one for live delivery, but this lets a message go through (and
// get persisted) even if the socket briefly disconnected.
exports.postMessage = async (req, res, next) => {
  try {
    const { allowed } = await assertChatAccess(req.params.id, req.user._id);
    if (!allowed) return res.status(403).json({ success: false, message: 'Not authorized to send in this chat' });

    const message = await Message.create({
      emergency: req.params.id,
      sender: req.user._id,
      senderName: req.user.name,
      text: req.body.text,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`emergency_${req.params.id}`).emit('new_message', {
        _id: message._id,
        from: message.senderName,
        senderId: req.user._id,
        message: message.text,
        timestamp: message.createdAt,
      });
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};
