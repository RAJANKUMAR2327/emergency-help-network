const fs = require('fs');
let c = fs.readFileSync('src/navigation/AppNavigator.js', 'utf8');

c = c.replace(
  "import { Text, View, StyleSheet } from 'react-native';",
  "import { StyleSheet } from 'react-native';\nimport { Ionicons } from '@expo/vector-icons';"
);

c = c.replace(
  `const TabIcon = ({ icon, label, focused }) => (
  <View style={[tabStyles.iconWrapper, focused && tabStyles.iconWrapperActive]}>
    <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>{icon}</Text>
    <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
  </View>
);
const tabStyles = StyleSheet.create({
  iconWrapper: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, minHeight: 48 },
  iconWrapperActive: { backgroundColor: colors.primaryLight },
  icon: { fontSize: 22, marginBottom: 3, lineHeight: 26 },
  iconActive: {},
  label: { fontSize: 10, color: colors.gray500, lineHeight: 12 },
  labelActive: { color: colors.primary, fontWeight: '600' },
});`,
  `const tabStyles = StyleSheet.create({});`
);

c = c.replace(
  `      headerShown: false,
      tabBarStyle: { height: 64 + insets.bottom, paddingBottom: insets.bottom, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: colors.gray200, backgroundColor: colors.white },
      tabBarShowLabel: false,`,
  `      headerShown: false,
      tabBarStyle: { paddingBottom: insets.bottom, borderTopWidth: 0.5, borderTopColor: colors.gray200, backgroundColor: colors.white },
      tabBarShowLabel: true,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.gray500,
      tabBarLabelStyle: { fontSize: 11, marginBottom: 4 },`
);

c = c.replace(
  `    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="ðŸ " label="Home" focused={focused} /> }} />
    <Tab.Screen name="Contacts" component={ContactsScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="ðŸ'¥" label="Contacts" focused={focused} /> }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="ðŸ'¤" label="Profile" focused={focused} /> }} />`,
  `    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
    <Tab.Screen name="Contacts" component={ContactsScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />`
);

fs.writeFileSync('src/navigation/AppNavigator.js', c, 'utf8');
console.log('Replaced custom TabIcon with Ionicons');
