import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { getUserId, API_BASE } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });

export default function StatementScreen() {
  const navigation = useNavigation();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [imported, setImported] = useState(false);

  const removeDuplicates = async () => {
    Alert.alert(
      'Remove Duplicates',
      'This will delete all duplicate transactions from your account. Continue?',
      [
        { text: 'Cancel' },
        {
          text: 'Remove', style: 'destructive', onPress: async () => {
            setLoading(true);
            try {
              const userId = await getUserId();
              const token = await AsyncStorage.getItem('token');
              const res = await fetch(`${API_BASE}/statement/duplicates?userId=${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              const data = await res.json();
              Alert.alert('Done', `Removed ${data.expensesRemoved} duplicate expenses and ${data.incomeRemoved} duplicate income entries.`);
            } catch (e) {
              Alert.alert('Error', e.message);
            } finally { setLoading(false); }
          }
        },
      ]
    );
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/pdf', 'application/vnd.ms-excel', '*/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setFile(result.assets[0]);
        setReport(null);
        setImported(false);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not pick file');
    }
  };

  const process = async (save) => {
    if (!file) return Alert.alert('No file', 'Please select a CSV or PDF file first');
    setLoading(true);
    try {
      const userId = await getUserId();
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        Alert.alert('Not logged in', 'Please log out and log in again');
        setLoading(false);
        return;
      }

      const endpoint = save ? '/statement/import' : '/statement/preview';
      const url = `${API_BASE}${endpoint}?userId=${userId}`;

      let body;
      if (Platform.OS === 'web') {
        // On web, file.uri is a blob URL — fetch it and create real FormData
        const response = await fetch(file.uri);
        const blob = await response.blob();
        body = new FormData();
        body.append('file', blob, file.name);
      } else {
        body = new FormData();
        body.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        });
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);

      setReport(data);
      setImported(save);
      if (save) {
        Alert.alert('Success', `${data.totalEntries} transactions imported!`, [
          { text: 'View Dashboard', onPress: () => navigation.navigate('Dashboard') },
          { text: 'Stay Here' },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Upload Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏦 Upload Bank Statement</Text>
        <Text style={styles.hint}>Supports CSV and PDF — SBI, HDFC, ICICI, Kotak, Axis etc.</Text>

        <TouchableOpacity style={styles.uploadBtn} onPress={pickFile}>
          <Text style={styles.uploadIcon}>📂</Text>
          <Text style={styles.uploadText}>
            {file ? file.name : 'Tap to select CSV or PDF file'}
          </Text>
        </TouchableOpacity>

        {file && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.previewBtn} onPress={() => process(false)} disabled={loading}>
              <Text style={styles.previewBtnText}>🔍 Preview</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.importBtn} onPress={() => process(true)} disabled={loading}>
              <Text style={styles.importBtnText}>✅ Import</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && <ActivityIndicator style={{ marginTop: 16 }} size="large" color="#6C63FF" />}
      </View>

      {/* Report */}
      {report && (
        <>
          {/* Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {imported ? `✅ ${report.totalEntries} Imported` : `🔍 ${report.totalEntries} Detected (Preview)`}
            </Text>
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: '#ede9fe' }]}>
                <Text style={styles.statNum}>{report.expenseCount}</Text>
                <Text style={styles.statLabel}>Expenses</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#dcfce7' }]}>
                <Text style={styles.statNum}>{report.incomeCount}</Text>
                <Text style={styles.statLabel}>Income</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: '#fee2e2' }]}>
                <Text style={[styles.statNum, { color: '#ef4444' }]}>{fmt(report.totalExpense)}</Text>
                <Text style={styles.statLabel}>Total Expense</Text>
              </View>
              <View style={[styles.statBox, { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.statNum, { color: '#22c55e' }]}>{fmt(report.totalIncome)}</Text>
                <Text style={styles.statLabel}>Total Income</Text>
              </View>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#f0f0ff', marginTop: 8 }]}>
              <Text style={[styles.statNum, { color: '#6C63FF' }]}>{fmt(report.netBalance)}</Text>
              <Text style={styles.statLabel}>Net Balance</Text>
            </View>
          </View>

          {/* Transactions */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Transactions</Text>
            {(report.entries || []).map((entry, i) => (
              <View key={i} style={styles.txItem}>
                <View style={styles.txLeft}>
                  <Text style={styles.txTitle} numberOfLines={1}>{entry.description}</Text>
                  <Text style={styles.txSub}>{entry.category} · {entry.date}</Text>
                </View>
                <Text style={[styles.txAmt, { color: entry.type === 'income' ? '#22c55e' : '#ef4444' }]}>
                  {entry.type === 'income' ? '+' : '-'}{fmt(entry.amount)}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Format hint */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📌 Expected CSV Format</Text>
        <Text style={styles.hint}>Date, Description, Debit, Credit</Text>
        <Text style={styles.hint}>01/04/2026, Swiggy Order, 350,</Text>
        <Text style={styles.hint}>02/04/2026, Salary Credit,, 50000</Text>
      </View>

      {/* Cleanup */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧹 Cleanup</Text>
        <Text style={styles.hint}>If you accidentally imported the same file twice, remove duplicates here.</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={removeDuplicates}>
          <Text style={styles.dangerBtnText}>🗑️ Remove Duplicate Entries</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 16, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  hint: { fontSize: 13, color: '#888', marginBottom: 4 },
  uploadBtn: {
    borderWidth: 2, borderColor: '#6C63FF', borderStyle: 'dashed',
    borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 12,
  },
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadText: { color: '#6C63FF', fontSize: 14, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  previewBtn: { flex: 1, borderWidth: 1, borderColor: '#6C63FF', borderRadius: 10, padding: 12, alignItems: 'center' },
  previewBtnText: { color: '#6C63FF', fontWeight: '600' },
  importBtn: { flex: 1, backgroundColor: '#6C63FF', borderRadius: 10, padding: 12, alignItems: 'center' },
  importBtnText: { color: '#fff', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statBox: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  txLeft: { flex: 1, marginRight: 8 },
  txTitle: { fontSize: 14, color: '#333', fontWeight: '500' },
  txSub: { fontSize: 12, color: '#999', marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: 'bold' },
  dangerBtn: { backgroundColor: '#fee2e2', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8 },
  dangerBtnText: { color: '#ef4444', fontWeight: '600' },
});
