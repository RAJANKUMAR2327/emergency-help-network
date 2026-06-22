import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
const { colors, shadows } = require('../theme');

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