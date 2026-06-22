const fs = require('fs');
let c = fs.readFileSync('src/screens/RegisterScreen.js', 'utf8');
c = c.replace(
  /try \{\s*const testGet = await fetch\([^}]+?return;\s*\} catch \(testErr\) \{\s*Alert\.alert\('GET Test FAILED'[^}]+?return;\s*\}/s,
  ''
);
fs.writeFileSync('src/screens/RegisterScreen.js', c, 'utf8');
console.log('Removed debug GET test code');
