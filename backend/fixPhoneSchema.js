const fs = require('fs');
let c = fs.readFileSync('src/models/EmergencyContact.js', 'utf8');
c = c.replace(
  "phone: { type: String, required: true },",
  "phone: { type: String, default: null },"
);
fs.writeFileSync('src/models/EmergencyContact.js', c, 'utf8');
console.log('Made phone optional in schema');
