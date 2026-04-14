import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { getIncome, addIncome, deleteIncome, getUserId } from '../services/api';

const fmt = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN');
const today = () => new Date().toISOString().split('T')[0];
const SOURCES = ['Salary', 'Freelance', 'Business', 'Investment', 'Other'];

export default function IncomeScreen() {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Salary');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today());

  const load = useCallback(async () => {
    const userId = await getUserId();
    const res = await getIncome(userId);
    setIncomes(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!amount) return Alert.alert('Error', 'Enter amount');
    try {
      const userId = await getUserId();
      await addIncome({ userId, amount: parseFloat(amount), source, description, date });
      setModal(false); setAmount(''); setDescription(''); setDate(today());
      load();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this income?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteIncome(id); load(); } },
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#22c55e" />;

  return (
    <View style={styles.container}>
      <FlatList
        data={incomes}
        keyExtractor={(item) => String(item.incomeId)}
        ListEmptyComponent={<Text style={styles.empty}>No income recorded yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.itemTitle}>{item.source}</Text>
              <Text style={styles.itemSub}>{item.description || ''} · {item.date}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemAmt}>+{fmt(item.amount)}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.incomeId)}>
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
            <Text style={styles.modalTitle}>Add Income</Text>
            <TextInput style={styles.input} placeholder="Amount" value={amount}
              onChangeText={setAmount} keyboardType="numeric" placeholderTextColor="#999" />
            <TextInput style={styles.input} placeholder="Description" value={description}
              onChangeText={setDescription} placeholderTextColor="#999" />
            <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date}
              onChangeText={setDate} placeholderTextColor="#999" />
            <Text style={styles.label}>Source</Text>
            <View style={styles.srcRow}>
              {SOURCES.map((s) => (
                <TouchableOpacity key={s}
                  style={[styles.srcChip, source === s && styles.srcChipActive]}
                  onPress={() => setSource(s)}>
                  <Text style={{ color: source === s ? '#fff' : '#22c55e', fontSize: 12 }}>{s}</Text>
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
  itemAmt: { fontSize: 15, fontWeight: 'bold', color: '#22c55e' },
  del: { fontSize: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 16 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#22c55e', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15, color: '#333' },
  label: { fontSize: 13, color: '#666', marginBottom: 8 },
  srcRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  srcChip: { borderWidth: 1, borderColor: '#22c55e', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  srcChipActive: { backgroundColor: '#22c55e' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#22c55e', alignItems: 'center' },
});
