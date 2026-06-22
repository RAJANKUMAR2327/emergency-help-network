const fs = require('fs');
let c = fs.readFileSync('src/api/client.js', 'utf8');
c = c.replace(
  "const API_URL = 'https://emergency-help-network-production.up.railway.app/api';",
  "const API_URL = 'https://api.yourdomain.in/api';"
);
fs.writeFileSync('src/api/client.js', c, 'utf8');

let ctx = fs.readFileSync('src/context/EmergencyContext.js', 'utf8');
ctx = ctx.replace(
  /io\('https:\/\/[^']+'\)/,
  "io('https://api.yourdomain.in')"
);
fs.writeFileSync('src/context/EmergencyContext.js', ctx, 'utf8');

console.log('URLs updated to custom domain');
