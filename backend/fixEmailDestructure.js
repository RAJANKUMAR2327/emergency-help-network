const fs = require('fs');
let c = fs.readFileSync('src/controllers/notificationController.js', 'utf8');

c = c.replace(
  "const { name, phone, relationship, notifyViaSMS, notifyViaWhatsApp, notifyViaCall } = req.body;",
  "const { name, phone, email, relationship, notifyViaSMS, notifyViaWhatsApp, notifyViaCall, notifyViaEmail } = req.body;"
);

c = c.replace(
  "doc.contacts.push({ name, phone, relationship, notifyViaSMS: notifyViaSMS !== false, notifyViaWhatsApp: notifyViaWhatsApp !== false, notifyViaCall: notifyViaCall === true });",
  "doc.contacts.push({ name, phone, email, relationship, notifyViaSMS: notifyViaSMS !== false, notifyViaWhatsApp: notifyViaWhatsApp !== false, notifyViaCall: notifyViaCall === true, notifyViaEmail: notifyViaEmail !== false });"
);

fs.writeFileSync('src/controllers/notificationController.js', c, 'utf8');
console.log('Fixed: email now destructured and saved correctly');
