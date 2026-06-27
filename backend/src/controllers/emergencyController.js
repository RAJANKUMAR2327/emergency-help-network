const { orchestrateNotifications } = require('../services/notificationOrchestrator');
const Emergency = require('../models/Emergency');
const User = require('../models/User');

exports.triggerEmergency = async (req, res, next) => {
  try {
    const { type, severity, description, longitude, latitude, address } = req.body;

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
      .populate('responders.user', 'name phone')
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
      .populate('responders.user', 'name phone role');

    if (!emergency) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    next(error);
  }
};
