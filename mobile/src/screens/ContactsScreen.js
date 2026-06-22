import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Switch, ActivityIndicator } from 'react-native';
import { notificationAPI } from '../api/client';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', relationship: '', notifyViaSMS: true, notifyViaWhatsApp: true, notifyViaCall: false, notifyViaEmail: true });

  useEffect(() => { fetchContacts(); }, []);

  const fetchContacts = async () => {
    try {
      const res = await notificationAPI.getContacts();
      setContacts(res.data.data || []);
    } catch (e) { Alert.alert('Error', 'Could not load contacts'); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.name || (!form.phone && !form.email)) return Alert.alert('Error', 'Name and at least one of phone or email is required');
    setAdding(true);
    try {
      await notificationAPI.addContact(form);
      setForm({ name: '', phone: '', email: '', relationship: '', notifyViaSMS: true, notifyViaWhatsApp: true, notifyViaCall: false, notifyViaEmail: true });
      fetchContacts();
      Alert.alert('Added!', form.name + ' added as emergency contact');
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Could not add contact'); }
    finally { setAdding(false); }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Remove Contact', 'Remove ' + name + '?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await notificationAPI.deleteContact(id);
        fetchContacts();
      }},
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#DC2626" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={styles.subtitle}>These people will be notified immediately when you trigger an emergency.</Text>

      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />
        <TextInput style={styles.input} placeholder="Phone (+91XXXXXXXXXX) - optional" value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Email - optional" value={form.email} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Relationship (e.g. Mother)" value={form.relationship} onChangeText={(v) => setForm((p) => ({ ...p, relationship: v }))} />
        <View style={styles.switches}>
          <View style={styles.switchRow}><Text style={styles.switchLabel}>SMS</Text><Switch value={form.notifyViaSMS} onValueChange={(v) => setForm((p) => ({ ...p, notifyViaSMS: v }))} trackColor={{ true: '#DC2626' }} /></View>
          <View style={styles.switchRow}><Text style={styles.switchLabel}>WhatsApp</Text><Switch value={form.notifyViaWhatsApp} onValueChange={(v) => setForm((p) => ({ ...p, notifyViaWhatsApp: v }))} trackColor={{ true: '#25D366' }} /></View>
          <View style={styles.switchRow}><Text style={styles.switchLabel}>Call</Text><Switch value={form.notifyViaCall} onValueChange={(v) => setForm((p) => ({ ...p, notifyViaCall: v }))} trackColor={{ true: '#3B82F6' }} /></View>
          <View style={styles.switchRow}><Text style={styles.switchLabel}>Email</Text><Switch value={form.notifyViaEmail} onValueChange={(v) => setForm((p) => ({ ...p, notifyViaEmail: v }))} trackColor={{ true: '#F59E0B' }} /></View>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={adding}>
          {adding ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>+ Add Contact</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactPhone}>{item.phone} {item.relationship ? '• ' + item.relationship : ''}</Text>
              <Text style={styles.contactChannels}>
                {item.notifyViaSMS ? '📱 SMS ' : ''}{item.notifyViaWhatsApp ? '💬 WhatsApp ' : ''}{item.notifyViaCall ? '📞 Call' : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item._id, item.name)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No emergency contacts yet. Add up to 5 contacts above.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111', marginTop: 32, marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 20 },
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 14, backgroundColor: '#f9f9f9' },
  switches: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  switchRow: { alignItems: 'center', gap: 4 },
  switchLabel: { fontSize: 12, color: '#555' },
  addBtn: { backgroundColor: '#DC2626', borderRadius: 8, padding: 12, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  contactCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  contactPhone: { fontSize: 13, color: '#555', marginTop: 2 },
  contactChannels: { fontSize: 11, color: '#888', marginTop: 4 },
  deleteBtn: { padding: 8 },
  deleteText: { color: '#DC2626', fontSize: 16, fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#888', padding: 24 },
});