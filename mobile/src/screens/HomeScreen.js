import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import EmergencyButton from '../components/EmergencyButton';
import EmergencyCard from '../components/EmergencyCard';
import { emergencyAPI, authAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useEmergency } from '../context/EmergencyContext';
const { colors, shadows } = require('../theme');

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
      Alert.alert('🆘 Emergency Triggered!', res.data.notifiedHelpers + ' helpers notified nearby. Stay calm. Help is on the way.', [
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