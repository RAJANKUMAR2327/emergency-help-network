import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
const { colors, shadows } = require('../theme');

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