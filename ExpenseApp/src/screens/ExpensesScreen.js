import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { getExpenses, addExpense, deleteExpense, getCategories, getUserId } from '../services/api';

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN');
const today = () => new Date().toISOString().split('T')[0];

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(today());

  const load = useCallback(async () => {
    const userId = await getUserId();
    const [expRes, catRes] = await Promise.all([getExpenses(userId), getCategories(userId)]);
    setExpenses(expRes.data);
    setCategories(catRes.data);
    if (catRes.data.length > 0) setCategoryId(catRes.data[0].categoryId);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!amount || !categoryId) return Alert.alert('Error', 'Fill amount and category');
    try {
      const userId = await getUserId();
      await addExpense({ userId, amount: parseFloat(amount), categoryId: parseInt(categoryId), description, date, paymentMode: 'UPI' });
      setModal(false); setAmount(''); setDescription(''); setDate(today());
      load();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this expense?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteExpense(id); load(); } },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6C63FF" />;

  return (
    <View style={styles.container}>
      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.expenseId)}
        ListEmptyComponent={<Text style={styles.empty}>No expenses yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemTitle}>{item.category?.name || 'Expense'}</Text>
              <Text style={styles.itemSub}>{item.description || item.paymentMode} · {item.date}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemAmt}>-{fmt(item.amount)}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.expenseId)}>
                <Text style={styles.del}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TextInput style={styles.input} placeholder="Amount" value={amount}
              onChangeText={setAmount} keyboardType="numeric" placeholderTextColor="#999" />
            <TextInput style={styles.input} placeholder="Description" value={description}
              onChangeText={setDescription} placeholderTextColor="#999" />
            <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date}
              onChangeText={setDate} placeholderTextColor="#999" />
            <Text style={styles.label}>Category</Text>
            <View style={styles.catRow}>
              {categories.map((c) => (
                <TouchableOpacity key={c.categoryId}
                  style={[styles.catChip, categoryId === c.categoryId && styles.catChipActive]}
                  onPress={() => setCategoryId(c.categoryId)}>
                  <Text style={{ color: categoryId === c.categoryId ? '#fff' : '#6C63FF', fontSize: 12 }}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={{ color: '#666' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  item: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', margin: 8, marginHorizontal: 16, borderRadius: 12, padding: 14, elevation: 1 },
  itemLeft: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  itemSub: { fontSize: 12, color: '#999', marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  itemAmt: { fontSize: 15, fontWeight: 'bold', color: '#ef4444' },
  del: { fontSize: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 16 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#6C63FF', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15, color: '#333' },
  label: { fontSize: 13, color: '#666', marginBottom: 8 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip: { borderWidth: 1, borderColor: '#6C63FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  catChipActive: { backgroundColor: '#6C63FF' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#6C63FF', alignItems: 'center' },
});
