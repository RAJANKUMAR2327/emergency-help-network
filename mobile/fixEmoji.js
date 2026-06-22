const fs = require('fs');
let c = fs.readFileSync('src/screens/LoginScreen.js', 'utf8');

c = c.split('ðŸ”’').join('🔒');
c = c.split('ðŸ™ˆ').join('🙈');
c = c.split('ðŸ‘ï¸').join('👁️');
c = c.split('â†’').join('→');
c = c.split('ðŸ›¡ï¸').join('🛡️');

fs.writeFileSync('src/screens/LoginScreen.js', c, 'utf8');
console.log('Re-fixed emoji encoding');
