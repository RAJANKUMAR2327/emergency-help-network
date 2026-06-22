import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { EmergencyProvider } from './src/context/EmergencyContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <EmergencyProvider>
        <AppNavigator />
      </EmergencyProvider>
    </AuthProvider>
  );
}