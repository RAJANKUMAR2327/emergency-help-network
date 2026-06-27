import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Switch, ActivityIndicator,
} from 'react-native';
import { notificationAPI } from '../api/client';
const { colors, shadows } = require('../theme');

const MAX_CONTACTS = 5;

const EMPTY_FORM = {
  name: '', phone: '', email: '', relationship: '',
  notifyViaSMS: true, notifyViaWhatsApp: true, notifyViaCall: false, notifyViaEmail: true,
};

// Basic phone validation — must be empty or match +91XXXXXXXXXX or 10-digit
const isValidPhone = (phone) => {
  if (!phone) return true; // phone is optional
  return /^(\+91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
};

const isValidEmail = (email) => {
  if (!email) return true; // email is optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await notificationAPI.getContacts();
      setContacts(res.data.data || []);
    } catch (e) {
      Alert.alert('Error', 'Could not load contacts. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return Alert.alert('Error', 'Name is required');
    if (!form.phone && !form.email) return Alert.alert('Error', 'At least one of phone or email is required');
    if (!isValidPhone(form.phone)) return Alert.alert('Invalid Phone', 'Enter a valid phone number (e.g. +91XXXXXXXXXX or 10 digits)');
    if (!isValidEmail(form.email)) return Alert.alert('Invalid Email', 'Enter a valid email address');
    if (contacts.length >= MAX_CONTACTS) return Alert.alert('Limit Reached', 'You can only add up to ' + MAX_CONTACTS + ' emergency contacts');

    setAdding(true);
    try {
      await notificationAPI.addContact(form);
      setForm({ ...EMPTY_FORM });
      await fetchContacts();
      Alert.alert('Added!', form.name + ' added as emergency contact');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not add contact');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Remove Contact', 'Remove ' + name + '?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          // Optimistic update
          setContacts((prev) => prev.filter((c) => c._id !== id));
          try {
            await notificationAPI.deleteContact(id);
          } catch (e) {
            // Rollback on failure
            await fetchContacts();
            Alert.alert('Error', 'Could not remove contact. Please try again.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={styles.subtitle}>
        These people will be notified immediately when you trigger an emergency.
        ({contacts.length}/{MAX_CONTACTS} added)
      </Text>

      {/* Add form */}
      {contacts.length < MAX_CONTACTS && (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Name *"
            placeholderTextColor={colors.gray400}
            value={form.name}
            onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone (+91XXXXXXXXXX) — optional"
            placeholderTextColor={colors.gray400}
            value={form.phone}
            onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Email — optional"
            placeholderTextColor={colors.gray400}
            value={form.email}
            onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Relationship (e.g. Mother)"
            placeholderTextColor={colors.gray400}
            value={form.relationship}
            onChangeText={(v) => setForm((p) => ({ ...p, relationship: v }))}
          />

          <View style={styles.switches}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>SMS</Text>
              <Switch value={form.notifyViaSMS} onValueChange={(v) => setForm((p) => ({ ...p, notifyViaSMS: v }))} trackColor={{ true: colors.primary }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>WhatsApp</Text>
              <Switch value={form.notifyViaWhatsApp} onValueChange={(v) => setForm((p) => ({ ...p, notifyViaWhatsApp: v }))} trackColor={{ true: '#25D366' }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Call</Text>
              <Switch value={form.notifyViaCall} onValueChange={(v) => setForm((p) => ({ ...p, notifyViaCall: v }))} trackColor={{ true: colors.info }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Email</Text>
              <Switch value={form.notifyViaEmail} onValueChange={(v) => setForm((p) => ({ ...p, notifyViaEmail: v }))} trackColor={{ true: colors.accent }} />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addBtn, adding && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={adding}
            accessibilityLabel="Add emergency contact"
            accessibilityRole="button"
          >
            {adding ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.addBtnText}>+ Add Contact</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={contacts}
        keyExtractor={(item) => item._id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.name}</Text>
              {item.phone ? (
                <Text style={styles.contactPhone}>
                  {item.phone}{item.relationship ? ' • ' + item.relationship : ''}
                </Text>
              ) : null}
              {item.email ? (
                <Text style={styles.contactEmail}>{item.email}</Text>
              ) : null}
              <Text style={styles.contactChannels}>
                {item.notifyViaSMS ? '📱 SMS ' : ''}
                {item.notifyViaWhatsApp ? '💬 WA ' : ''}
                {item.notifyViaCall ? '📞 Call ' : ''}
                {item.notifyViaEmail ? '✉️ Email' : ''}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item._id, item.name)}
              style={styles.deleteBtn}
              accessibilityLabel={'Remove ' + item.name}
              accessibilityRole="button"
            >
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No emergency contacts yet. Add up to {MAX_CONTACTS} contacts above.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray100, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.gray900, marginTop: 32, marginBottom: 6 },
  subtitle: { fontSize: 13, color: colors.gray500, marginBottom: 20 },
  form: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 16, ...shadows.sm },
  input: {
    borderWidth: 1, borderColor: colors.gray200, borderRadius: 8, padding: 12,
    marginBottom: 10, fontSize: 14, backgroundColor: colors.gray50, color: colors.gray900,
  },
  switches: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  switchRow: { alignItems: 'center', gap: 4 },
  switchLabel: { fontSize: 12, color: colors.gray600 },
  addBtn: { backgroundColor: colors.primary, borderRadius: 8, padding: 12, alignItems: 'center' },
  addBtnDisabled: { opacity: 0.6 },
  addBtnText: { color: colors.white, fontWeight: 'bold' },
  contactCard: {
    backgroundColor: colors.white, borderRadius: 10, padding: 14,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center', ...shadows.sm,
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: 'bold', color: colors.gray900 },
  contactPhone: { fontSize: 13, color: colors.gray600, marginTop: 2 },
  contactEmail: { fontSize: 12, color: colors.gray500, marginTop: 1 },
  contactChannels: { fontSize: 11, color: colors.gray400, marginTop: 4 },
  deleteBtn: { padding: 8 },
  deleteText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  empty: { textAlign: 'center', color: colors.gray400, padding: 24 },
});
