const fs = require('fs');
let c = fs.readFileSync('src/screens/RegisterScreen.js', 'utf8');
c = c.replace(
  "    } catch (error) {\n      Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');",
  "    } catch (error) {\n      console.log('REGISTER ERROR:', JSON.stringify({ message: error.message, code: error.code, hasResponse: !!error.response, status: error.response?.status, data: error.response?.data }));\n      Alert.alert('Registration Failed', error.response?.data?.message || error.message || 'Something went wrong');"
);
fs.writeFileSync('src/screens/RegisterScreen.js', c, 'utf8');
console.log('Added detailed error logging');
