import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
const { colors } = require('../theme');

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import ContactsScreen from '../screens/ContactsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const TabIcon = ({ icon, label, focused }) => (
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
});

const HomeTabs = () => {
  const insets = useSafeAreaInsets();
  return (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { paddingBottom: insets.bottom, borderTopWidth: 0.5, borderTopColor: colors.gray200, backgroundColor: colors.white },
      tabBarShowLabel: true,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.gray500,
      tabBarLabelStyle: { fontSize: 11, marginBottom: 4 },
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
    <Tab.Screen name="Contacts" component={ContactsScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
  </Tab.Navigator>
);
};

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs" component={HomeTabs} />
    <Stack.Screen name="Map" component={MapScreen} options={{ presentation: 'modal' }} />
    <Stack.Screen name="Contacts" component={ContactsScreen} />
  </Stack.Navigator>
);

export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <SafeAreaProvider>
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
    </SafeAreaProvider>
  );
}