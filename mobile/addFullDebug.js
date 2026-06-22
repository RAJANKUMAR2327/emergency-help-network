const fs = require('fs');
let c = fs.readFileSync('src/screens/RegisterScreen.js', 'utf8');

c = c.replace(
  /Alert\.alert\('Registration Failed', error\.response\?\.data\?\.message \|\| error\.message \|\| 'Something went wrong'\);/,
  `const debugInfo = {
        message: error.message,
        code: error.code,
        name: error.name,
        hasResponse: !!error.response,
        hasRequest: !!error.request,
        config: error.config ? { url: error.config.url, baseURL: error.config.baseURL, method: error.config.method } : null,
      };
      Alert.alert('Registration Failed', JSON.stringify(debugInfo, null, 2));`
);

fs.writeFileSync('src/screens/RegisterScreen.js', c, 'utf8');
console.log('Added full debug error display');
