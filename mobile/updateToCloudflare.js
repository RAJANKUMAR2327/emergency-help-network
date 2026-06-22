const fs = require('fs');
let c = fs.readFileSync('src/api/client.js', 'utf8');
c = c.replace(
  "const API_URL = 'https://emergency-help-network-production.up.railway.app/api';",
  "const API_URL = 'https://ehn-api-proxy.rajankumar20030306.workers.dev/api';"
);
fs.writeFileSync('src/api/client.js', c, 'utf8');
console.log('Updated client.js to use Cloudflare proxy');

let ctx = fs.readFileSync('src/context/EmergencyContext.js', 'utf8');
ctx = ctx.replace(
  /io\('https:\/\/[^']+'\)/,
  "io('https://ehn-api-proxy.rajankumar20030306.workers.dev')"
);
fs.writeFileSync('src/context/EmergencyContext.js', ctx, 'utf8');
console.log('Updated EmergencyContext.js socket URL');
