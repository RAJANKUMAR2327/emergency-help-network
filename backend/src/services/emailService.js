const nodemailer = require('nodemailer');

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email not configured');
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendEmergencyEmail = async (toEmail, reporterName, emergency) => {
  const transporter = getTransporter();
  if (!transporter) return { success: false, error: 'Email not configured' };

  const lat = emergency.location && emergency.location.coordinates && emergency.location.coordinates[1];
  const lng = emergency.location && emergency.location.coordinates && emergency.location.coordinates[0];
  const mapLink = 'https://maps.google.com/?q=' + lat + ',' + lng;
  const address = emergency.location && emergency.location.address ? emergency.location.address : 'See map link';

  const typeEmoji = { medical: '🚑', accident: '🚗', fire: '🔥', crime: '🚨', natural_disaster: '⚠️', other: '🆘' };
  const emoji = typeEmoji[emergency.type] || '🆘';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset='utf-8'><meta name='viewport' content='width=device-width'></head>
    <body style='margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5'>
      <div style='max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:20px'>
        <div style='background:#DC2626;padding:30px;text-align:center'>
          <h1 style='color:#fff;margin:0;font-size:28px'>${emoji} EMERGENCY ALERT</h1>
          <p style='color:rgba(255,255,255,0.9);margin:8px 0 0'>Emergency Help Network</p>
        </div>
        <div style='padding:30px'>
          <div style='background:#FEE2E2;border-left:4px solid #DC2626;padding:16px;border-radius:8px;margin-bottom:20px'>
            <h2 style='margin:0 0 8px;color:#991B1B'>${reporterName} needs immediate help!</h2>
            <p style='margin:0;color:#7F1D1D'>Type: ${emergency.type.toUpperCase()} | Severity: ${(emergency.severity || 'HIGH').toUpperCase()}</p>
          </div>
          <table style='width:100%;border-collapse:collapse'>
            <tr><td style='padding:12px;border-bottom:1px solid #f0f0f0;color:#666;width:120px'>📍 Location</td><td style='padding:12px;border-bottom:1px solid #f0f0f0;font-weight:500'>${address}</td></tr>
            <tr><td style='padding:12px;border-bottom:1px solid #f0f0f0;color:#666'>👤 Reporter</td><td style='padding:12px;border-bottom:1px solid #f0f0f0;font-weight:500'>${reporterName}</td></tr>
            <tr><td style='padding:12px;color:#666'>⏰ Time</td><td style='padding:12px;font-weight:500'>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
          </table>
          <div style='text-align:center;margin:24px 0'>
            <a href='${mapLink}' style='background:#DC2626;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px'>
              🗺️ Open Live Location
            </a>
          </div>
          <p style='color:#666;font-size:13px;text-align:center'>This is an automated emergency alert from Emergency Help Network.<br>Please respond immediately if you can help.</p>
        </div>
        <div style='background:#f9f9f9;padding:16px;text-align:center;border-top:1px solid #eee'>
          <p style='margin:0;color:#999;font-size:12px'>Emergency Help Network • Patna, Bihar • India</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await transporter.sendMail({
      from: '"Emergency Help Network" <' + process.env.EMAIL_USER + '>',
      to: toEmail,
      subject: emoji + ' EMERGENCY: ' + reporterName + ' needs help at ' + address,
      html,
      text: 'EMERGENCY ALERT\n\n' + reporterName + ' needs help!\nType: ' + emergency.type + '\nLocation: ' + address + '\nMap: ' + mapLink,
    });
    console.log('Email sent to ' + toEmail + ': ' + result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email failed to ' + toEmail + ':', error.message);
    return { success: false, error: error.message };
  }
};

const sendTestEmail = async (toEmail) => {
  const transporter = getTransporter();
  if (!transporter) return { success: false, error: 'Email not configured' };
  try {
    const result = await transporter.sendMail({
      from: '"Emergency Help Network" <' + process.env.EMAIL_USER + '>',
      to: toEmail,
      subject: '✅ Test Alert - Emergency Help Network',
      html: '<div style="font-family:Arial;padding:20px"><h2 style="color:#DC2626">✅ Email notifications working!</h2><p>Your Emergency Help Network email alerts are configured correctly.</p><p>In a real emergency, you will receive a detailed alert with live location link.</p></div>',
      text: 'Test alert from Emergency Help Network. Your email notifications are working correctly.',
    });
    return { success: true, messageId: result.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const notifyContactsViaEmail = async (contacts, emergency, reporterName) => {
  const results = [];
  for (const contact of contacts) {
    if (!contact.email) continue;
    const result = await sendEmergencyEmail(contact.email, reporterName, emergency);
    results.push({ contact: contact.name, email: contact.email, channel: 'email', success: result.success });
    await new Promise(function(r) { setTimeout(r, 200); });
  }
  return results;
};

module.exports = { sendEmergencyEmail, sendTestEmail, notifyContactsViaEmail };