import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getBudget, setBudget, getCategories, getUserId } from '../services/api';

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN');
const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function BudgetScreen() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonth());
  const [selectedCat, setSelectedCat] = useState(null);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      const [budRes, catRes] = await Promise.all([getBudget(userId, month), getCategories(userId)]);
      setBudgets(Array.isArray(budRes.data) ? budRes.data : [budRes.data].filter(Boolean));
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !selectedCat) setSelectedCat(catRes.data[0].categoryId);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  }, [month]);

  useFocusEffect(useCallback(() => { load(); }, [month]));

  const handleSave = async () => {
    if (!amount || !selectedCat) return Alert.alert('Error', 'Select category and enter amount');
    setSaving(true);
    try {
      const userId = await getUserId();
      await setBudget({ userId, categoryId: parseInt(selectedCat), amount: parseFloat(amount), month });
      setAmount('');
      load();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6C63FF" />;

  return (
    <ScrollView style={styles.container}>
      {/* Month selector */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 Month</Text>
        <TextInput style={styles.input} value={month} onChangeText={setMonth}
          placeholder="YYYY-MM" placeholderTextColor="#999" />
      </View>

      {/* Set Budget */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 Set Budget</Text>
        <View style={styles.catRow}>
          {categories.map(c => (
            <TouchableOpacity key={c.categoryId}
              style={[styles.catChip, selectedCat === c.categoryId && styles.catChipActive]}
              onPress={() => setSelectedCat(c.categoryId)}>
              <Text style={{ color: selectedCat === c.categoryId ? '#fff' : '#6C63FF', fontSize: 12 }}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.input} placeholder="Budget Amount" value={amount}
          onChangeText={setAmount} keyboardType="numeric" placeholderTextColor="#999" />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Budget'}</Text>
        </TouchableOpacity>
      </View>

      {/* Budget Status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Budget Status — {month}</Text>
        {budgets.length === 0
          ? <Text style={styles.empty}>No budgets set for this month</Text>
          : budgets.map((b, i) => {
            const pct = b.budgetAmount > 0 ? Math.min((b.spentAmount / b.budgetAmount) * 100, 100) : 0;
            const over = b.spentAmount > b.budgetAmount;
            return (
              <View key={i} style={styles.budgetItem}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetCat}>{b.categoryName || 'Category'}</Text>
                  <Text style={[styles.budgetAmt, { color: over ? '#ef4444' : '#333' }]}>
                    {fmt(b.spentAmount)} / {fmt(b.budgetAmount)}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: over ? '#ef4444' : '#6C63FF' }]} />
                </View>
                {over && <Text style={styles.overText}>⚠️ Over budget by {fmt(b.spentAmount - b.budgetAmount)}</Text>}
              </View>
            );
          })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 16, padding: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, fontSize: 15, color: '#333', marginBottom: 12 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catChip: { borderWidth: 1, borderColor: '#6C63FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  catChipActive: { backgroundColor: '#6C63FF' },
  saveBtn: { backgroundColor: '#6C63FF', borderRadius: 10, padding: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  empty: { color: '#999', textAlign: 'center', padding: 16 },
  budgetItem: { marginBottom: 16 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetCat: { fontSize: 14, fontWeight: '600', color: '#333' },
  budgetAmt: { fontSize: 13, fontWeight: '500' },
  barTrack: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  overText: { fontSize: 12, color: '#ef4444', marginTop: 4 },
});
