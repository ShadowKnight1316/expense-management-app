import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getExpenses, getIncome, deleteExpense, deleteIncome, getUserId } from '../services/api';

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN');

export default function TransactionsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | expense | income

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const userId = await getUserId();
      const [expRes, incRes] = await Promise.all([getExpenses(userId), getIncome(userId)]);
      const all = [
        ...expRes.data.map(e => ({ ...e, _type: 'expense', _id: e.expenseId })),
        ...incRes.data.map(i => ({ ...i, _type: 'income', _id: i.incomeId })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
      setItems(all);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleDelete = async (item) => {
    try {
      if (item._type === 'expense') await deleteExpense(item._id);
      else await deleteIncome(item._id);
      load();
    } catch (e) { }
  };

  const filtered = filter === 'all' ? items : items.filter(i => i._type === filter);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6C63FF" />;

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.tabs}>
        {['all', 'expense', 'income'].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, filter === t && styles.tabActive]} onPress={() => setFilter(t)}>
            <Text style={[styles.tabText, filter === t && styles.tabTextActive]}>
              {t === 'all' ? 'All' : t === 'expense' ? '💸 Expenses' : '💰 Income'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => `${item._type}-${item._id}`}
        ListEmptyComponent={<Text style={styles.empty}>No transactions found</Text>}
        renderItem={({ item }) => {
          const isExp = item._type === 'expense';
          const label = isExp ? (item.category?.name || 'Expense') : (item.source || 'Income');
          return (
            <View style={[styles.item, isExp ? styles.expItem : styles.incItem]}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemIcon}>{isExp ? '💸' : '💰'}</Text>
                <View>
                  <Text style={styles.itemTitle}>{label}</Text>
                  <Text style={styles.itemSub}>{item.description || ''} · {item.date}</Text>
                </View>
              </View>
              <View style={styles.itemRight}>
                <Text style={[styles.itemAmt, { color: isExp ? '#ef4444' : '#22c55e' }]}>
                  {isExp ? '-' : '+'}{fmt(item.amount)}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item)}>
                  <Text style={styles.del}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', padding: 8, gap: 8 },
  tab: { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center', backgroundColor: '#f0f0f0' },
  tabActive: { backgroundColor: '#6C63FF' },
  tabText: { fontSize: 13, color: '#666' },
  tabTextActive: { color: '#fff', fontWeight: 'bold' },
  item: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, borderRadius: 12, padding: 14, elevation: 1 },
  expItem: { borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  incItem: { borderLeftWidth: 3, borderLeftColor: '#22c55e' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  itemIcon: { fontSize: 22 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  itemSub: { fontSize: 12, color: '#999', marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  itemAmt: { fontSize: 15, fontWeight: 'bold' },
  del: { fontSize: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 16 },
});
