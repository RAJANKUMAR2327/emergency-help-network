const twilio = require('twilio');

const getClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

const sendSMS = async (toPhone, message) => {
  if (!toPhone) return { success: false, error: 'No phone number provided' };
  const client = getClient();
  if (!client) return { success: false, error: 'Twilio not configured' };
  try {
    const r = await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to: toPhone });
    return { success: true, sid: r.sid };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

const formatEmergencyMessage = (emergency, reporterName) => {
  const lat = emergency.location?.coordinates?.[1];
  const lng = emergency.location?.coordinates?.[0];
  const address = emergency.location?.address || 'See map link';
  return `EMERGENCY ALERT 🆘\n\n${reporterName} needs help!\nType: ${emergency.type?.toUpperCase()}\nLocation: ${address}\nMap: https://maps.google.com/?q=${lat},${lng}`;
};

const notifyEmergencyContacts = async (contacts, emergency, reporterName) => {
  const msg = formatEmergencyMessage(emergency, reporterName);
  const results = [];
  for (const c of contacts) {
    if (!c.notifyViaSMS || !c.phone) continue; // skip if no phone or SMS disabled
    const r = await sendSMS(c.phone, msg);
    results.push({ contact: c.name, channel: 'sms', success: r.success, error: r.error });
  }
  return results;
};

module.exports = { sendSMS, notifyEmergencyContacts, formatEmergencyMessage };
