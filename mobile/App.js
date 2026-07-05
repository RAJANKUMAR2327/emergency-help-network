import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { EmergencyProvider } from './src/context/EmergencyContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import client from './src/api/client';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Inner component so it can access AuthContext for the 401 logout callback
function AppInner() {
  const { logout } = useAuth();
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    // Wire the 401 interceptor logout to AuthContext's logout
    client._onUnauthorized = logout;

    // Request notification permissions
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
    })();

    // Listen for notifications received while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener((_notification) => {
      // Optionally handle foreground notification here (e.g. show in-app banner)
    });

    // Listen for user tapping a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((_response) => {
      // Navigate to relevant screen based on notification data if needed
    });

    return () => {
      client._onUnauthorized = null;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [logout]);

  return <AppNavigator />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <EmergencyProvider>
          <AppInner />
        </EmergencyProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
