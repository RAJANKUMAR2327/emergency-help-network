const User = require('../models/User');

// Standard blood donor compatibility: for a given recipient group, which
// donor groups can safely give to them (O- is the universal donor,
// AB+ the universal recipient).
const COMPATIBLE_DONORS = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

const MIN_DAYS_BETWEEN_DONATIONS = 90; // standard whole-blood donation interval

exports.setDonorStatus = async (req, res, next) => {
  try {
    const { isDonor, lastDonationDate } = req.body;

    if (isDonor && !req.user.bloodGroup) {
      return res.status(400).json({
        success: false,
        message: 'Add your blood group in your profile before registering as a donor',
      });
    }

    const update = { isDonor: !!isDonor };
    if (lastDonationDate) update.lastDonationDate = new Date(lastDonationDate);

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.searchDonors = async (req, res, next) => {
  try {
    const { bloodGroup, longitude, latitude, radius = 15000, exactOnly } = req.query;

    if (!bloodGroup || !COMPATIBLE_DONORS[bloodGroup]) {
      return res.status(400).json({ success: false, message: 'Valid bloodGroup is required' });
    }
    if (!longitude || !latitude) {
      return res.status(400).json({ success: false, message: 'Location is required' });
    }

    const acceptableGroups = exactOnly === 'true' ? [bloodGroup] : COMPATIBLE_DONORS[bloodGroup];

    const donors = await User.find({
      _id: { $ne: req.user._id },
      isDonor: true,
      bloodGroup: { $in: acceptableGroups },
      'location.coordinates.0': { $ne: 0 },
      'location.coordinates.1': { $ne: 0 },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseInt(radius, 10),
        },
      },
    })
      .select('name phone bloodGroup lastDonationDate location')
      .limit(30);

    const now = Date.now();
    const results = donors.map((d) => {
      const daysSinceLastDonation = d.lastDonationDate
        ? Math.floor((now - new Date(d.lastDonationDate).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return {
        _id: d._id,
        name: d.name,
        phone: d.phone,
        bloodGroup: d.bloodGroup,
        isExactMatch: d.bloodGroup === bloodGroup,
        // Surfaced so the requester can see who's likely available —
        // doesn't block contacting someone, just informs the choice.
        likelyEligible: daysSinceLastDonation === null || daysSinceLastDonation >= MIN_DAYS_BETWEEN_DONATIONS,
        location: d.location,
      };
    });

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    next(error);
  }
};
