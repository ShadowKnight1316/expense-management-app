import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { login, register, setSession } from '../services/api';

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Fill in all fields');
    setLoading(true);
    try {
      const res = await login({ email, password });
      await setSession(res.data.token, res.data.userId);
      onLogin();
    } catch (e) {
      Alert.alert('Login Failed', e.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    if (!name || !email || !password) return Alert.alert('Error', 'Fill in all fields');
    setLoading(true);
    try {
      await register({ name, email, password });
      Alert.alert('Success', 'Account created! Please login.');
      setMode('login');
    } catch (e) {
      Alert.alert('Signup Failed', e.response?.data?.message || 'Try again');
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.logo}>💰</Text>
        <Text style={styles.title}>Expense Manager</Text>
        <Text style={styles.subtitle}>{mode === 'login' ? 'Welcome back!' : 'Create account'}</Text>

        {mode === 'signup' && (
          <TextInput style={styles.input} placeholder="Full Name" value={name}
            onChangeText={setName} placeholderTextColor="#999" />
        )}
        <TextInput style={styles.input} placeholder="Email" value={email}
          onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
          placeholderTextColor="#999" />
        <TextInput style={styles.input} placeholder="Password" value={password}
          onChangeText={setPassword} secureTextEntry placeholderTextColor="#999" />

        <TouchableOpacity style={styles.btn} onPress={mode === 'login' ? handleLogin : handleSignup}
          disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          <Text style={styles.toggle}>
            {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6C63FF' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  logo: { fontSize: 60, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    fontSize: 15, marginBottom: 14, color: '#333',
  },
  btn: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#6C63FF', fontWeight: 'bold', fontSize: 16 },
  toggle: { color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 20, fontSize: 14 },
});
