const fs = require('fs');
let c = fs.readFileSync('src/api/client.js', 'utf8');
c = c.replace(
  "const API_URL = 'https://emergency-help-network-production.up.railway.app/api';",
  "const API_URL = 'https://jsonplaceholder.typicode.com';"
);
fs.writeFileSync('src/api/client.js', c, 'utf8');
console.log('Temporarily switched to test API for diagnosis');
