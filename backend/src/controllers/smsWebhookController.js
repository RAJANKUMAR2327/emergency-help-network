const twilio = require('twilio');
const User = require('../models/User');
const Emergency = require('../models/Emergency');
const EmergencyContact = require('../models/EmergencyContact');
const { orchestrateNotifications } = require('../services/notificationOrchestrator');
const { sendSMS } = require('../services/smsService');

const LOCATION_FRESHNESS_HOURS = 24;
const TRIGGER_KEYWORDS = /^(sos|help|emergency)\b/i;
const CANCEL_KEYWORDS = /^(cancel|safe|stop)\s*$/i;

function detectType(text) {
  const t = text.toLowerCase();
  if (t.includes('medical') || t.includes('health')) return 'medical';
  if (t.includes('fire')) return 'fire';
  if (t.includes('accident') || t.includes('crash')) return 'accident';
  if (t.includes('crime') || t.includes('attack') || t.includes('robbery')) return 'crime';
  return 'other';
}

// Twilio numbers may or may not match your stored format exactly
// (+91XXXXXXXXXX vs XXXXXXXXXX). Match on the last 10 digits as a
// pragmatic fallback rather than requiring exact formatting everywhere.
async function findUserByPhone(rawPhone) {
  const exact = await User.findOne({ phone: rawPhone });
  if (exact) return exact;
  const digitsOnly = rawPhone.replace(/\D/g, '');
  const last10 = digitsOnly.slice(-10);
  if (last10.length < 10) return null;
  return User.findOne({ phone: { $regex: last10 + '$' } });
}

function reply(res, message) {
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(message);
  res.type('text/xml').send(twiml.toString());
}

exports.handleInboundSMS = async (req, res) => {
  // Verify this request actually came from Twilio, not anyone who found
  // the URL — without this, anyone could POST a fake `From` number and
  // trigger emergencies (or cancel real ones) for other people's accounts.
  if (process.env.NODE_ENV === 'production') {
    const signature = req.headers['x-twilio-signature'];
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const valid = twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, url, req.body);
    if (!valid) {
      console.warn('Rejected inbound SMS webhook — invalid Twilio signature');
      return res.status(403).send('Forbidden');
    }
  }

  try {
    const from = req.body.From;
    const body = (req.body.Body || '').trim();

    if (!from || !body) return reply(res, 'Message not understood.');

    const user = await findUserByPhone(from);
    if (!user) {
      return reply(res, "This number isn't registered with Emergency Help Network. Call 112 for immediate help.");
    }

    if (CANCEL_KEYWORDS.test(body)) {
      const active = await Emergency.findOne({ reporter: user._id, source: 'sms', status: { $in: ['active', 'responded'] } });
      if (!active) return reply(res, 'No active SMS-triggered emergency found to cancel.');
      active.status = 'cancelled';
      active.timeline.push({ event: 'Cancelled via SMS', actor: user._id });
      await active.save();
      return reply(res, 'Your emergency has been cancelled.');
    }

    if (!TRIGGER_KEYWORDS.test(body)) {
      return reply(res, 'To report an emergency, text SOS. To cancel one, text CANCEL. For immediate danger, call 112.');
    }

    // Block duplicates the same way the app's trigger endpoint does
    const existingActive = await Emergency.findOne({ reporter: user._id, status: { $in: ['active', 'responded'] } });
    if (existingActive) {
      return reply(res, 'You already have an active emergency. Text CANCEL to cancel it, or wait for responders.');
    }

    const hasFreshLocation =
      user.locationUpdatedAt &&
      Date.now() - new Date(user.locationUpdatedAt).getTime() < LOCATION_FRESHNESS_HOURS * 60 * 60 * 1000 &&
      !(user.location?.coordinates?.[0] === 0 && user.location?.coordinates?.[1] === 0);

    if (!hasFreshLocation) {
      // Can't do nearby-helper matching without coordinates — fall back
      // to directly alerting trusted contacts with what we do know
      // (that this person texted SOS), rather than silently doing
      // nothing just because there's no fresh GPS fix.
      const contactDoc = await EmergencyContact.findOne({ user: user._id });
      const contacts = (contactDoc?.contacts || []).filter((c) => c.notifyViaSMS && c.phone);
      const message = `EMERGENCY ALERT 🆘\n\n${user.name} texted SOS but we have no recent location on file for them. Please try calling them directly.`;
      for (const contact of contacts) {
        await sendSMS(contact.phone, message);
      }
      return reply(
        res,
        `Alert sent to your ${contacts.length} emergency contact(s), but we have no recent location for you — nearby helpers could not be notified. Open the app once when you have signal so we can save your location for next time. For immediate danger, call 112.`
      );
    }

    const emergency = await Emergency.create({
      reporter: user._id,
      type: detectType(body),
      severity: 'critical', // SMS fallback implies signal is bad enough that this is assumed serious
      source: 'sms',
      location: {
        type: 'Point',
        coordinates: user.location.coordinates,
        address: 'Last known location (from SMS fallback, may not be current)',
      },
      timeline: [{ event: 'Emergency triggered via SMS fallback', actor: user._id }],
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('new_emergency', {
        _id: emergency._id,
        type: emergency.type,
        severity: emergency.severity,
        status: 'active',
        createdAt: emergency.createdAt,
        location: { coordinates: user.location.coordinates, address: emergency.location.address },
        reporter: { name: user.name, phone: user.phone, bloodGroup: user.bloodGroup },
        responders: [],
      });
    }

    // Same background notification path as the app-based trigger
    setImmediate(async () => {
      try {
        await orchestrateNotifications(emergency, user);
      } catch (bgErr) {
        console.error('SMS fallback background notification error:', bgErr.message);
      }
    });

    return reply(
      res,
      "Emergency reported using your last known location. Nearby helpers and your contacts are being notified. Text CANCEL if this was a mistake. For immediate danger, call 112."
    );
  } catch (error) {
    console.error('Inbound SMS handling error:', error.message);
    return reply(res, 'Something went wrong processing your message. Please call 112 for immediate help.');
  }
};
