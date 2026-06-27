import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { emergencyAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useEmergency } from '../context/EmergencyContext';

export default function MapScreen({ route, navigation }) {
  const { emergencyId } = route.params || {};
  const { user } = useAuth();
  const { responders, joinEmergencyRoom, leaveEmergencyRoom } = useEmergency();
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const locationSubscription = useRef(null); // store watcher so we can clean it up

  useEffect(() => {
    if (!emergencyId) return;
    fetchEmergency();
    startLocationTracking();
    joinEmergencyRoom(emergencyId);

    return () => {
      // Clean up location watcher to prevent leaks
      locationSubscription.current?.remove();
      leaveEmergencyRoom(emergencyId);
    };
  }, [emergencyId]);

  // Pan map to victim when emergency data arrives
  useEffect(() => {
    if (!emergency) return;
    const coords = emergency?.location?.coordinates;
    if (coords && mapRef.current) {
      mapRef.current.animateToRegion(
        { latitude: coords[1], longitude: coords[0], latitudeDelta: 0.01, longitudeDelta: 0.01 },
        800
      );
    }
  }, [emergency]);

  // Re-fetch periodically so responder count and status stay fresh
  useEffect(() => {
    if (!emergencyId) return;
    const interval = setInterval(fetchEmergency, 15000);
    return () => clearInterval(interval);
  }, [emergencyId]);

  const fetchEmergency = async () => {
    try {
      const res = await emergencyAPI.getOne(emergencyId);
      setEmergency(res.data.data);
    } catch (e) {
      Alert.alert('Error', 'Could not load emergency details');
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    // Store subscription reference for cleanup
    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
      async (loc) => {
        try {
          await emergencyAPI.updateLocation(emergencyId, {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        } catch (e) {
          // Location update failure is non-critical
        }
      }
    );
  };

  const victimCoords = emergency?.location?.coordinates
    ? { latitude: emergency.location.coordinates[1], longitude: emergency.location.coordinates[0] }
    : null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        // Use a stable default region — animateToRegion() in useEffect will move it once data loads
        initialRegion={{ latitude: 20.5937, longitude: 78.9629, latitudeDelta: 5, longitudeDelta: 5 }}
        showsUserLocation
        showsMyLocationButton
      >
        {victimCoords && (
          <Marker
            coordinate={victimCoords}
            title="Victim Location"
            description={emergency?.reporter?.name}
            pinColor="red"
          >
            <Text style={{ fontSize: 32 }}>🆘</Text>
          </Marker>
        )}
        {responders.map((r) =>
          r.currentLocation?.coordinates ? (
            <Marker
              key={r.userId} // stable key — not array index
              coordinate={{
                latitude: r.currentLocation.coordinates[1],
                longitude: r.currentLocation.coordinates[0],
              }}
              title={r.name || 'Helper'}
              pinColor="blue"
            >
              <Text style={{ fontSize: 24 }}>🏃</Text>
            </Marker>
          ) : null
        )}
        {/* Also show responders from polled emergency data as fallback */}
        {!responders.length && emergency?.responders?.map((r) =>
          r.currentLocation?.coordinates ? (
            <Marker
              key={r._id || r.user?._id}
              coordinate={{
                latitude: r.currentLocation.coordinates[1],
                longitude: r.currentLocation.coordinates[0],
              }}
              title={r.user?.name || 'Helper'}
              pinColor="blue"
            >
              <Text style={{ fontSize: 24 }}>🏃</Text>
            </Marker>
          ) : null
        )}
      </MapView>

      <View style={styles.infoCard}>
        {loading ? (
          <ActivityIndicator size="small" color="#DC2626" />
        ) : emergency ? (
          <>
            <Text style={styles.emergencyType}>
              {emergency.type?.toUpperCase().replace('_', ' ')} • {emergency.status?.toUpperCase()}
            </Text>
            <Text style={styles.reporter}>
              👤 {emergency.reporter?.name} • {emergency.reporter?.phone}
            </Text>
            {emergency.reporter?.bloodGroup && (
              <Text style={styles.blood}>🩸 Blood: {emergency.reporter.bloodGroup}</Text>
            )}
            <Text style={styles.responders}>
              👥 {emergency.responders?.length || 0} helper(s) responding
            </Text>
          </>
        ) : (
          <Text style={styles.loading}>Could not load emergency details</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  infoCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 20,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 10,
    minHeight: 80, justifyContent: 'center',
  },
  emergencyType: { fontSize: 18, fontWeight: 'bold', color: '#DC2626', marginBottom: 6 },
  reporter: { fontSize: 14, color: '#333', marginBottom: 4 },
  blood: { fontSize: 14, color: '#DC2626', marginBottom: 4 },
  responders: { fontSize: 13, color: '#666' },
  loading: { textAlign: 'center', color: '#666' },
  backBtn: {
    position: 'absolute', top: 48, left: 16,
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, elevation: 4,
  },
  backText: { fontWeight: 'bold', color: '#111' },
});
