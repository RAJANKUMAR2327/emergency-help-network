const axios = require('axios');

// Uses Resend HTTP API — Railway blocks nodemailer SMTP (ports 465/587)
// Set RESEND_API_KEY in Railway environment variables
// Get a free key at https://resend.com — 3,000 emails/month free

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — email disabled');
    return { success: false, error: 'Email not configured' };
  }
  try {
    const res = await axios.post(
      'https://api.resend.com/emails',
      {
        from: process.env.EMAIL_FROM || 'EHN <noreply@yourdomain.com>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return { success: true, messageId: res.data.id };
  } catch (e) {
    console.error('Email send failed:', e.response?.data || e.message);
    return { success: false, error: e.response?.data?.message || e.message };
  }
};

const sendEmergencyEmail = async (toEmail, reporterName, emergency) => {
  const lat = emergency.location?.coordinates?.[1];
  const lng = emergency.location?.coordinates?.[0];
  const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
  const address = emergency.location?.address || 'See map link';
  const typeEmoji = { medical: '🚑', accident: '🚗', fire: '🔥', crime: '🚨', natural_disaster: '⚠️', other: '🆘' };
  const emoji = typeEmoji[emergency.type] || '🆘';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5">
  <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="background:#DC2626;padding:30px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">${emoji} EMERGENCY ALERT</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Emergency Help Network</p>
    </div>
    <div style="padding:30px">
      <div style="background:#FEE2E2;border-left:4px solid #DC2626;padding:16px;border-radius:8px;margin-bottom:20px">
        <h2 style="margin:0 0 8px;color:#991B1B">${reporterName} needs immediate help!</h2>
        <p style="margin:0;color:#7F1D1D">Type: ${emergency.type?.toUpperCase()} | Severity: ${(emergency.severity || 'HIGH').toUpperCase()}</p>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:12px;border-bottom:1px solid #f0f0f0;color:#666;width:120px">📍 Location</td><td style="padding:12px;border-bottom:1px solid #f0f0f0;font-weight:500">${address}</td></tr>
        <tr><td style="padding:12px;border-bottom:1px solid #f0f0f0;color:#666">👤 Reporter</td><td style="padding:12px;border-bottom:1px solid #f0f0f0;font-weight:500">${reporterName}</td></tr>
        <tr><td style="padding:12px;color:#666">⏰ Time</td><td style="padding:12px;font-weight:500">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
      </table>
      <div style="text-align:center;margin:24px 0">
        <a href="${mapLink}" style="background:#DC2626;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px">🗺️ Open Live Location</a>
      </div>
      <p style="color:#666;font-size:13px;text-align:center">This is an automated emergency alert from Emergency Help Network.<br>Please respond immediately if you can help.</p>
    </div>
    <div style="background:#f9f9f9;padding:16px;text-align:center;border-top:1px solid #eee">
      <p style="margin:0;color:#999;font-size:12px">Emergency Help Network • India</p>
    </div>
  </div>
</body></html>`;

  return sendEmail({
    to: toEmail,
    subject: `${emoji} EMERGENCY: ${reporterName} needs help at ${address}`,
    html,
    text: `EMERGENCY ALERT\n\n${reporterName} needs help!\nType: ${emergency.type}\nSeverity: ${emergency.severity || 'HIGH'}\nLocation: ${address}\nMap: ${mapLink}`,
  });
};

const sendTestEmail = async (toEmail) => {
  return sendEmail({
    to: toEmail,
    subject: '✅ Test Alert - Emergency Help Network',
    html: '<div style="font-family:Arial;padding:20px"><h2 style="color:#DC2626">✅ Email notifications working!</h2><p>Your Emergency Help Network email alerts are configured correctly.</p><p>In a real emergency, you will receive a detailed alert with a live location link.</p></div>',
    text: 'Test alert from Emergency Help Network. Your email notifications are working correctly.',
  });
};

const notifyContactsViaEmail = async (contacts, emergency, reporterName) => {
  const results = [];
  for (const contact of contacts) {
    if (!contact.email || !contact.notifyViaEmail) continue;
    const result = await sendEmergencyEmail(contact.email, reporterName, emergency);
    results.push({ contact: contact.name, email: contact.email, channel: 'email', success: result.success, error: result.error });
    // Small delay to avoid hitting Resend rate limits
    await new Promise((r) => setTimeout(r, 100));
  }
  return results;
};

module.exports = { sendEmail, sendEmergencyEmail, sendTestEmail, notifyContactsViaEmail };
