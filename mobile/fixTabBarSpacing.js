const fs = require('fs');
let c = fs.readFileSync('src/navigation/AppNavigator.js', 'utf8');

c = c.replace(
  "tabBarStyle: { height: 60 + insets.bottom, paddingBottom: insets.bottom + 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: colors.gray200, backgroundColor: colors.white },",
  "tabBarStyle: { height: 64 + insets.bottom, paddingBottom: insets.bottom, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: colors.gray200, backgroundColor: colors.white },"
);

c = c.replace(
  "iconWrapper: { alignItems: 'center', paddingTop: 6, paddingHorizontal: 12, borderRadius: 12 },",
  "iconWrapper: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, minHeight: 48 },"
);

c = c.replace(
  "icon: { fontSize: 20, marginBottom: 2 },",
  "icon: { fontSize: 22, marginBottom: 3, lineHeight: 26 },"
);

c = c.replace(
  "label: { fontSize: 10, color: colors.gray500 },",
  "label: { fontSize: 10, color: colors.gray500, lineHeight: 12 },"
);

fs.writeFileSync('src/navigation/AppNavigator.js', c, 'utf8');
console.log('Increased tab bar height and fixed content spacing');
