import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Btn, Badge, StockBadge, Spinner, Empty, AppModal, Input, Card } from '../components/UI';
import { colors, spacing, radius, font } from '../utils/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';

const BLANK = { name: '', price: '', stock: '', lowStockThreshold: '5', barcode: '', category: 'General', unit: 'pcs' };

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(BLANK);
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products);
      setFiltered(data.products);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const handleSearch = (q) => {
    setSearch(q);
    const lower = q.toLowerCase();
    setFiltered(products.filter(p => p.name.toLowerCase().includes(lower) || (p.barcode || '').includes(q)));
  };

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setEditing(null); setForm(BLANK); setModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, price: String(p.price), stock: String(p.stock), lowStockThreshold: String(p.lowStockThreshold), barcode: p.barcode || '', category: p.category || 'General', unit: p.unit || 'pcs' });
    setModal(true);
  };

  const save = async () => {
    if (!form.name || !form.price || !form.stock) { Toast.show({ type: 'error', text1: 'Fill required fields' }); return; }
    setSaving(true);
    try {
      const body = { ...form, price: Number(form.price), stock: Number(form.stock), lowStockThreshold: Number(form.lowStockThreshold) };
      if (editing) { await api.put(`/products/${editing._id}`, body); Toast.show({ type: 'success', text1: 'Product updated' }); }
      else          { await api.post('/products', body); Toast.show({ type: 'success', text1: 'Product added' }); }
      setModal(false); load();
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const del = (p) => {
    Alert.alert('Delete product', `Delete "${p.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/products/${p._id}`); Toast.show({ type: 'success', text1: 'Deleted' }); load(); }
        catch { Toast.show({ type: 'error', text1: 'Delete failed' }); }
      }},
    ]);
  };

  if (loading) return <Spinner />;

  return (
    <View style={s.screen}>
      <View style={s.topBar}>
        <TextInput
          style={s.search}
          placeholder="Search products…"
          placeholderTextColor={colors.text3}
          value={search}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Text style={{ color: colors.white, fontWeight: font.semibold, fontSize: 13 }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={p => p._id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        renderItem={({ item: p }) => (
          <Card style={s.prodCard}>
            <View style={s.prodRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.prodName}>{p.name}</Text>
                {p.barcode ? <Text style={s.prodBarcode}>{p.barcode}</Text> : null}
              </View>
              <StockBadge status={p.stockStatus} />
            </View>
            <View style={s.prodMeta}>
              <Text style={s.metaItem}>₹{p.price}</Text>
              <Text style={[s.metaItem, { color: p.stock === 0 ? colors.red : p.stock <= p.lowStockThreshold ? colors.amber : colors.green }]}>
                {p.stock} {p.unit}
              </Text>
              <Text style={[s.metaItem, { color: colors.text2 }]}>Alert: {p.lowStockThreshold}</Text>
              {p.supplier?.name && <Text style={[s.metaItem, { color: colors.text2 }]}>{p.supplier.name}</Text>}
            </View>
            <View style={s.actions}>
              <Btn title="Edit" variant="ghost" size="sm" onPress={() => openEdit(p)} style={{ flex: 1 }} />
              <Btn title="Delete" variant="danger" size="sm" onPress={() => del(p)} style={{ flex: 1 }} />
            </View>
          </Card>
        )}
        ListEmptyComponent={<Empty icon="📦" title="No products" sub="Tap + Add to get started" />}
      />

      <AppModal visible={modal} onClose={() => setModal(false)} title={editing ? 'Edit product' : 'Add product'}>
        <Input label="Product name *" value={form.name} onChangeText={set('name')} placeholder="Bread" />
        <Input label="Barcode" value={form.barcode} onChangeText={set('barcode')} placeholder="Optional" />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Input label="Price (₹) *" value={form.price} onChangeText={set('price')} keyboardType="numeric" placeholder="30" style={{ flex: 1 }} />
          <Input label="Stock qty *" value={form.stock} onChangeText={set('stock')} keyboardType="numeric" placeholder="50" style={{ flex: 1 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Input label="Alert threshold" value={form.lowStockThreshold} onChangeText={set('lowStockThreshold')} keyboardType="numeric" style={{ flex: 1 }} />
          <Input label="Unit" value={form.unit} onChangeText={set('unit')} placeholder="pcs" style={{ flex: 1 }} />
        </View>
        <Input label="Category" value={form.category} onChangeText={set('category')} placeholder="General" />
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <Btn title="Cancel" variant="ghost" onPress={() => setModal(false)} style={{ flex: 1 }} />
          <Btn title={editing ? 'Save' : 'Add product'} variant="primary" onPress={save} loading={saving} style={{ flex: 1 }} />
        </View>
      </AppModal>
    </View>
  );
}

const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: colors.bg },
  topBar:    { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderColor: colors.border },
  search:    { flex: 1, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border2, borderRadius: radius.sm, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 13 },
  addBtn:    { backgroundColor: colors.accent, paddingHorizontal: spacing.lg, borderRadius: radius.sm, justifyContent: 'center' },
  prodCard:  { padding: spacing.md },
  prodRow:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.sm },
  prodName:  { fontSize: 14, fontWeight: font.semibold, color: colors.text },
  prodBarcode:{ fontSize: 11, color: colors.text3, fontFamily: 'monospace', marginTop: 2 },
  prodMeta:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  metaItem:  { fontSize: 12, fontFamily: 'monospace', color: colors.green },
  actions:   { flexDirection: 'row', gap: spacing.sm },
});
