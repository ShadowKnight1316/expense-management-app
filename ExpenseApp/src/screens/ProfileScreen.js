import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { clearSession } from '../services/api';

export default function ProfileScreen({ onLogout }) {
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await clearSession(); onLogout(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}><Text style={styles.avatarText}>👤</Text></View>
      <Text style={styles.name}>My Account</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', alignItems: 'center', paddingTop: 60 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#6C63FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 48 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 32 },
  logoutBtn: { backgroundColor: '#ef4444', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
