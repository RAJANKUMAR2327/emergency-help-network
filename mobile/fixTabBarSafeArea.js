const fs = require('fs');
let c = fs.readFileSync('src/navigation/AppNavigator.js', 'utf8');

c = c.replace(
  "import { Text, View, StyleSheet } from 'react-native';",
  "import { Text, View, StyleSheet } from 'react-native';\nimport { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';"
);

c = c.replace(
  `const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { height: 70, paddingBottom: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: colors.gray200, backgroundColor: colors.white },
      tabBarShowLabel: false,
    }}
  >`,
  `const HomeTabs = () => {
  const insets = useSafeAreaInsets();
  return (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { height: 60 + insets.bottom, paddingBottom: insets.bottom + 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: colors.gray200, backgroundColor: colors.white },
      tabBarShowLabel: false,
    }}
  >`
);

c = c.replace(
  `    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="ðŸ‘¤" label="Profile" focused={focused} /> }} />
  </Tab.Navigator>
);`,
  `    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="ðŸ‘¤" label="Profile" focused={focused} /> }} />
  </Tab.Navigator>
  );
};`
);

c = c.replace(
  "export default function AppNavigator() {\n  const { user, loading } = useAuth();\n  if (loading) return null;\n  return (\n    <NavigationContainer>",
  "export default function AppNavigator() {\n  const { user, loading } = useAuth();\n  if (loading) return null;\n  return (\n    <SafeAreaProvider>\n    <NavigationContainer>"
);

c = c.replace(
  "      {user ? <AppStack /> : <AuthStack />}\n    </NavigationContainer>\n  );\n}",
  "      {user ? <AppStack /> : <AuthStack />}\n    </NavigationContainer>\n    </SafeAreaProvider>\n  );\n}"
);

fs.writeFileSync('src/navigation/AppNavigator.js', c, 'utf8');
console.log('Added safe-area-aware tab bar');
