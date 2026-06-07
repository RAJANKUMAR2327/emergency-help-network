const twilio = require('twilio');
const getClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) return null;
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};
const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
const sendWhatsApp = async (toPhone, message) => {
  const client = getClient();
  if (!client) return { success: false, error: 'Twilio not configured' };
  const to = toPhone.startsWith('whatsapp:') ? toPhone : 'whatsapp:' + (toPhone.startsWith('+') ? toPhone : '+' + toPhone);
  try {
    const r = await client.messages.create({ body: message, from: WHATSAPP_FROM, to });
    return { success: true, sid: r.sid };
  } catch (e) { return { success: false, error: e.message }; }
};
const formatWhatsAppMessage = (emergency, reporterName) => {
  const lat = emergency.location && emergency.location.coordinates && emergency.location.coordinates[1];
  const lng = emergency.location && emergency.location.coordinates && emergency.location.coordinates[0];
  return 'EMERGENCY ALERT\nPerson: ' + reporterName + '\nType: ' + emergency.type.toUpperCase() + '\nMap: https://maps.google.com/?q=' + lat + ',' + lng;
};
const notifyViaWhatsApp = async (contacts, emergency, reporterName) => {
  const msg = formatWhatsAppMessage(emergency, reporterName);
  const results = [];
  for (const c of contacts) {
    if (!c.notifyViaWhatsApp) continue;
    const r = await sendWhatsApp(c.phone, msg);
    results.push({ contact: c.name, success: r.success });
  }
  return results;
};
module.exports = { sendWhatsApp, notifyViaWhatsApp, formatWhatsAppMessage };
