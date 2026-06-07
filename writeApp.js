const fs = require('fs');
const path = require('path');

const files = {};

// API CLIENT
files['src/api/client.js'] = `
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://YOUR_PC_IP:5000/api';

const client = axios.create({ baseURL: API_URL, timeout: 10000 });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  getMe: () => client.get('/auth/me'),
  updateLocation: (data) => client.put('/auth/location', data),
  updateFCMToken: (data) => client.put('/auth/fcm-token', data),
};

export const emergencyAPI = {
  trigger: (data) => client.post('/emergency/trigger', data),
  getActive: (params) => client.get('/emergency/active', { params }),
  getOne: (id) => client.get('/emergency/' + id),
  accept: (id) => client.post('/emergency/' + id + '/accept'),
  resolve: (id) => client.put('/emergency/' + id + '/resolve'),
  cancel: (id) => client.put('/emergency/' + id + '/cancel'),
  updateLocation: (id, data) => client.put('/emergency/' + id + '/location', data),
};

export const notificationAPI = {
  getContacts: () => client.get('/notifications/contacts'),
  addContact: (data) => client.post('/notifications/contacts', data),
  deleteContact: (id) => client.delete('/notifications/contacts/' + id),
  sendTest: (data) => client.post('/notifications/test', data),
};

export default client;
`;

// AUTH CONTEXT
files['src/context/AuthContext.js'] = `
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.log('Auth load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    const res = await authAPI.login({ phone, password });
    const { token: t, data: u } = res.data;
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { token: t, data: u } = res.data;
    await AsyncStorage.setItem('token', t);
    await AsyncStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
`;

// EMERGENCY CONTEXT
files['src/context/EmergencyContext.js'] = `
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const EmergencyContext = createContext(null);

export const EmergencyProvider = ({ children }) => {
  const { token } = useAuth();
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [nearbyEmergencies, setNearbyEmergencies] = useState([]);
  const [responders, setResponders] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    const socket = io('http://YOUR_PC_IP:5000', { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => console.log('Socket connected'));
    socket.on('new_emergency', (data) => {
      setNearbyEmergencies((prev) => [data, ...prev.slice(0, 9)]);
    });
    socket.on('disconnect', () => console.log('Socket disconnected'));

    return () => socket.disconnect();
  }, [token]);

  const joinEmergencyRoom = (emergencyId) => {
    socketRef.current?.emit('join_emergency_room', emergencyId);
    socketRef.current?.on('responder_moved', (data) => {
      setResponders((prev) => {
        const existing = prev.findIndex((r) => r.userId === data.userId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });
    });
    socketRef.current?.on('emergency_resolved', () => setActiveEmergency(null));
  };

  return (
    <EmergencyContext.Provider value={{ activeEmergency, setActiveEmergency, nearbyEmergencies, responders, joinEmergencyRoom }}>
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => useContext(EmergencyContext);
`;

// EMERGENCY BUTTON COMPONENT
files['src/components/EmergencyButton.js'] = `
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Alert, Vibration } from 'react-native';

const EmergencyButton = ({ onPress, disabled }) => {
  const [pressing, setPressing] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const countRef = useRef(null);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    if (disabled) return;
    setPressing(true);
    setCountdown(3);
    Vibration.vibrate(100);
    Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true }).start();

    let count = 3;
    countRef.current = setInterval(() => {
      count -= 1;
      setCountdown(count);
      Vibration.vibrate(50);
      if (count <= 0) {
        clearInterval(countRef.current);
      }
    }, 1000);

    timerRef.current = setTimeout(() => {
      handleTrigger();
    }, 3000);
  };

  const handlePressOut = () => {
    if (!pressing) return;
    setPressing(false);
    setCountdown(3);
    clearTimeout(timerRef.current);
    clearInterval(countRef.current);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleTrigger = () => {
    setPressing(false);
    Vibration.vibrate([0, 200, 100, 200]);
    onPress();
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.outerRing, { transform: [{ scale: pulseAnim }] }]}>
        <Animated.View style={[styles.innerRing, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            style={[styles.button, pressing && styles.buttonPressed, disabled && styles.buttonDisabled]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
            disabled={disabled}
          >
            <Text style={styles.sos}>SOS</Text>
            {pressing ? (
              <Text style={styles.countdownText}>{countdown}</Text>
            ) : (
              <Text style={styles.holdText}>Hold 3 sec</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  outerRing: { width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(220,38,38,0.15)', alignItems: 'center', justifyContent: 'center' },
  innerRing: { width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(220,38,38,0.25)', alignItems: 'center', justifyContent: 'center' },
  button: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#DC2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8 },
  buttonPressed: { backgroundColor: '#991B1B' },
  buttonDisabled: { backgroundColor: '#9CA3AF' },
  sos: { fontSize: 42, fontWeight: 'bold', color: '#fff', letterSpacing: 4 },
  countdownText: { fontSize: 28, color: '#fff', fontWeight: 'bold', marginTop: 4 },
  holdText: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
});

export default EmergencyButton;
`;

// EMERGENCY CARD COMPONENT
files['src/components/EmergencyCard.js'] = `
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const typeColors = { medical: '#DC2626', accident: '#EA580C', fire: '#D97706', crime: '#7C3AED', natural_disaster: '#0284C7', other: '#4B5563' };
const typeIcons = { medical: '🚑', accident: '🚗', fire: '🔥', crime: '🚨', natural_disaster: '⚠️', other: '🆘' };

const EmergencyCard = ({ emergency, onAccept, onPress }) => {
  const color = typeColors[emergency.type] || '#4B5563';
  const icon = typeIcons[emergency.type] || '🆘';
  const time = new Date(emergency.createdAt).toLocaleTimeString();

  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.info}>
          <Text style={styles.type}>{emergency.type.replace('_', ' ').toUpperCase()}</Text>
          <Text style={styles.severity}>{emergency.severity?.toUpperCase()} • {time}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{emergency.status}</Text>
        </View>
      </View>
      {emergency.location?.address && (
        <Text style={styles.address}>📍 {emergency.location.address}</Text>
      )}
      {emergency.reporter && (
        <Text style={styles.reporter}>👤 {emergency.reporter.name} • {emergency.reporter.phone}</Text>
      )}
      {onAccept && emergency.status === 'active' && (
        <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: color }]} onPress={onAccept}>
          <Text style={styles.acceptText}>✋ I Can Help</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { fontSize: 28, marginRight: 10 },
  info: { flex: 1 },
  type: { fontSize: 14, fontWeight: 'bold', color: '#111' },
  severity: { fontSize: 12, color: '#666', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  address: { fontSize: 13, color: '#444', marginBottom: 4 },
  reporter: { fontSize: 12, color: '#666', marginBottom: 8 },
  acceptBtn: { borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 },
  acceptText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});

export default EmergencyCard;
`;

// LOGIN SCREEN
files['src/screens/LoginScreen.js'] = `
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) return Alert.alert('Error', 'Phone and password required');
    setLoading(true);
    try {
      await login(phone, password);
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text style={styles.logo}>🆘</Text>
        <Text style={styles.title}>Emergency Help Network</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <TextInput style={styles.input} placeholder="Phone number (+91XXXXXXXXXX)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#666', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14, backgroundColor: '#f9f9f9' },
  button: { backgroundColor: '#DC2626', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#DC2626', fontSize: 14 },
});
`;

// REGISTER SCREEN
files['src/screens/RegisterScreen.js'] = `
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', bloodGroup: '' });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.password) return Alert.alert('Error', 'Name, phone and password are required');
    setLoading(true);
    try {
      await register(form);
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the emergency help network</Text>

        <TextInput style={styles.input} placeholder="Full name" value={form.name} onChangeText={(v) => update('name', v)} />
        <TextInput style={styles.input} placeholder="Phone (+91XXXXXXXXXX)" value={form.phone} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Email (optional)" value={form.email} onChangeText={(v) => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password (min 6 chars)" value={form.password} onChangeText={(v) => update('password', v)} secureTextEntry />

        <Text style={styles.label}>Blood Group (optional)</Text>
        <View style={styles.bloodRow}>
          {bloodGroups.map((bg) => (
            <TouchableOpacity key={bg} style={[styles.bloodBtn, form.bloodGroup === bg && styles.bloodBtnActive]} onPress={() => update('bloodGroup', bg)}>
              <Text style={[styles.bloodText, form.bloodGroup === bg && styles.bloodTextActive]}>{bg}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 28 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14, backgroundColor: '#f9f9f9' },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 10 },
  bloodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  bloodBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  bloodBtnActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  bloodText: { color: '#333', fontWeight: '500' },
  bloodTextActive: { color: '#fff' },
  button: { backgroundColor: '#DC2626', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#DC2626', fontSize: 14 },
});
`;

// HOME SCREEN
files['src/screens/HomeScreen.js'] = `
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import EmergencyButton from '../components/EmergencyButton';
import EmergencyCard from '../components/EmergencyCard';
import { emergencyAPI, authAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useEmergency } from '../context/EmergencyContext';

const EMERGENCY_TYPES = [
  { key: 'medical', label: 'Medical', icon: '🚑' },
  { key: 'accident', label: 'Accident', icon: '🚗' },
  { key: 'fire', label: 'Fire', icon: '🔥' },
  { key: 'crime', label: 'Crime', icon: '🚨' },
];

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { nearbyEmergencies } = useEmergency();
  const [selectedType, setSelectedType] = useState('medical');
  const [location, setLocation] = useState(null);
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    getLocation();
    fetchActiveEmergencies();
  }, []);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Location access is required for emergency features');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocation(loc.coords);
    await authAPI.updateLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
  };

  const fetchActiveEmergencies = async () => {
    try {
      const res = await emergencyAPI.getActive();
      setActiveEmergencies(res.data.data || []);
    } catch (e) {
      console.log('Fetch emergencies error:', e.message);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActiveEmergencies();
    setRefreshing(false);
  }, []);

  const handleEmergency = async () => {
    if (!location) {
      Alert.alert('No location', 'Getting your location...');
      await getLocation();
      return;
    }
    setTriggering(true);
    try {
      const res = await emergencyAPI.trigger({
        type: selectedType,
        severity: 'critical',
        longitude: location.longitude,
        latitude: location.latitude,
        address: 'Getting address...',
      });
      Alert.alert('🆘 Emergency Triggered!', 'Help is on the way. ' + res.data.notifiedHelpers + ' helpers notified nearby.', [
        { text: 'Track on Map', onPress: () => navigation.navigate('Map', { emergencyId: res.data.data._id }) },
        { text: 'OK' },
      ]);
      fetchActiveEmergencies();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to trigger emergency');
    } finally {
      setTriggering(false);
    }
  };

  const handleAccept = async (emergencyId) => {
    try {
      await emergencyAPI.accept(emergencyId);
      Alert.alert('Accepted!', 'Navigate to the victim location', [
        { text: 'Open Map', onPress: () => navigation.navigate('Map', { emergencyId }) },
        { text: 'OK' },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not accept');
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subGreeting}>{location ? '📍 Location active' : '📍 Getting location...'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonSection}>
        <Text style={styles.sectionTitle}>Emergency Type</Text>
        <View style={styles.typeRow}>
          {EMERGENCY_TYPES.map((t) => (
            <TouchableOpacity key={t.key} style={[styles.typeBtn, selectedType === t.key && styles.typeBtnActive]} onPress={() => setSelectedType(t.key)}>
              <Text style={styles.typeIcon}>{t.icon}</Text>
              <Text style={[styles.typeLabel, selectedType === t.key && styles.typeLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <EmergencyButton onPress={handleEmergency} disabled={triggering} />
        <Text style={styles.hint}>Hold the button for 3 seconds to trigger emergency</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby Emergencies ({activeEmergencies.length})</Text>
        {activeEmergencies.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>No active emergencies nearby</Text>
          </View>
        ) : (
          activeEmergencies.map((e) => (
            <EmergencyCard key={e._id} emergency={e} onAccept={() => handleAccept(e._id)} onPress={() => navigation.navigate('Map', { emergencyId: e._id })} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 52, backgroundColor: '#fff' },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  subGreeting: { fontSize: 13, color: '#666', marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#DC2626', fontWeight: '500' },
  buttonSection: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20, alignItems: 'center', elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 12, alignSelf: 'flex-start' },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' },
  typeBtn: { alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', minWidth: 70, backgroundColor: '#f9f9f9' },
  typeBtnActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  typeIcon: { fontSize: 22 },
  typeLabel: { fontSize: 11, color: '#666', marginTop: 4, fontWeight: '500' },
  typeLabelActive: { color: '#fff' },
  hint: { fontSize: 12, color: '#999', marginTop: 16, textAlign: 'center' },
  section: { margin: 16 },
  empty: { alignItems: 'center', padding: 32, backgroundColor: '#fff', borderRadius: 12 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: '#666', fontSize: 14 },
});
`;

// MAP SCREEN
files['src/screens/MapScreen.js'] = `
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { emergencyAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function MapScreen({ route, navigation }) {
  const { emergencyId } = route.params || {};
  const { user } = useAuth();
  const [emergency, setEmergency] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (emergencyId) {
      fetchEmergency();
      startLocationTracking();
    }
  }, [emergencyId]);

  const fetchEmergency = async () => {
    try {
      const res = await emergencyAPI.getOne(emergencyId);
      setEmergency(res.data.data);
    } catch (e) {
      Alert.alert('Error', 'Could not load emergency details');
    }
  };

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 }, async (loc) => {
      setMyLocation(loc.coords);
      try {
        await emergencyAPI.updateLocation(emergencyId, { latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch (e) {}
    });
  };

  const victimCoords = emergency?.location?.coordinates
    ? { latitude: emergency.location.coordinates[1], longitude: emergency.location.coordinates[0] }
    : null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={victimCoords ? { ...victimCoords, latitudeDelta: 0.01, longitudeDelta: 0.01 } : { latitude: 25.5941, longitude: 85.1376, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        showsUserLocation
        showsMyLocationButton
      >
        {victimCoords && (
          <Marker coordinate={victimCoords} title="Victim Location" description={emergency?.reporter?.name} pinColor="red">
            <Text style={{ fontSize: 32 }}>🆘</Text>
          </Marker>
        )}
        {emergency?.responders?.map((r, i) => r.currentLocation?.coordinates && (
          <Marker key={i} coordinate={{ latitude: r.currentLocation.coordinates[1], longitude: r.currentLocation.coordinates[0] }} title={r.user?.name || 'Helper'} pinColor="blue">
            <Text style={{ fontSize: 24 }}>🏃</Text>
          </Marker>
        ))}
      </MapView>

      <View style={styles.infoCard}>
        {emergency ? (
          <>
            <Text style={styles.emergencyType}>{emergency.type?.toUpperCase().replace('_', ' ')} • {emergency.status?.toUpperCase()}</Text>
            <Text style={styles.reporter}>👤 {emergency.reporter?.name} • {emergency.reporter?.phone}</Text>
            {emergency.reporter?.bloodGroup && <Text style={styles.blood}>🩸 Blood: {emergency.reporter.bloodGroup}</Text>}
            <Text style={styles.responders}>👥 {emergency.responders?.length || 0} helper(s) responding</Text>
          </>
        ) : (
          <Text style={styles.loading}>Loading emergency details...</Text>
        )}
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  infoCard: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10 },
  emergencyType: { fontSize: 18, fontWeight: 'bold', color: '#DC2626', marginBottom: 6 },
  reporter: { fontSize: 14, color: '#333', marginBottom: 4 },
  blood: { fontSize: 14, color: '#DC2626', marginBottom: 4 },
  responders: { fontSize: 13, color: '#666' },
  loading: { textAlign: 'center', color: '#666' },
  backBtn: { position: 'absolute', top: 48, left: 16, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, elevation: 4 },
  backText: { fontWeight: 'bold', color: '#111' },
});
`;

// CONTACTS SCREEN
files['src/screens/ContactsScreen.js'] = `
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Switch, ActivityIndicator } from 'react-native';
import { notificationAPI } from '../api/client';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', relationship: '', notifyViaSMS: true, notifyViaWhatsApp: true, notifyViaCall: false });

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try {
      const res = await notificationAPI.getContacts();
      setContacts(res.data.data || []);
    } catch (e) { Alert.alert('Error', 'Could not load contacts'); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.name || !form.phone) return Alert.alert('Error', 'Name and phone required');
    setAdding(true);
    try {
      await notificationAPI.addContact(form);
      setForm({ name: '', phone: '', relationship: '', notifyViaSMS: true, notifyViaWhatsApp: true, notifyViaCall: false });
      fetchContacts();
      Alert.alert('Added!', form.name + ' added as emergency contact');
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Could not add contact'); }
    finally { setAdding(false); }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Remove Contact', 'Remove ' + name + '?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await notificationAPI.deleteContact(id);
        fetchContacts();
      }},
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#DC2626" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={styles.subtitle}>These people will be notified immediately when you trigger an emergency.</Text>

      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />
        <TextInput style={styles.input} placeholder="Phone (+91XXXXXXXXXX)" value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Relationship (e.g. Mother)" value={form.relationship} onChangeText={(v) => setForm((p) => ({ ...p, relationship: v }))} />
        <View style={styles.switches}>
          <View style={styles.switchRow}><Text style={styles.switchLabel}>SMS</Text><Switch value={form.notifyViaSMS} onValueChange={(v) => setForm((p) => ({ ...p, notifyViaSMS: v }))} trackColor={{ true: '#DC2626' }} /></View>
          <View style={styles.switchRow}><Text style={styles.switchLabel}>WhatsApp</Text><Switch value={form.notifyViaWhatsApp} onValueChange={(v) => setForm((p) => ({ ...p, notifyViaWhatsApp: v }))} trackColor={{ true: '#25D366' }} /></View>
          <View style={styles.switchRow}><Text style={styles.switchLabel}>Call</Text><Switch value={form.notifyViaCall} onValueChange={(v) => setForm((p) => ({ ...p, notifyViaCall: v }))} trackColor={{ true: '#3B82F6' }} /></View>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={adding}>
          {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>+ Add Contact</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactPhone}>{item.phone} {item.relationship ? '• ' + item.relationship : ''}</Text>
              <Text style={styles.contactChannels}>
                {item.notifyViaSMS ? '📱 SMS ' : ''}{item.notifyViaWhatsApp ? '💬 WhatsApp ' : ''}{item.notifyViaCall ? '📞 Call' : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item._id, item.name)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No emergency contacts yet. Add up to 5 contacts above.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111', marginTop: 32, marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 20 },
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 14, backgroundColor: '#f9f9f9' },
  switches: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  switchRow: { alignItems: 'center', gap: 4 },
  switchLabel: { fontSize: 12, color: '#555' },
  addBtn: { backgroundColor: '#DC2626', borderRadius: 8, padding: 12, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  contactCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  contactPhone: { fontSize: 13, color: '#555', marginTop: 2 },
  contactChannels: { fontSize: 11, color: '#888', marginTop: 4 },
  deleteBtn: { padding: 8 },
  deleteText: { color: '#DC2626', fontSize: 16, fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#888', padding: 24 },
});
`;

// PROFILE SCREEN
files['src/screens/ProfileScreen.js'] = `
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const items = [
    { label: 'Name', value: user?.name },
    { label: 'Phone', value: user?.phone },
    { label: 'Email', value: user?.email || 'Not set' },
    { label: 'Blood Group', value: user?.bloodGroup || 'Not set' },
    { label: 'Role', value: user?.role },
    { label: 'Emergencies Reported', value: String(user?.stats?.emergenciesReported || 0) },
    { label: 'Help Provided', value: String(user?.stats?.helpProvided || 0) },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
      </View>

      <View style={styles.card}>
        {items.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.contactsBtn} onPress={() => navigation.navigate('Contacts')}>
        <Text style={styles.contactsBtnText}>👥 Manage Emergency Contacts</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#DC2626', alignItems: 'center', padding: 32, paddingTop: 60 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  phone: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, fontWeight: '500', color: '#111' },
  contactsBtn: { backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  contactsBtnText: { fontSize: 15, fontWeight: '500', color: '#DC2626' },
  logoutBtn: { margin: 16, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#DC2626' },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: 'bold' },
});
`;

// NAVIGATOR
files['src/navigation/AppNavigator.js'] = `
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

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

const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused }) => {
        const icons = { Home: '🏠', Contacts: '👥', Profile: '👤' };
        return <Text style={{ fontSize: focused ? 22 : 18 }}>{icons[route.name]}</Text>;
      },
      tabBarActiveTintColor: '#DC2626',
      tabBarInactiveTintColor: '#999',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Contacts" component={ContactsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs" component={HomeTabs} />
    <Stack.Screen name="Map" component={MapScreen} />
    <Stack.Screen name="Contacts" component={ContactsScreen} />
  </Stack.Navigator>
);

export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
`;

// APP.JS
files['App.js'] = `
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
`;

// Write all files
let count = 0;
for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  const size = fs.statSync(fullPath).size;
  console.log('Written:', filePath, '(' + size + ' bytes)');
  count++;
}
console.log('\nAll ' + count + ' files written successfully!');
console.log('Next: update YOUR_PC_IP in src/api/client.js and src/context/EmergencyContext.js');
console.log('Find your IP with: ipconfig');