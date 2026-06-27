import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
const { colors, shadows } = require('../theme');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const isValidPhone = (phone) => /^(\+91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', bloodGroup: '' });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleRegister = async () => {
    if (!form.name.trim()) return Alert.alert('Error', 'Full name is required');
    if (!form.phone.trim()) return Alert.alert('Error', 'Phone number is required');
    if (!isValidPhone(form.phone)) return Alert.alert('Invalid Phone', 'Enter a valid phone number (e.g. +91XXXXXXXXXX or 10 digits starting with 6–9)');
    if (!form.password || form.password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');

    setLoading(true);
    try {
      await register(form);
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || error.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the emergency help network</Text>

        <TextInput
          style={styles.input}
          placeholder="Full name *"
          placeholderTextColor={colors.gray400}
          value={form.name}
          onChangeText={(v) => update('name', v)}
          accessibilityLabel="Full name"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone (+91XXXXXXXXXX) *"
          placeholderTextColor={colors.gray400}
          value={form.phone}
          onChangeText={(v) => update('phone', v)}
          keyboardType="phone-pad"
          accessibilityLabel="Phone number"
        />
        <TextInput
          style={styles.input}
          placeholder="Email (optional)"
          placeholderTextColor={colors.gray400}
          value={form.email}
          onChangeText={(v) => update('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Email address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters) *"
          placeholderTextColor={colors.gray400}
          value={form.password}
          onChangeText={(v) => update('password', v)}
          secureTextEntry
          accessibilityLabel="Password"
        />

        <Text style={styles.label}>Blood Group (optional)</Text>
        <View style={styles.bloodRow}>
          {BLOOD_GROUPS.map((bg) => (
            <TouchableOpacity
              key={bg}
              style={[styles.bloodBtn, form.bloodGroup === bg && styles.bloodBtnActive]}
              onPress={() => update('bloodGroup', form.bloodGroup === bg ? '' : bg)}
              accessibilityLabel={'Blood group ' + bg}
              accessibilityRole="button"
            >
              <Text style={[styles.bloodText, form.bloodGroup === bg && styles.bloodTextActive]}>
                {bg}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          accessibilityLabel="Create account"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          accessibilityLabel="Sign in to existing account"
          accessibilityRole="button"
        >
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.gray900, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.gray500, marginBottom: 28 },
  input: {
    borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, padding: 14,
    fontSize: 15, marginBottom: 14, backgroundColor: colors.gray50, color: colors.gray900,
  },
  label: { fontSize: 14, fontWeight: '500', color: colors.gray700, marginBottom: 10 },
  bloodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  bloodBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: colors.gray200, backgroundColor: colors.gray50,
  },
  bloodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  bloodText: { color: colors.gray700, fontWeight: '500' },
  bloodTextActive: { color: colors.white },
  button: {
    backgroundColor: colors.primary, borderRadius: 10,
    padding: 16, alignItems: 'center', marginBottom: 16, ...shadows.red,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', color: colors.primary, fontSize: 14, paddingVertical: 8 },
});
