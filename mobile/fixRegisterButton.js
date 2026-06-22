const fs = require('fs');
let c = fs.readFileSync('src/screens/LoginScreen.js', 'utf8');

c = c.replace(
  `<TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLinkText}>Don't have an account? <Text style={styles.registerLinkBold}>Register now</Text></Text>
        </TouchableOpacity>`,
  `<TouchableOpacity style={{ marginTop: 16, padding: 14, borderRadius: 14, borderWidth: 2, borderColor: colors.primary, alignItems: 'center' }} onPress={() => navigation.navigate('Register')}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>Create New Account</Text>
        </TouchableOpacity>`
);

fs.writeFileSync('src/screens/LoginScreen.js', c, 'utf8');
console.log('Made Register button bold and visible');
