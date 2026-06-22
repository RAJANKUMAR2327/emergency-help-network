const fs = require('fs');
let c = fs.readFileSync('src/screens/RegisterScreen.js', 'utf8');
c = c.replace(
  /const debugInfo = \{[\s\S]*?Alert\.alert\('Registration Failed', JSON\.stringify\(debugInfo, null, 2\)\);/,
  "Alert.alert('Registration Failed', error.response?.data?.message || error.message || 'Something went wrong');"
);
fs.writeFileSync('src/screens/RegisterScreen.js', c, 'utf8');
console.log('Cleaned up RegisterScreen.js error handling');
