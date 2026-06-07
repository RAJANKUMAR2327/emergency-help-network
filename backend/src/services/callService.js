const twilio = require('twilio');
const getClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};
const makeEmergencyCall = async (toPhone, reporterName, emergencyType, address) => {
  const client = getClient();
  if (!client) return { success: false, error: 'Twilio not configured' };
  const label = { medical: 'medical emergency', accident: 'road accident', fire: 'fire emergency', crime: 'crime', natural_disaster: 'natural disaster', other: 'emergency' }[emergencyType] || 'emergency';
  const twiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Aditi" language="en-IN">' + reporterName + ' is reporting a ' + label + ' at ' + (address || 'unknown location') + '. Please check your messages.</Say></Response>';
  try {
    const r = await client.calls.create({ twiml, to: toPhone, from: process.env.TWILIO_PHONE_NUMBER, timeout: 30 });
    return { success: true, sid: r.sid };
  } catch (e) { return { success: false, error: e.message }; }
};
const callEmergencyContacts = async (contacts, emergency, reporterName) => {
  const results = [];
  const address = emergency.location && emergency.location.address ? emergency.location.address : 'unknown';
  for (const c of contacts) {
    if (!c.notifyViaCall) continue;
    const r = await makeEmergencyCall(c.phone, reporterName, emergency.type, address);
    results.push({ contact: c.name, success: r.success });
  }
  return results;
};
module.exports = { makeEmergencyCall, callEmergencyContacts };
