const fs = require('fs');
let c = fs.readFileSync('src/navigation/AppNavigator.js', 'utf8');

const before = c;

c = c.replace(
  `    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="ðŸ‘¤" label="Profile" focused={focused} /> }} />
  </Tab.Navigator>
);`,
  `    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="ðŸ‘¤" label="Profile" focused={focused} /> }} />
  </Tab.Navigator>
  );
};`
);

if (c === before) {
  console.log('NO MATCH - pattern not found, need manual inspection');
} else {
  fs.writeFileSync('src/navigation/AppNavigator.js', c, 'utf8');
  console.log('Fixed: closed HomeTabs function correctly');
}
