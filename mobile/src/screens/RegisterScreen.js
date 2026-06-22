import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', bloodGroup: '' });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleRegister = async () => {
    
    if (!form.name || !form.phone || !form.password) return Alert.alert('Error', 'Name, phone and password are required');
    setLoading(true);
    try {
      await register(form);
    } catch (error) {
      console.log('REGISTER ERROR:', JSON.stringify({ message: error.message, code: error.code, hasResponse: !!error.response, status: error.response?.status, data: error.response?.data }));
      Alert.alert('Registration Failed', error.response?.data?.message || error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the emergency help network</Text>

        <TextInput style={styles.input} placeholder="Full name" value={form.name} onChangeText={(v) => update('name', v)} />
        <TextInput style={styles.input} placeholder="Phone (+91XXXXXXXXXX)" value={form.phone} onChangeText={(v) => update('phone', v)} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Email (optional)" value={form.email} onChangeText={(v) => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password (min 6 chars)" value={form.password} onChangeText={(v) => update('password', v)} secureTextEntry />

        <Text style={styles.label}>Blood Group (optional)</Text>
        <View style={styles.bloodRow}>
          {bloodGroups.map((bg) => (
            <TouchableOpacity key={bg} style={[styles.bloodBtn, form.bloodGroup === bg && styles.bloodBtnActive]} onPress={() => update('bloodGroup', bg)}>
              <Text style={[styles.bloodText, form.bloodGroup === bg && styles.bloodTextActive]}>{bg}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 28 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14, backgroundColor: '#f9f9f9' },
  label: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 10 },
  bloodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  bloodBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  bloodBtnActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  bloodText: { color: '#333', fontWeight: '500' },
  bloodTextActive: { color: '#fff' },
  button: { backgroundColor: '#DC2626', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#DC2626', fontSize: 14 },
});