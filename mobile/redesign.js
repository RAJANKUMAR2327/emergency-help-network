const fs = require('fs');
const path = require('path');
const files = {};

// THEME COLORS
files['src/theme.js'] = `
export const colors = {
  primary: '#DC2626',
  primaryDark: '#991B1B',
  primaryLight: '#FEE2E2',
  secondary: '#1F2937',
  accent: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
};

export const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  red: { shadowColor: '#DC2626', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
};
`;

// REDESIGNED LOGIN SCREEN
files['src/screens/LoginScreen.js'] = `
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, shadows } from '../theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) return Alert.alert('Missing Info', 'Please enter phone and password');
    setLoading(true);
    try {
      await login(phone, password);
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🆘</Text>
        </View>
        <Text style={styles.appName}>Emergency Help Network</Text>
        <Text style={styles.tagline}>Your safety, our priority</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.welcomeText}>Welcome back</Text>
        <Text style={styles.subText}>Sign in to continue</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📱</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 XXXXX XXXXX"
              placeholderTextColor={colors.gray400}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={colors.gray400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.loginBtn, loading && styles.loginBtnDisabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.loginBtnText}>Sign In →</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLinkText}>Don't have an account? <Text style={styles.registerLinkBold}>Register now</Text></Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>🛡️ Your data is encrypted and secure</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 32 },
  logoContainer: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoEmoji: { fontSize: 40 },
  appName: { fontSize: 24, fontWeight: 'bold', color: colors.white, textAlign: 'center' },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, ...shadows.lg },
  welcomeText: { fontSize: 26, fontWeight: 'bold', color: colors.gray900, marginBottom: 4 },
  subText: { fontSize: 14, color: colors.gray500, marginBottom: 28 },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.gray700, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 12, paddingHorizontal: 14, backgroundColor: colors.gray50 },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.gray900 },
  eyeIcon: { fontSize: 16, padding: 4 },
  loginBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, ...shadows.red },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerLinkText: { fontSize: 14, color: colors.gray500 },
  registerLinkBold: { color: colors.primary, fontWeight: '600' },
  footer: { paddingBottom: 20, alignItems: 'center', backgroundColor: colors.white },
  footerText: { fontSize: 12, color: colors.gray400 },
});
`;

// REDESIGNED HOME SCREEN
files['src/screens/HomeScreen.js'] = `
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import EmergencyButton from '../components/EmergencyButton';
import EmergencyCard from '../components/EmergencyCard';
import { emergencyAPI, authAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useEmergency } from '../context/EmergencyContext';
import { colors, shadows } from '../theme';

const { width } = Dimensions.get('window');

const EMERGENCY_TYPES = [
  { key: 'medical', label: 'Medical', icon: '🚑', color: '#DC2626' },
  { key: 'accident', label: 'Accident', icon: '🚗', color: '#EA580C' },
  { key: 'fire', label: 'Fire', icon: '🔥', color: '#D97706' },
  { key: 'crime', label: 'Crime', icon: '🚨', color: '#7C3AED' },
];

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { nearbyEmergencies } = useEmergency();
  const [selectedType, setSelectedType] = useState('medical');
  const [location, setLocation] = useState(null);
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => { getLocation(); fetchActiveEmergencies(); }, []);

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocation(loc.coords);
    await authAPI.updateLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
  };

  const fetchActiveEmergencies = async () => {
    try {
      const res = await emergencyAPI.getActive();
      setActiveEmergencies(res.data.data || []);
    } catch (e) { console.log(e.message); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActiveEmergencies();
    setRefreshing(false);
  }, []);

  const handleEmergency = async () => {
    if (!location) { await getLocation(); return; }
    setTriggering(true);
    try {
      const res = await emergencyAPI.trigger({
        type: selectedType, severity: 'critical',
        longitude: location.longitude, latitude: location.latitude,
        address: 'Getting address...',
      });
      Alert.alert('🆘 Emergency Triggered!', res.data.notifiedHelpers + ' helpers notified nearby.\n\nStay calm. Help is on the way.', [
        { text: 'Track on Map', onPress: () => navigation.navigate('Map', { emergencyId: res.data.data._id }) },
        { text: 'OK' },
      ]);
      fetchActiveEmergencies();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to trigger emergency');
    } finally { setTriggering(false); }
  };

  const handleAccept = async (emergencyId) => {
    try {
      await emergencyAPI.accept(emergencyId);
      navigation.navigate('Map', { emergencyId });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not accept');
    }
  };

  const selectedTypeData = EMERGENCY_TYPES.find(t => t.key === selectedType);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationDot}>{location ? '🟢' : '🔴'}</Text>
            <Text style={styles.locationText}>{location ? 'Location active' : 'Getting location...'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileInitial}>{user?.name?.[0]?.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.emergencyCard}>
          <Text style={styles.cardTitle}>Emergency Type</Text>
          <View style={styles.typeGrid}>
            {EMERGENCY_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeBtn, selectedType === t.key && { backgroundColor: t.color, ...shadows.md }]}
                onPress={() => setSelectedType(t.key)}
              >
                <Text style={styles.typeIcon}>{t.icon}</Text>
                <Text style={[styles.typeLabel, selectedType === t.key && styles.typeLabelActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonArea}>
            <EmergencyButton onPress={handleEmergency} disabled={triggering} />
          </View>

          <View style={[styles.selectedBadge, { backgroundColor: selectedTypeData?.color + '20' }]}>
            <Text style={[styles.selectedBadgeText, { color: selectedTypeData?.color }]}>
              {selectedTypeData?.icon} {selectedTypeData?.label} emergency selected • Hold 3 seconds to trigger
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
            <Text style={styles.statNumber}>{activeEmergencies.length}</Text>
            <Text style={styles.statLabel}>Active nearby</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
            <Text style={styles.statNumber}>{user?.stats?.helpProvided || 0}</Text>
            <Text style={styles.statLabel}>Help provided</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.info }]}>
            <Text style={styles.statNumber}>{user?.stats?.emergenciesReported || 0}</Text>
            <Text style={styles.statLabel}>Reported</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Emergencies</Text>
            <View style={[styles.countBadge, activeEmergencies.length > 0 && styles.countBadgeActive]}>
              <Text style={styles.countBadgeText}>{activeEmergencies.length}</Text>
            </View>
          </View>

          {activeEmergencies.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>All clear!</Text>
              <Text style={styles.emptyText}>No active emergencies in your area</Text>
            </View>
          ) : (
            activeEmergencies.map((e) => (
              <EmergencyCard
                key={e._id}
                emergency={e}
                onAccept={() => handleAccept(e._id)}
                onPress={() => navigation.navigate('Map', { emergencyId: e._id })}
              />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20 },
  greeting: { fontSize: 20, fontWeight: 'bold', color: colors.white },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationDot: { fontSize: 10, marginRight: 4 },
  locationText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  profileBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  profileInitial: { fontSize: 18, fontWeight: 'bold', color: colors.white },
  scroll: { flex: 1 },
  emergencyCard: { backgroundColor: colors.white, margin: 16, borderRadius: 20, padding: 20, ...shadows.md },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.gray700, marginBottom: 14 },
  typeGrid: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  typeBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray200 },
  typeIcon: { fontSize: 22, marginBottom: 4 },
  typeLabel: { fontSize: 11, color: colors.gray600, fontWeight: '500' },
  typeLabelActive: { color: colors.white },
  buttonArea: { alignItems: 'center', marginBottom: 16 },
  selectedBadge: { borderRadius: 10, padding: 10, alignItems: 'center' },
  selectedBadgeText: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 14, borderLeftWidth: 3, ...shadows.sm },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: colors.gray900 },
  statLabel: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  section: { marginHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: colors.gray900, flex: 1 },
  countBadge: { backgroundColor: colors.gray200, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeActive: { backgroundColor: colors.primaryLight },
  countBadgeText: { fontSize: 12, fontWeight: 'bold', color: colors.gray700 },
  emptyCard: { backgroundColor: colors.white, borderRadius: 16, padding: 32, alignItems: 'center', ...shadows.sm },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: colors.gray800, marginBottom: 4 },
  emptyText: { fontSize: 13, color: colors.gray500, textAlign: 'center' },
});
`;

// REDESIGNED EMERGENCY CARD
files['src/components/EmergencyCard.js'] = `
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, shadows } from '../theme';

const typeConfig = {
  medical: { color: '#DC2626', bg: '#FEE2E2', icon: '🚑', label: 'Medical' },
  accident: { color: '#EA580C', bg: '#FED7AA', icon: '🚗', label: 'Accident' },
  fire: { color: '#D97706', bg: '#FEF3C7', icon: '🔥', label: 'Fire' },
  crime: { color: '#7C3AED', bg: '#EDE9FE', icon: '🚨', label: 'Crime' },
  natural_disaster: { color: '#0284C7', bg: '#E0F2FE', icon: '⚠️', label: 'Disaster' },
  other: { color: '#4B5563', bg: '#F3F4F6', icon: '🆘', label: 'Emergency' },
};

const severityConfig = {
  critical: { color: '#DC2626', label: 'CRITICAL' },
  high: { color: '#EA580C', label: 'HIGH' },
  medium: { color: '#D97706', label: 'MEDIUM' },
  low: { color: '#10B981', label: 'LOW' },
};

export default function EmergencyCard({ emergency, onAccept, onPress }) {
  const type = typeConfig[emergency.type] || typeConfig.other;
  const severity = severityConfig[emergency.severity] || severityConfig.high;
  const timeAgo = Math.floor((Date.now() - new Date(emergency.createdAt)) / 60000);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <View style={[styles.typeStrip, { backgroundColor: type.bg }]}>
        <Text style={styles.typeIcon}>{type.icon}</Text>
        <View style={styles.typeInfo}>
          <Text style={[styles.typeLabel, { color: type.color }]}>{type.label}</Text>
          <Text style={styles.timeAgo}>{timeAgo < 1 ? 'Just now' : timeAgo + 'm ago'}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: severity.color }]}>
          <Text style={styles.severityText}>{severity.label}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {emergency.location?.address && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText} numberOfLines={1}>{emergency.location.address}</Text>
          </View>
        )}
        {emergency.reporter && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>👤</Text>
            <Text style={styles.infoText}>{emergency.reporter.name} • {emergency.reporter.phone}</Text>
          </View>
        )}
        {emergency.reporter?.bloodGroup && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🩸</Text>
            <Text style={[styles.infoText, { color: colors.primary, fontWeight: '600' }]}>Blood Group: {emergency.reporter.bloodGroup}</Text>
          </View>
        )}
        <View style={styles.footer}>
          <View style={styles.responderInfo}>
            <Text style={styles.responderCount}>👥 {emergency.responders?.length || 0} responding</Text>
            <View style={[styles.statusDot, { backgroundColor: emergency.status === 'active' ? colors.primary : colors.success }]} />
            <Text style={styles.statusText}>{emergency.status}</Text>
          </View>
          {onAccept && emergency.status === 'active' && (
            <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: type.color }]} onPress={onAccept}>
              <Text style={styles.acceptText}>✋ Help</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 16, marginBottom: 12, overflow: 'hidden', ...shadows.md },
  typeStrip: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 14 },
  typeIcon: { fontSize: 26, marginRight: 10 },
  typeInfo: { flex: 1 },
  typeLabel: { fontSize: 14, fontWeight: 'bold' },
  timeAgo: { fontSize: 11, color: colors.gray500, marginTop: 1 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  severityText: { color: colors.white, fontSize: 10, fontWeight: 'bold' },
  body: { padding: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoIcon: { fontSize: 13, marginRight: 6, width: 18 },
  infoText: { fontSize: 13, color: colors.gray600, flex: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.gray100 },
  responderInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  responderCount: { fontSize: 12, color: colors.gray500 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, color: colors.gray500 },
  acceptBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  acceptText: { color: colors.white, fontWeight: 'bold', fontSize: 13 },
});
`;

// REDESIGNED PROFILE SCREEN
files['src/screens/ProfileScreen.js'] = `
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, shadows } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const infoItems = [
    { icon: '📱', label: 'Phone', value: user?.phone },
    { icon: '📧', label: 'Email', value: user?.email || 'Not set' },
    { icon: '🩸', label: 'Blood Group', value: user?.bloodGroup || 'Not set' },
    { icon: '👤', label: 'Role', value: user?.role?.toUpperCase() },
  ];

  const statsItems = [
    { icon: '🆘', label: 'Emergencies Reported', value: user?.stats?.emergenciesReported || 0, color: colors.primary },
    { icon: '✋', label: 'Help Provided', value: user?.stats?.helpProvided || 0, color: colors.success },
    { icon: '⭐', label: 'Average Rating', value: (user?.stats?.averageRating || 5) + '/5', color: colors.accent },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        {user?.bloodGroup && (
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodText}>🩸 {user.bloodGroup}</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        {statsItems.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Info</Text>
        <View style={styles.infoCard}>
          {infoItems.map((item, i) => (
            <View key={item.label} style={[styles.infoRow, i < infoItems.length - 1 && styles.infoRowBorder]}>
              <Text style={styles.infoIcon}>{item.icon}</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Contacts')}>
          <Text style={styles.actionIcon}>👥</Text>
          <Text style={styles.actionText}>Manage Emergency Contacts</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  header: { backgroundColor: colors.primary, alignItems: 'center', paddingTop: 60, paddingBottom: 32, paddingHorizontal: 20 },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: colors.white },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.white, marginBottom: 4 },
  phone: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  bloodBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  bloodText: { color: colors.white, fontWeight: '600', fontSize: 13 },
  statsRow: { flexDirection: 'row', margin: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 14, alignItems: 'center', ...shadows.sm },
  statIcon: { fontSize: 20, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  statLabel: { fontSize: 10, color: colors.gray500, textAlign: 'center' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.gray800, marginBottom: 10 },
  infoCard: { backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden', ...shadows.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  infoIcon: { fontSize: 18, marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: colors.gray500, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '500', color: colors.gray900 },
  actionBtn: { backgroundColor: colors.white, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', ...shadows.sm },
  actionIcon: { fontSize: 20, marginRight: 12 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.gray800 },
  actionArrow: { fontSize: 20, color: colors.gray400 },
  logoutBtn: { marginHorizontal: 16, backgroundColor: colors.white, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#FEE2E2', ...shadows.sm },
  logoutText: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
});
`;

// REDESIGNED NAVIGATION
files['src/navigation/AppNavigator.js'] = `
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

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
  iconWrapper: { alignItems: 'center', paddingTop: 6, paddingHorizontal: 12, borderRadius: 12 },
  iconWrapperActive: { backgroundColor: colors.primaryLight },
  icon: { fontSize: 20, marginBottom: 2 },
  iconActive: {},
  label: { fontSize: 10, color: colors.gray500 },
  labelActive: { color: colors.primary, fontWeight: '600' },
});

const HomeTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { height: 70, paddingBottom: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: colors.gray200, backgroundColor: colors.white },
      tabBarShowLabel: false,
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} /> }} />
    <Tab.Screen name="Contacts" component={ContactsScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👥" label="Contacts" focused={focused} /> }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Profile" focused={focused} /> }} />
  </Tab.Navigator>
);

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
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
`;

// Write all files
let count = 0;
for (const [filePath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim(), 'utf8');
  console.log('Written:', filePath, '(' + fs.statSync(fullPath).size + ' bytes)');
  count++;
}
console.log('\nAll ' + count + ' files written! Run: npx expo start');