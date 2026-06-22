const fs = require('fs');
let c = fs.readFileSync('src/screens/RegisterScreen.js', 'utf8');

c = c.replace(
  "const handleRegister = async () => {",
  `const handleRegister = async () => {
    try {
      const testGet = await fetch('https://emergency-help-network-production.up.railway.app/api/health');
      const testJson = await testGet.json();
      Alert.alert('GET Test Result', JSON.stringify(testJson));
      return;
    } catch (testErr) {
      Alert.alert('GET Test FAILED', testErr.message);
      return;
    }`
);

fs.writeFileSync('src/screens/RegisterScreen.js', c, 'utf8');
console.log('Added GET test as first step in handleRegister');
