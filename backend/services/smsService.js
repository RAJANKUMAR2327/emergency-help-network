const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const formatEmergencyMessage = (emergency, reporterName) => {
  const typeMap = {
    medical: 'MEDICAL EMERGENCY',
    accident: 'ACCIDENT',
    fire: 'FIRE EMERGENCY',
    crime: 'CRIME / DANGER',
    natural_disaster: 'NATURAL DISASTER',
    other: 'EMERGENCY',
  };
  const label = typeMap[emergency.type] || 'EMERGENCY';
  const address = emergency.location?.address || 'Location shared below';
  const lat = emergency.location?.coordinates?.[1];
  const lng = emergency.location?.coordinates?.[0];
  const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
  return `${label}\n\n${reporterName} needs urgent help!\n\nLocation: ${address}\nMap: ${mapLink}\n\nSent via Emergency Help Network.`;
};

const sendSMS = async (toPhone, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhone,
    });
    console.log(`SMS sent to ${toPhone}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error(`SMS failed to ${toPhone}:`, error.message);
    return { success: false, error: error.message };
  }
};

const notifyEmergencyContacts = async (contacts, emergency, reporterName) => {
  const message = formatEmergencyMessage(emergency, reporterName);
  const results = [];
  for (const contact of contacts) {
    if (!contact.notifyViaSMS) continue;
    const result = await sendSMS(contact.phone, message);
    results.push({
      contact: contact.name,
      phone: contact.phone,
      channel: 'sms',
      ...result,
    });
    await new Promise((r) => setTimeout(r, 300));
  }
  return results;
};

module.exports = { sendSMS, notifyEmergencyContacts, formatEmergencyMessage };