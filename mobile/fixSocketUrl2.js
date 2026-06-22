const fs = require('fs');
let c = fs.readFileSync('src/context/EmergencyContext.js', 'utf8');
c = c.replace(
  "https://emergency-help-network-production.up.railway.app",
  "https://ehn-api-proxy.rajankumar20030306.workers.dev"
);
fs.writeFileSync('src/context/EmergencyContext.js', c, 'utf8');
console.log('Updated socket URL to Cloudflare proxy');
