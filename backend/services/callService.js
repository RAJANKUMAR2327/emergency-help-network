const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const buildTwiML = (reporterName, emergencyType, address) => {
  const typeLabel = {
    medical: 'medical emergency',
    accident: 'road accident',
    fire: 'fire emergency',
    crime: 'crime or danger situation',
    natural_disaster: 'natural disaster',
    other: 'emergency situation',
  }[emergencyType] || 'emergency';

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Say voice="Polly.Aditi" language="en-IN">
    This is an emergency alert from Emergency Help Network.
  </Say>
  <Pause length="1"/>
  <Say voice="Polly.Aditi" language="en-IN">
    ${reporterName} is reporting a ${typeLabel} at ${address}.
    They need immediate help. Please check your messages for the location link.
  </Say>
</Response>`;
};

const makeEmergencyCall = async (toPhone, reporterName, emergencyType, address) => {
  const twiml = buildTwiML(reporterName, emergencyType, address || 'unknown location');
  try {
    const call = await client.calls.create({
      twiml,
      to: toPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
      timeout: 30,
    });
    console.log(`Call initiated to ${toPhone}: ${call.sid}`);
    return { success: true, sid: call.sid };
  } catch (error) {
    console.error(`Call failed to ${toPhone}:`, error.message);
    return { success: false, error: error.message };
  }
};

const callEmergencyContacts = async (contacts, emergency, reporterName) => {
  const results = [];
  const address = emergency.location?.address || 'location shared via SMS';
  for (const contact of contacts) {
    if (!contact.notifyViaCall) continue;
    const result = await makeEmergencyCall(
      contact.phone,
      reporterName,
      emergency.type,
      address
    );
    results.push({
      contact: contact.name,
      phone: contact.phone,
      channel: 'call',
      ...result,
    });
    await new Promise((r) => setTimeout(r, 1000));
  }
  return results;
};

module.exports = { makeEmergencyCall, callEmergencyContacts };