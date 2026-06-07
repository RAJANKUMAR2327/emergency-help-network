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