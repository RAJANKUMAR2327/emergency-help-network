const fs = require('fs');
let c = fs.readFileSync('src/screens/LoginScreen.js', 'utf8');
const before = c;

if (!c.includes('Register')) {
  // Add a register link before the closing of the main View, right after the Sign In button
  c = c.replace(
    /(\s*<\/TouchableOpacity>\s*\n)(\s*<\/View>\s*\n\s*\);)/,
    "$1\n      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 16, alignItems: 'center' }}>\n        <Text style={{ color: '#6366F1', fontSize: 14 }}>Don't have an account? Sign Up</Text>\n      </TouchableOpacity>\n$2"
  );
}

if (c !== before) {
  fs.writeFileSync('src/screens/LoginScreen.js', c, 'utf8');
  console.log('Added Sign Up link to LoginScreen.js');
} else {
  console.log('No change made - need to inspect file manually');
}
