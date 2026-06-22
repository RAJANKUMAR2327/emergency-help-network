const fs = require('fs');
let c = fs.readFileSync('src/api/client.js', 'utf8');
c = c.replace(
  "const API_URL = 'https://nutlike-mongoose-monsoon.ngrok-free.dev/api';",
  "const API_URL = 'https://emergency-help-network-production.up.railway.app/api';"
);
fs.writeFileSync('src/api/client.js', c, 'utf8');
console.log('Updated API_URL to Railway');
