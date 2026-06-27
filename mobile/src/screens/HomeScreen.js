import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Alert, TouchableOpacity, StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import EmergencyButton from '../components/EmergencyButton';
import EmergencyCard from '../components/EmergencyCard';
import { emergencyAPI, authAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useEmergency } from '../context/EmergencyContext';
const { colors, shadows } = require('../theme');

const EMERGENCY_TYPES = [
  { key: 'medical',  label: 'Medical',  icon: '🚑', color: '#DC2626' },
  { key: 'accident', label: 'Accident', icon: '🚗', color: '#EA580C' },
  { key: 'fire',     label: 'Fire',     icon: '🔥', color: '#D97706' },
  { key: 'crime',    label: 'Crime',    icon: '🚨', color: '#7C3AED' },
];

const SEVERITY_OPTIONS = [
  { key: 'critical', label: 'Critical', color: '#DC2626' },
  { key: 'high',     label: 'High',     color: '#EA580C' },
  { key: 'medium',   label: 'Medium',   color: '#D97706' },
  { key: 'low',      label: 'Low',      color: '#10B981' },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { nearbyEmergencies } = useEmergency();
  const [selectedType, setSelectedType] = useState('medical');
  const [selectedSeverity, setSelectedSeverity] = useState('critical');
  const [location, setLocation] = useState(null);
  const [activeEmergencies, setActiveEmergencies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    initScreen();
    // Poll for new emergencies every 30 seconds
    pollRef.current = setInterval(fetchActiveEmergencies, 30000);
    return () => clearInterval(pollRef.current);
  }, []);

  const initScreen = async () => {
    await getLocation();
    await fetchActiveEmergencies();
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Location Required',
        'Emergency Help Network needs your location to alert nearby helpers. Please enable location in Settings.',
        [{ text: 'OK' }]
      );
      return;
    }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc.coords);
      await authAPI.updateLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (e) {
      // Location fetch failed — user will see red dot indicator
    }
  };

  const fetchActiveEmergencies = async () => {
    try {
      const res = await emergencyAPI.getActive();
      setActiveEmergencies(res.data.data || []);
    } catch (e) {
      // Silently fail — list stays stale rather than crashing
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActiveEmergencies();
    setRefreshing(false);
  }, []);

  const handleEmergency = async () => {
    if (triggering) return;

    if (!location) {
      Alert.alert(
        'No Location',
        'Your location is not available yet. Please wait a moment and try again, or check that location permission is granted.',
        [
          { text: 'Retry', onPress: getLocation },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    setTriggering(true);
    try {
      let resolvedAddress = location.latitude.toFixed(4) + ', ' + location.longitude.toFixed(4);
      try {
        const geo = await Location.reverseGeocodeAsync({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        if (geo?.[0]) {
          const g = geo[0];
          resolvedAddress = [g.name, g.street, g.district, g.subregion, g.city, g.region]
            .filter(Boolean)
            .join(', ');
        }
      } catch (_geoErr) {
        // Geocode failed — fall back to coordinate string
      }

      const res = await emergencyAPI.trigger({
        type: selectedType,
        severity: selectedSeverity,
        longitude: location.longitude,
        latitude: location.latitude,
        address: resolvedAddress,
      });

      Alert.alert(
        '🆘 Emergency Triggered!',
        res.data.notifiedHelpers + ' helpers notified nearby. Stay calm. Help is on the way.',
        [
          {
            text: 'Track on Map',
            onPress: () => navigation.navigate('Map', { emergencyId: res.data.data._id }),
          },
          { text: 'OK' },
        ]
      );
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
      navigation.navigate('Map', { emergencyId });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Could not accept emergency');
    }
  };

  const selectedTypeData = EMERGENCY_TYPES.find((t) => t.key === selectedType);

  // Merge polled list with real-time socket arrivals (deduplicated by _id)
  const allEmergencies = [
    ...nearbyEmergencies.filter((n) => !activeEmergencies.some((a) => a._id === n._id)),
    ...activeEmergencies,
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]} 👋</Text>
          <View style={styles.locationRow}>
            <Text style={styles.locationDot}>{location ? '🟢' : '🔴'}</Text>
            <Text style={styles.locationText}>
              {location ? 'Location active' : 'Getting location...'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}
          accessibilityLabel="Open profile"
          accessibilityRole="button"
        >
          <Text style={styles.profileInitial}>{user?.name?.[0]?.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* SOS Card */}
        <View style={styles.emergencyCard}>
          <Text style={styles.cardTitle}>Emergency Type</Text>
          <View style={styles.typeGrid}>
            {EMERGENCY_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.typeBtn,
                  selectedType === t.key && { backgroundColor: t.color, ...shadows.md },
                ]}
                onPress={() => setSelectedType(t.key)}
                accessibilityLabel={t.label + ' emergency type'}
                accessibilityRole="button"
              >
                <Text style={styles.typeIcon}>{t.icon}</Text>
                <Text style={[styles.typeLabel, selectedType === t.key && styles.typeLabelActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Severity picker */}
          <Text style={styles.cardSubtitle}>Severity</Text>
          <View style={styles.severityRow}>
            {SEVERITY_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[
                  styles.severityBtn,
                  selectedSeverity === s.key && { backgroundColor: s.color },
                ]}
                onPress={() => setSelectedSeverity(s.key)}
                accessibilityLabel={s.label + ' severity'}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.severityLabel,
                  selectedSeverity === s.key && styles.severityLabelActive,
                ]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.buttonArea}>
            <EmergencyButton onPress={handleEmergency} disabled={triggering} />
          </View>

          <View style={[styles.selectedBadge, { backgroundColor: selectedTypeData?.color + '20' }]}>
            <Text style={[styles.selectedBadgeText, { color: selectedTypeData?.color }]}>
              {selectedTypeData?.icon} {selectedTypeData?.label} • {
                SEVERITY_OPTIONS.find(s => s.key === selectedSeverity)?.label
              } • Hold 3 seconds to trigger
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
            <Text style={styles.statNumber}>{allEmergencies.length}</Text>
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

        {/* Nearby emergencies list */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Emergencies</Text>
            <View style={[styles.countBadge, allEmergencies.length > 0 && styles.countBadgeActive]}>
              <Text style={styles.countBadgeText}>{allEmergencies.length}</Text>
            </View>
          </View>

          {allEmergencies.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>All clear!</Text>
              <Text style={styles.emptyText}>No active emergencies in your area</Text>
            </View>
          ) : (
            allEmergencies.map((e) => (
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
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20,
  },
  greeting: { fontSize: 20, fontWeight: 'bold', color: colors.white },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationDot: { fontSize: 10, marginRight: 4 },
  locationText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  profileBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  profileInitial: { fontSize: 18, fontWeight: 'bold', color: colors.white },
  scroll: { flex: 1 },
  emergencyCard: { backgroundColor: colors.white, margin: 16, borderRadius: 20, padding: 20, ...shadows.md },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.gray700, marginBottom: 14 },
  cardSubtitle: { fontSize: 13, fontWeight: '600', color: colors.gray600, marginBottom: 8 },
  typeGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: {
    flex: 1, alignItems: 'center', padding: 10, borderRadius: 12,
    backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray200,
  },
  typeIcon: { fontSize: 22, marginBottom: 4 },
  typeLabel: { fontSize: 11, color: colors.gray600, fontWeight: '500' },
  typeLabelActive: { color: colors.white },
  severityRow: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  severityBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 10,
    backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray200,
  },
  severityLabel: { fontSize: 11, color: colors.gray600, fontWeight: '500' },
  severityLabelActive: { color: colors.white },
  buttonArea: { alignItems: 'center', marginBottom: 16 },
  selectedBadge: { borderRadius: 10, padding: 10, alignItems: 'center' },
  selectedBadgeText: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 14,
    padding: 14, borderLeftWidth: 3, ...shadows.sm,
  },
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
