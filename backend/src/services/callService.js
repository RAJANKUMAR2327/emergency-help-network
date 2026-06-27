const twilio = require('twilio');

const getClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

const TYPE_LABELS = {
  medical: 'medical emergency',
  accident: 'road accident',
  fire: 'fire emergency',
  crime: 'crime',
  natural_disaster: 'natural disaster',
  other: 'emergency',
};

const makeEmergencyCall = async (toPhone, reporterName, emergencyType, address) => {
  if (!toPhone) return { success: false, error: 'No phone number provided' };
  const client = getClient();
  if (!client) return { success: false, error: 'Twilio not configured' };
  const label = TYPE_LABELS[emergencyType] || 'emergency';
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Aditi" language="en-IN">${reporterName} is reporting a ${label} at ${address || 'unknown location'}. Please check your messages for the location link and respond immediately.</Say><Pause length="1"/><Say voice="Polly.Aditi" language="en-IN">This is an automated alert from Emergency Help Network.</Say></Response>`;
  try {
    const r = await client.calls.create({ twiml, to: toPhone, from: process.env.TWILIO_PHONE_NUMBER, timeout: 30 });
    return { success: true, sid: r.sid };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

const callEmergencyContacts = async (contacts, emergency, reporterName) => {
  const results = [];
  const address = emergency.location?.address || 'unknown location';
  for (const c of contacts) {
    if (!c.notifyViaCall || !c.phone) continue; // skip if no phone or call disabled
    const r = await makeEmergencyCall(c.phone, reporterName, emergency.type, address);
    results.push({ contact: c.name, channel: 'call', success: r.success, error: r.error });
  }
  return results;
};

module.exports = { makeEmergencyCall, callEmergencyContacts };
