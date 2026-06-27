const twilio = require('twilio');

const getClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

const sendWhatsApp = async (toPhone, message) => {
  if (!toPhone) return { success: false, error: 'No phone number provided' };
  const client = getClient();
  if (!client) return { success: false, error: 'Twilio not configured' };
  const to = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone.startsWith('+') ? toPhone : '+' + toPhone}`;
  try {
    const r = await client.messages.create({ body: message, from: WHATSAPP_FROM, to });
    return { success: true, sid: r.sid };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

const formatWhatsAppMessage = (emergency, reporterName) => {
  const lat = emergency.location?.coordinates?.[1];
  const lng = emergency.location?.coordinates?.[0];
  const address = emergency.location?.address || 'See map link';
  return `🆘 *EMERGENCY ALERT*\n\n*${reporterName}* needs help!\n*Type:* ${emergency.type?.toUpperCase()}\n*Severity:* ${(emergency.severity || 'HIGH').toUpperCase()}\n*Location:* ${address}\n📍 Map: https://maps.google.com/?q=${lat},${lng}\n\nPlease respond immediately if you can help!`;
};

const notifyViaWhatsApp = async (contacts, emergency, reporterName) => {
  const msg = formatWhatsAppMessage(emergency, reporterName);
  const results = [];
  for (const c of contacts) {
    if (!c.notifyViaWhatsApp || !c.phone) continue; // skip if no phone or WA disabled
    const r = await sendWhatsApp(c.phone, msg);
    results.push({ contact: c.name, channel: 'whatsapp', success: r.success, error: r.error });
  }
  return results;
};

module.exports = { sendWhatsApp, notifyViaWhatsApp, formatWhatsAppMessage };
