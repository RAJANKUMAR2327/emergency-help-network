const fs = require('fs');
let c = fs.readFileSync('src/controllers/notificationController.js', 'utf8');
c = c.replace(
  "if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });",
  "if (!name || (!phone && !email)) return res.status(400).json({ success: false, message: 'Name and at least one of phone or email is required' });"
);
fs.writeFileSync('src/controllers/notificationController.js', c, 'utf8');
console.log('Relaxed backend validation to allow phone OR email');
