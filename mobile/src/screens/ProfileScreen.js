import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, StatusBar, TextInput, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
const { colors, shadows } = require('../theme');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', bloodGroup: user?.bloodGroup || '' });

  const handleSave = async () => {
    if (!form.name.trim()) return Alert.alert('Error', 'Name is required');
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      // Update local AuthContext state immediately — no logout needed
      const updated = res.data?.data || form;
      updateUser({ name: updated.name || form.name, bloodGroup: updated.bloodGroup || form.bloodGroup });
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setForm({ name: user?.name || '', bloodGroup: user?.bloodGroup || '' });
    setEditing(false);
  };

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
    { icon: '🆘', label: 'Reported', value: user?.stats?.emergenciesReported || 0, color: colors.primary },
    { icon: '✋', label: 'Helped', value: user?.stats?.helpProvided || 0, color: colors.success },
    { icon: '⭐', label: 'Rating', value: (user?.stats?.averageRating || 5) + '/5', color: colors.accent },
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

      {/* Stats */}
      <View style={styles.statsRow}>
        {statsItems.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Personal Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          <TouchableOpacity
            onPress={() => (editing ? handleSave() : setEditing(true))}
            style={[styles.editBtn, editing && styles.editBtnActive]}
            accessibilityLabel={editing ? 'Save profile' : 'Edit profile'}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={[styles.editBtnText, editing && styles.editBtnTextActive]}>
                {editing ? 'Save' : 'Edit'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          {editing ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>✏️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <TextInput
                    style={styles.editInput}
                    value={form.name}
                    onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                    placeholder="Your name"
                    placeholderTextColor={colors.gray400}
                  />
                </View>
              </View>
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <Text style={styles.infoIcon}>🩸</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>Blood Group</Text>
                  <View style={styles.bloodGrid}>
                    {BLOOD_GROUPS.map((bg) => (
                      <TouchableOpacity
                        key={bg}
                        onPress={() => setForm((p) => ({ ...p, bloodGroup: bg }))}
                        style={[styles.bloodChip, form.bloodGroup === bg && styles.bloodChipActive]}
                        accessibilityLabel={'Blood group ' + bg}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.bloodChipText, form.bloodGroup === bg && styles.bloodChipTextActive]}>
                          {bg}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            infoItems.map((item, i) => (
              <View key={item.label} style={[styles.infoRow, i < infoItems.length - 1 && styles.infoRowBorder]}>
                <Text style={styles.infoIcon}>{item.icon}</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Contacts')}
          accessibilityLabel="Manage emergency contacts"
          accessibilityRole="button"
        >
          <Text style={styles.actionIcon}>👥</Text>
          <Text style={styles.actionText}>Manage Emergency Contacts</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        accessibilityLabel="Logout"
        accessibilityRole="button"
      >
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100 },
  header: {
    backgroundColor: colors.primary, alignItems: 'center',
    paddingTop: 60, paddingBottom: 32, paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)',
  },
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
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.gray800 },
  editBtn: { backgroundColor: colors.gray100, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, minWidth: 56, alignItems: 'center' },
  editBtnActive: { backgroundColor: colors.primary },
  editBtnText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  editBtnTextActive: { color: colors.white },
  infoCard: { backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden', ...shadows.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  infoIcon: { fontSize: 18, marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: colors.gray500, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '500', color: colors.gray900 },
  editInput: {
    borderBottomWidth: 1, borderBottomColor: colors.gray200,
    paddingVertical: 6, fontSize: 14, color: colors.gray900,
  },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  bloodChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray200,
  },
  bloodChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  bloodChipText: { color: colors.gray700, fontWeight: '600', fontSize: 13 },
  bloodChipTextActive: { color: colors.white },
  cancelBtn: { padding: 12, alignItems: 'center' },
  cancelBtnText: { color: colors.gray500, fontSize: 13 },
  actionBtn: { backgroundColor: colors.white, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', ...shadows.sm },
  actionIcon: { fontSize: 20, marginRight: 12 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.gray800 },
  actionArrow: { fontSize: 20, color: colors.gray400 },
  logoutBtn: {
    marginHorizontal: 16, backgroundColor: colors.white, borderRadius: 14,
    padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#FEE2E2', ...shadows.sm,
  },
  logoutText: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
});
