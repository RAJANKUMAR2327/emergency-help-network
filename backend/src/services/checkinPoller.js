const SafetyCheckIn = require('../models/SafetyCheckIn');
const EmergencyContact = require('../models/EmergencyContact');
const User = require('../models/User');
const { sendSMS } = require('./smsService');

async function processExpiredCheckIns(io) {
  const expired = await SafetyCheckIn.find({ status: 'active', expiresAt: { $lte: new Date() } });

  for (const checkIn of expired) {
    try {
      const user = await User.findById(checkIn.user).select('name phone');
      if (!user) continue;

      const contactDoc = await EmergencyContact.findOne({ user: checkIn.user });
      const contacts = (contactDoc?.contacts || []).filter((c) => c.notifyViaSMS && c.phone);

      const lat = checkIn.location.coordinates[1];
      const lng = checkIn.location.coordinates[0];
      const message =
        `SAFETY ALERT ⚠️\n\n${user.name} did not confirm they were safe after a check-in timer` +
        `${checkIn.label ? ` ("${checkIn.label}")` : ''} expired.\n` +
        `Last known location: ${checkIn.location.address || 'See map link'}\n` +
        `Map: https://maps.google.com/?q=${lat},${lng}\n\n` +
        `Please try to reach them.`;

      for (const contact of contacts) {
        await sendSMS(contact.phone, message);
      }

      checkIn.status = 'alerted';
      checkIn.alertedAt = new Date();
      await checkIn.save();

      if (io) {
        io.to(`user_${checkIn.user}`).emit('checkin_alerted', { checkInId: checkIn._id });
      }

      console.log(`Check-in ${checkIn._id} expired unconfirmed — alerted ${contacts.length} contact(s) for user ${checkIn.user}`);
    } catch (err) {
      console.error(`Error processing expired check-in ${checkIn._id}:`, err.message);
    }
  }
}

// Poll every 60s — a check-in expiring won't be noticed more than ~1 min
// late, which is an acceptable margin for this use case (not a
// millisecond-precision system).
function startCheckInPoller(io) {
  setInterval(() => {
    processExpiredCheckIns(io).catch((err) => console.error('Check-in poller error:', err.message));
  }, 60 * 1000);
  console.log('Safety check-in poller started (60s interval)');
}

module.exports = { startCheckInPoller, processExpiredCheckIns };
