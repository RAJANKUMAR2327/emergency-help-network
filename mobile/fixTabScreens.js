const fs = require('fs');
let c = fs.readFileSync('src/navigation/AppNavigator.js', 'utf8');

const screens = [
  [
    `<Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} /> }} />`,
    `<Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />`
  ],
  [
    `<Tab.Screen name="Contacts" component={ContactsScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👥" label="Contacts" focused={focused} /> }} />`,
    `<Tab.Screen name="Contacts" component={ContactsScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }} />`
  ],
  [
    `<Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} /> }} />`,
    `<Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />`
  ],
];

screens.forEach(([from, to]) => {
  if (c.includes(from)) {
    c = c.replace(from, to);
    console.log('Replaced:', from.substring(0, 50));
  } else {
    console.log('NO MATCH:', from.substring(0, 50));
  }
});

fs.writeFileSync('src/navigation/AppNavigator.js', c, 'utf8');
console.log('Done');
