const { notifyEmergencyContacts } = require('./smsService');
const { notifyViaWhatsApp } = require('./whatsappService');
const { callEmergencyContacts } = require('./callService');
const { notifyNearbyHelpers } = require('./pushNotificationService');
const { notifyContactsViaEmail } = require('./emailService');
const EmergencyContact = require('../models/EmergencyContact');
const User = require('../models/User');

const orchestrateNotifications = async (emergency, reporter) => {
  const results = { sms: [], whatsapp: [], calls: [], email: [], push: null, errors: [] };

  try {
    const contactDoc = await EmergencyContact.findOne({ user: reporter._id });
    const contacts = contactDoc ? contactDoc.contacts : [];

    // Find nearby helpers with valid FCM tokens and non-zero locations
    const nearbyHelpers = await User.find({
      _id: { $ne: reporter._id },
      role: { $in: ['user', 'helper'] },
      isAvailable: true,
      fcmToken: { $exists: true, $ne: null },
      'location.coordinates.0': { $ne: 0 },
      'location.coordinates.1': { $ne: 0 },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: emergency.location.coordinates },
          $maxDistance: 3000,
        },
      },
    }).select('fcmToken name').limit(30);

    // Run all channels in parallel — failures in one don't block others
    const [smsR, waR, callR, emailR, pushR] = await Promise.allSettled([
      contacts.length > 0 ? notifyEmergencyContacts(contacts, emergency, reporter.name) : Promise.resolve([]),
      contacts.length > 0 ? notifyViaWhatsApp(contacts, emergency, reporter.name) : Promise.resolve([]),
      contacts.some((c) => c.notifyViaCall && c.phone) ? callEmergencyContacts(contacts, emergency, reporter.name) : Promise.resolve([]),
      contacts.some((c) => c.notifyViaEmail && c.email) ? notifyContactsViaEmail(contacts, emergency, reporter.name) : Promise.resolve([]),
      nearbyHelpers.length > 0 ? notifyNearbyHelpers(nearbyHelpers, emergency) : Promise.resolve({ success: false, reason: 'No nearby helpers with FCM tokens' }),
    ]);

    results.sms = smsR.status === 'fulfilled' ? smsR.value : [];
    results.whatsapp = waR.status === 'fulfilled' ? waR.value : [];
    results.calls = callR.status === 'fulfilled' ? callR.value : [];
    results.email = emailR.status === 'fulfilled' ? emailR.value : [];
    results.push = pushR.status === 'fulfilled' ? pushR.value : null;

    if (smsR.status === 'rejected') results.errors.push({ channel: 'sms', error: smsR.reason?.message });
    if (waR.status === 'rejected') results.errors.push({ channel: 'whatsapp', error: waR.reason?.message });
    if (callR.status === 'rejected') results.errors.push({ channel: 'call', error: callR.reason?.message });
    if (emailR.status === 'rejected') results.errors.push({ channel: 'email', error: emailR.reason?.message });

    results.summary = {
      contactsNotified: contacts.length,
      smsSent: results.sms.filter((r) => r.success).length,
      whatsappSent: results.whatsapp.filter((r) => r.success).length,
      callsMade: results.calls.filter((r) => r.success).length,
      emailsSent: results.email.filter((r) => r.success).length,
      nearbyHelpersPushed: nearbyHelpers.length,
    };

    console.log('Notification summary:', JSON.stringify(results.summary));
    return results;
  } catch (error) {
    console.error('Orchestrator error:', error.message);
    results.errors.push({ channel: 'orchestrator', error: error.message });
    return results;
  }
};

module.exports = { orchestrateNotifications };
