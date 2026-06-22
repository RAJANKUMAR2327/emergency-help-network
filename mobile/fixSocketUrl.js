const fs = require('fs');
let c = fs.readFileSync('src/context/EmergencyContext.js', 'utf8');
c = c.replace(
  "const socket = io('https://nutlike-mongoose-monsoon.ngrok-free.dev', { auth: { token } });",
  "const socket = io('https://emergency-help-network-production.up.railway.app', { auth: { token } });"
);
fs.writeFileSync('src/context/EmergencyContext.js', c, 'utf8');
console.log('Updated socket URL to Railway');
