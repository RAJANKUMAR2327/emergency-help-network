const { orchestrateNotifications } = require('../services/notificationOrchestrator');
const Emergency = require('../models/Emergency');
const User = require('../models/User');
const EmergencyContact = require('../models/EmergencyContact');

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

    const nearbyHelpers = await User.find({
      _id: { $ne: req.user._id },
      role: { $in: ['user', 'helper'] },
      isAvailable: true,
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
        emergencyId: emergency._id,
        type,
        severity,
        location: { latitude, longitude, address },
        reporter: { name: req.user.name, phone: req.user.phone },
        nearbyCount: nearbyHelpers.length,
      });
    }

    await Emergency.findByIdAndUpdate(emergency._id, {
      notifiedUsers: nearbyHelpers.map((h) => h._id),
    });

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.emergenciesReported': 1 },
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
    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency not found' });
    }
    if (emergency.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Emergency is no longer active' });
    }

    const alreadyResponding = emergency.responders.some(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyResponding) {
      return res.status(400).json({ success: false, message: 'Already responding' });
    }

    emergency.responders.push({ user: req.user._id });
    emergency.status = 'responded';
    emergency.timeline.push({ event: `${req.user.name} accepted`, actor: req.user._id });
    await emergency.save();

    const io = req.app.get('io');
    if (io) {
      io.emit(`emergency_${emergency._id}_responder_joined`, {
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
    const emergency = await Emergency.findOneAndUpdate(
      { _id: req.params.id, 'responders.user': req.user._id },
      {
        $set: {
          'responders.$.currentLocation': {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
        },
      },
      { new: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit(`emergency_${req.params.id}_location_update`, {
        userId: req.user._id,
        longitude,
        latitude,
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
    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const responseTime = Math.floor(
      (Date.now() - new Date(emergency.createdAt).getTime()) / 1000
    );

    emergency.status = 'resolved';
    emergency.resolvedAt = Date.now();
    emergency.responseTimeSeconds = responseTime;
    emergency.timeline.push({ event: 'Emergency resolved', actor: req.user._id });
    await emergency.save();

    const io = req.app.get('io');
    if (io) io.emit(`emergency_${emergency._id}_resolved`, { emergencyId: emergency._id });

    res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    next(error);
  }
};

exports.getActiveEmergencies = async (req, res, next) => {
  try {
    const { longitude, latitude, radius = 5000 } = req.query;
    let query = { status: { $in: ['active', 'responded'] } };

    if (longitude && latitude) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
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

    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    next(error);
  }
};