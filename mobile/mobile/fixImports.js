const fs = require('fs');
let c = fs.readFileSync('src/screens/HomeScreen.js', 'utf8');

const before = c;

// Replace the broken multi-line Alert.alert call with a clean single-line version
c = c.replace(
  /Alert\.alert\('🆘 Emergency Triggered!'[\s\S]*?\]\);/,
  "Alert.alert('🆘 Emergency Triggered!', res.data.notifiedHelpers + ' helpers notified nearby. Stay calm. Help is on the way.', [\n        { text: 'Track on Map', onPress: () => navigation.navigate('Map', { emergencyId: res.data.data._id }) },\n        { text: 'OK' },\n      ]);"
);

if (c !== before) {
  fs.writeFileSync('src/screens/HomeScreen.js', c, 'utf8');
  console.log('Fixed HomeScreen.js Alert.alert string');
} else {
  console.log('No change made - pattern not matched, need manual fix');
}