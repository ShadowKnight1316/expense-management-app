import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMonthlyReport, getCategoryReport, getUserId } from '../services/api';

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN');
const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const [monthly, setMonthly] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      const [mRes, cRes] = await Promise.all([
        getMonthlyReport(userId, month, year),
        getCategoryReport(userId),
      ]);
      setMonthly(mRes.data);
      setCategories(Array.isArray(cRes.data) ? cRes.data : []);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6C63FF" />;

  const m = monthly || {};
  const maxCat = categories.length > 0 ? Math.max(...categories.map(c => c.totalAmount || 0)) : 1;

  return (
    <ScrollView style={styles.container}>
      {/* Monthly Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 {now.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
        <View style={styles.row}>
          <View style={[styles.statBox, { backgroundColor: '#dcfce7' }]}>
            <Text style={[styles.statNum, { color: '#22c55e' }]}>{fmt(m.totalIncome)}</Text>
            <Text style={styles.statLabel}>Income</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#fee2e2' }]}>
            <Text style={[styles.statNum, { color: '#ef4444' }]}>{fmt(m.totalExpenses)}</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#ede9fe', marginTop: 8 }]}>
          <Text style={[styles.statNum, { color: '#6C63FF' }]}>{fmt((m.totalIncome || 0) - (m.totalExpenses || 0))}</Text>
          <Text style={styles.statLabel}>Net Savings</Text>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Spending by Category</Text>
        {categories.length === 0
          ? <Text style={styles.empty}>No data yet</Text>
          : categories
              .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
              .map((cat, i) => {
                const pct = maxCat > 0 ? ((cat.totalAmount || 0) / maxCat) * 100 : 0;
                return (
                  <View key={i} style={styles.catRow}>
                    <View style={styles.catHeader}>
                      <Text style={styles.catName}>{cat.categoryName || cat.name}</Text>
                      <Text style={styles.catAmt}>{fmt(cat.totalAmount)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                );
              })}
      </View>

      {/* Monthly expenses list */}
      {m.expenses && m.expenses.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💸 This Month's Expenses</Text>
          {m.expenses.map((e, i) => (
            <View key={i} style={styles.txItem}>
              <View>
                <Text style={styles.txTitle}>{e.category?.name || 'Expense'}</Text>
                <Text style={styles.txSub}>{e.description || ''} · {e.date}</Text>
              </View>
              <Text style={styles.txAmt}>-{fmt(e.amount)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 16, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  catRow: { marginBottom: 12 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catName: { fontSize: 14, color: '#333', fontWeight: '500' },
  catAmt: { fontSize: 13, color: '#666' },
  barTrack: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: '#6C63FF' },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  txTitle: { fontSize: 14, color: '#333', fontWeight: '500' },
  txSub: { fontSize: 12, color: '#999' },
  txAmt: { fontSize: 14, fontWeight: 'bold', color: '#ef4444' },
  empty: { color: '#999', textAlign: 'center', padding: 16 },
});
