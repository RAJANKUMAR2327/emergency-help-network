const { notifyEmergencyContacts } = require('./smsService');
const { notifyViaWhatsApp } = require('./whatsappService');
const { callEmergencyContacts } = require('./callService');
const { notifyNearbyHelpers } = require('./pushNotificationService');
const EmergencyContact = require('../models/EmergencyContact');
const User = require('../models/User');

const orchestrateNotifications = async (emergency, reporter) => {
  const results = { sms: [], whatsapp: [], calls: [], push: null, errors: [] };
  try {
    const contactDoc = await EmergencyContact.findOne({ user: reporter._id });
    const contacts = contactDoc ? contactDoc.contacts : [];

    const nearbyHelpers = await User.find({
      _id: { $ne: reporter._id },
      role: { $in: ['user', 'helper'] },
      isAvailable: true,
      fcmToken: { $exists: true, $ne: null },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: emergency.location.coordinates },
          $maxDistance: 3000,
        },
      },
    }).select('fcmToken name').limit(30);

    const [smsR, waR, callR, pushR] = await Promise.allSettled([
      contacts.length > 0 ? notifyEmergencyContacts(contacts, emergency, reporter.name) : Promise.resolve([]),
      contacts.length > 0 ? notifyViaWhatsApp(contacts, emergency, reporter.name) : Promise.resolve([]),
      contacts.filter((c) => c.notifyViaCall).length > 0 ? callEmergencyContacts(contacts, emergency, reporter.name) : Promise.resolve([]),
      nearbyHelpers.length > 0 ? notifyNearbyHelpers(nearbyHelpers, emergency) : Promise.resolve({ success: false, reason: 'No nearby helpers' }),
    ]);

    results.sms = smsR.status === 'fulfilled' ? smsR.value : [];
    results.whatsapp = waR.status === 'fulfilled' ? waR.value : [];
    results.calls = callR.status === 'fulfilled' ? callR.value : [];
    results.push = pushR.status === 'fulfilled' ? pushR.value : null;
    results.summary = {
      contactsNotified: contacts.length,
      smsSent: results.sms.filter((r) => r.success).length,
      whatsappSent: results.whatsapp.filter((r) => r.success).length,
      callsMade: results.calls.filter((r) => r.success).length,
      nearbyHelpersPushed: nearbyHelpers.length,
    };
    console.log('Notification summary:', results.summary);
    return results;
  } catch (error) {
    console.error('Orchestrator error:', error);
    results.errors.push({ channel: 'orchestrator', error: error.message });
    return results;
  }
};

module.exports = { orchestrateNotifications };
