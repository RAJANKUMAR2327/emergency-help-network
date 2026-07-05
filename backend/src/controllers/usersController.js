const User = require('../models/User');

// Admin-only. There's no automated verification flow yet (e.g. ID upload
// + review) — this is the manual lever until that exists: an admin
// reviews a user (e.g. after meeting them, or checking submitted ID
// through some out-of-band process) and flips this flag. Deliberately
// simple rather than building a full document-verification pipeline
// without knowing how you actually want to vet people first.
exports.setUserVerified = async (req, res, next) => {
  try {
    const { isVerified } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: !!isVerified },
      { new: true }
    ).select('name phone isVerified role');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.listUnverifiedHelpers = async (req, res, next) => {
  try {
    const users = await User.find({ isVerified: false, role: { $in: ['user', 'helper'] } })
      .select('name phone role stats createdAt')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};
