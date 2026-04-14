import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboard, getUserId } from '../services/api';

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 });

export default function DashboardScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const userId = await getUserId();
      const res = await getDashboard(userId);
      setData(res.data);
    } catch (e) {
      console.log('Dashboard error', e.message);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Reload every time this screen comes into focus
  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6C63FF" />;

  const d = data || {};
  const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello 👋</Text>
        <Text style={styles.month}>{month}</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Net Balance</Text>
        <Text style={styles.balanceAmount}>{fmt(d.totalBalance)}</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, styles.incomeCard]}>
          <Text style={styles.cardIcon}>💰</Text>
          <Text style={styles.cardLabel}>Income</Text>
          <Text style={styles.cardAmount}>{fmt(d.totalIncome)}</Text>
        </View>
        <View style={[styles.card, styles.expenseCard]}>
          <Text style={styles.cardIcon}>💸</Text>
          <Text style={styles.cardLabel}>Expenses</Text>
          <Text style={styles.cardAmount}>{fmt(d.totalExpense)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <ScrollView
          style={styles.txScroll}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}>
          {(d.recentTransactions || []).length === 0
            ? <Text style={styles.empty}>No transactions yet</Text>
            : (d.recentTransactions || []).map((tx, i) => (
              <View key={i} style={styles.txItem}>
                <View>
                  <Text style={styles.txTitle}>{tx.description || tx.source || 'Transaction'}</Text>
                  <Text style={styles.txSub}>{tx.date}</Text>
                </View>
                <Text style={[styles.txAmt, { color: tx.type === 'income' ? '#22c55e' : '#ef4444' }]}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </Text>
              </View>
            ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#6C63FF', padding: 24, paddingTop: 48 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  month: { color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  balanceCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 24,
    alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8,
  },
  balanceLabel: { color: '#666', fontSize: 14 },
  balanceAmount: { fontSize: 32, fontWeight: 'bold', color: '#6C63FF', marginTop: 4 },
  row: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  card: { flex: 1, borderRadius: 16, padding: 16, elevation: 2 },
  incomeCard: { backgroundColor: '#dcfce7' },
  expenseCard: { backgroundColor: '#fee2e2' },
  cardIcon: { fontSize: 24 },
  cardLabel: { color: '#555', fontSize: 13, marginTop: 4 },
  cardAmount: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 2 },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  txTitle: { fontSize: 14, color: '#333', fontWeight: '500' },
  txSub: { fontSize: 12, color: '#999', marginTop: 2 },
  txAmt: { fontSize: 15, fontWeight: 'bold' },
  empty: { color: '#999', textAlign: 'center', padding: 16 },
  txScroll: { maxHeight: 280 },
});
