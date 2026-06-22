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