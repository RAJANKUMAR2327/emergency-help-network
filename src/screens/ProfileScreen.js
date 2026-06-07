import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const items = [
    { label: 'Name', value: user?.name },
    { label: 'Phone', value: user?.phone },
    { label: 'Email', value: user?.email || 'Not set' },
    { label: 'Blood Group', value: user?.bloodGroup || 'Not set' },
    { label: 'Role', value: user?.role },
    { label: 'Emergencies Reported', value: String(user?.stats?.emergenciesReported || 0) },
    { label: 'Help Provided', value: String(user?.stats?.helpProvided || 0) },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
      </View>

      <View style={styles.card}>
        {items.map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.contactsBtn} onPress={() => navigation.navigate('Contacts')}>
        <Text style={styles.contactsBtnText}>👥 Manage Emergency Contacts</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#DC2626', alignItems: 'center', padding: 32, paddingTop: 60 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  phone: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 12, overflow: 'hidden', elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, fontWeight: '500', color: '#111' },
  contactsBtn: { backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  contactsBtnText: { fontSize: 15, fontWeight: '500', color: '#DC2626' },
  logoutBtn: { margin: 16, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#DC2626' },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: 'bold' },
});