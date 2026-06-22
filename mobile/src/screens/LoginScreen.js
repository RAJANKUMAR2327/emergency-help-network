import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
const { colors, shadows } = require('../theme');

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) return Alert.alert('Missing Info', 'Please enter phone and password');
    setLoading(true);
    try {
      await login(phone, password);
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🆘</Text>
        </View>
        <Text style={styles.appName}>Emergency Help Network</Text>
        <Text style={styles.tagline}>Your safety, our priority</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.welcomeText}>Welcome back</Text>
        <Text style={styles.subText}>Sign in to continue</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>📱</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 XXXXX XXXXX"
              placeholderTextColor={colors.gray400}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={colors.gray400}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.loginBtn, loading && styles.loginBtnDisabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.loginBtnText}>Sign In →</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 16, padding: 14, borderRadius: 14, borderWidth: 2, borderColor: colors.primary, alignItems: 'center' }} onPress={() => navigation.navigate('Register')}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>Create New Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>🛡️ Your data is encrypted and secure</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 32 },
  logoContainer: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoEmoji: { fontSize: 40 },
  appName: { fontSize: 24, fontWeight: 'bold', color: colors.white, textAlign: 'center' },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: { flex: 1, backgroundColor: colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, ...shadows.lg },
  welcomeText: { fontSize: 26, fontWeight: 'bold', color: colors.gray900, marginBottom: 4 },
  subText: { fontSize: 14, color: colors.gray500, marginBottom: 28 },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.gray700, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 12, paddingHorizontal: 14, backgroundColor: colors.gray50 },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.gray900 },
  eyeIcon: { fontSize: 16, padding: 4 },
  loginBtn: { backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, ...shadows.red },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerLinkText: { fontSize: 14, color: colors.gray500 },
  registerLinkBold: { color: colors.primary, fontWeight: '600' },
  footer: { paddingBottom: 20, alignItems: 'center', backgroundColor: colors.white },
  footerText: { fontSize: 12, color: colors.gray400 },
});