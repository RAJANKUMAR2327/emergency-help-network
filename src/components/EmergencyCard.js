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