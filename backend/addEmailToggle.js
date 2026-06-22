const fs = require('fs');
let c = fs.readFileSync('src/models/EmergencyContact.js', 'utf8');
c = c.replace(
  "notifyViaCall: { type: Boolean, default: false },",
  "notifyViaCall: { type: Boolean, default: false },\n        notifyViaEmail: { type: Boolean, default: true },"
);
fs.writeFileSync('src/models/EmergencyContact.js', c, 'utf8');
console.log('Added notifyViaEmail to model');
