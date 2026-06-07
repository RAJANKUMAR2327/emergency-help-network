const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

const formatWhatsAppMessage = (emergency, reporterName) => {
  const lat = emergency.location?.coordinates?.[1];
  const lng = emergency.location?.coordinates?.[0];
  const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
  const address = emergency.location?.address || 'See map link';
  const typeEmoji = {
    medical: '🚑',
    accident: '🚗',
    fire: '🔥',
    crime: '🚨',
    natural_disaster: '⚠️',
    other: '🆘',
  };
  const emoji = typeEmoji[emergency.type] || '🆘';
  return `*${emoji} EMERGENCY ALERT*\n\n*Person:* ${reporterName}\n*Type:* ${emergency.type.replace('_', ' ').toUpperCase()}\n*Severity:* ${emergency.severity?.toUpperCase()}\n*Location:* ${address}\n\n*Map:* ${mapLink}\n\n_Sent via Emergency Help Network_`;
};

const sendWhatsApp = async (toPhone, message) => {
  const formattedPhone = toPhone.startsWith('whatsapp:')
    ? toPhone
    : `whatsapp:${toPhone.startsWith('+') ? toPhone : '+' + toPhone}`;
  try {
    const result = await client.messages.create({
      body: message,
      from: WHATSAPP_FROM,
      to: formattedPhone,
    });
    console.log(`WhatsApp sent to ${toPhone}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error(`WhatsApp failed to ${toPhone}:`, error.message);
    return { success: false, error: error.message };
  }
};

const notifyViaWhatsApp = async (contacts, emergency, reporterName) => {
  const message = formatWhatsAppMessage(emergency, reporterName);
  const results = [];
  for (const contact of contacts) {
    if (!contact.notifyViaWhatsApp) continue;
    const result = await sendWhatsApp(contact.phone, message);
    results.push({
      contact: contact.name,
      phone: contact.phone,
      channel: 'whatsapp',
      ...result,
    });
    await new Promise((r) => setTimeout(r, 400));
  }
  return results;
};

module.exports = { sendWhatsApp, notifyViaWhatsApp, formatWhatsAppMessage };