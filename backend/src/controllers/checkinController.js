const SafetyCheckIn = require('../models/SafetyCheckIn');

const MAX_DURATION_MINUTES = 180; // 3 hours — a sanity cap, not meant for multi-day trips

exports.startCheckIn = async (req, res, next) => {
  try {
    const { durationMinutes, longitude, latitude, address, label } = req.body;
    const minutes = parseInt(durationMinutes, 10);

    if (!minutes || minutes < 1 || minutes > MAX_DURATION_MINUTES) {
      return res.status(400).json({ success: false, message: `Duration must be between 1 and ${MAX_DURATION_MINUTES} minutes` });
    }
    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ success: false, message: 'Location is required to start a check-in' });
    }

    // Only one active check-in at a time per user — starting a new one
    // while one is running would be confusing (which timer alerts?)
    const existing = await SafetyCheckIn.findOne({ user: req.user._id, status: 'active' });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active check-in running',
        existing,
      });
    }

    const checkIn = await SafetyCheckIn.create({
      user: req.user._id,
      label: label?.slice(0, 100),
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address,
      },
      expiresAt: new Date(Date.now() + minutes * 60 * 1000),
      status: 'active',
    });

    res.status(201).json({ success: true, data: checkIn });
  } catch (error) {
    next(error);
  }
};

exports.confirmSafe = async (req, res, next) => {
  try {
    const checkIn = await SafetyCheckIn.findOne({ _id: req.params.id, user: req.user._id });
    if (!checkIn) return res.status(404).json({ success: false, message: 'Check-in not found' });
    if (checkIn.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This check-in is no longer active' });
    }
    checkIn.status = 'confirmed_safe';
    await checkIn.save();
    res.status(200).json({ success: true, data: checkIn });
  } catch (error) {
    next(error);
  }
};

exports.cancelCheckIn = async (req, res, next) => {
  try {
    const checkIn = await SafetyCheckIn.findOne({ _id: req.params.id, user: req.user._id });
    if (!checkIn) return res.status(404).json({ success: false, message: 'Check-in not found' });
    if (checkIn.status !== 'active') {
      return res.status(400).json({ success: false, message: 'This check-in is no longer active' });
    }
    checkIn.status = 'cancelled';
    await checkIn.save();
    res.status(200).json({ success: true, data: checkIn });
  } catch (error) {
    next(error);
  }
};

// Extend the timer without fully cancelling — e.g. "running 10 more
// minutes late". Adds to the current expiry rather than resetting it.
exports.extendCheckIn = async (req, res, next) => {
  try {
    const { additionalMinutes } = req.body;
    const extra = parseInt(additionalMinutes, 10);
    if (!extra || extra < 1 || extra > MAX_DURATION_MINUTES) {
      return res.status(400).json({ success: false, message: 'Invalid extension duration' });
    }
    const checkIn = await SafetyCheckIn.findOne({ _id: req.params.id, user: req.user._id, status: 'active' });
    if (!checkIn) return res.status(404).json({ success: false, message: 'Active check-in not found' });

    checkIn.expiresAt = new Date(checkIn.expiresAt.getTime() + extra * 60 * 1000);
    await checkIn.save();
    res.status(200).json({ success: true, data: checkIn });
  } catch (error) {
    next(error);
  }
};

exports.getActiveCheckIn = async (req, res, next) => {
  try {
    const checkIn = await SafetyCheckIn.findOne({ user: req.user._id, status: 'active' });
    res.status(200).json({ success: true, data: checkIn });
  } catch (error) {
    next(error);
  }
};
