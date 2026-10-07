import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Btn, Badge, StockBadge, Spinner, Empty, AppModal, Input, Card, PillTabs } from '../components/UI';
import { colors, spacing, radius, font, shadows } from '../utils/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';

const BLANK = {
  name: '',
  price: '',
  stock: '',
  lowStockThreshold: '5',
  barcode: '',
  category: 'General',
  unit: 'pcs',
};

const UNITS = ['pcs', 'kg', 'ltr', 'box', 'pack', 'bottle', 'can'];

export default function ProductsScreen() {
  const [products, setProducts]       = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all'); // all, in_stock, low_stock, out_of_stock
  const [modal, setModal]             = useState(false);
  const [editing, setEditing]         = useState(null);
  const [form, setForm]               = useState(BLANK);
  const [saving, setSaving]           = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products || []);
      applyFilters(data.products || [], search, selectedCat, statusFilter);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const applyFilters = (list, q, cat, status) => {
    let res = list;
    if (cat !== 'All') {
      res = res.filter(p => p.category === cat);
    }
    if (status !== 'all') {
      res = res.filter(p => p.stockStatus === status);
    }
    if (q) {
      const lower = q.toLowerCase();
      res = res.filter(p => p.name.toLowerCase().includes(lower) || (p.barcode || '').includes(q));
    }
    setFiltered(res);
  };

  const handleSearch = (q) => {
    setSearch(q);
    applyFilters(products, q, selectedCat, statusFilter);
  };

  const handleCategorySelect = (cat) => {
    setSelectedCat(cat);
    applyFilters(products, search, cat, statusFilter);
  };

  const handleStatusSelect = (st) => {
    setStatusFilter(st);
    applyFilters(products, search, selectedCat, st);
  };

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK);
    setModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price),
      stock: String(p.stock),
      lowStockThreshold: String(p.lowStockThreshold || 5),
      barcode: p.barcode || '',
      category: p.category || 'General',
      unit: p.unit || 'pcs',
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.name || !form.price || !form.stock) {
      Toast.show({ type: 'error', text1: 'Fill in all required fields' });
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold || 5),
      };
      if (editing) {
        await api.put(`/products/${editing._id}`, body);
        Toast.show({ type: 'success', text1: 'Product updated' });
      } else {
        await api.post('/products', body);
        Toast.show({ type: 'success', text1: 'Product created' });
      }
      setModal(false);
      load();
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const del = (p) => {
    Alert.alert('Delete Product', `Permanently delete "${p.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/products/${p._id}`);
            Toast.show({ type: 'success', text1: 'Product deleted' });
            load();
          } catch {
            Toast.show({ type: 'error', text1: 'Delete failed' });
          }
        },
      },
    ]);
  };

  if (loading) return <Spinner />;

  return (
    <View style={s.screen}>
      {/* Top Search + Add Bar */}
      <View style={s.topBar}>
        <TextInput
          style={s.search}
          placeholder="Search products by name or barcode…"
          placeholderTextColor={colors.text3}
          value={search}
          onChangeText={handleSearch}
        />
        <Btn title="+ Add Item" variant="primary" size="sm" onPress={openAdd} />
      </View>

      {/* Status & Category Filters */}
      <View style={{ paddingHorizontal: spacing.md, paddingVertical: 4, backgroundColor: colors.bg2 }}>
        <PillTabs
          tabs={[
            { key: 'all',          label: `All (${products.length})` },
            { key: 'low_stock',    label: '⚠️ Low Stock' },
            { key: 'out_of_stock', label: '🚫 Depleted' },
            { key: 'in_stock',     label: '✅ Optimal' },
          ]}
          activeTab={statusFilter}
          onSelect={handleStatusSelect}
        />
      </View>

      {categories.length > 2 && (
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: 4 }}>
          <PillTabs
            tabs={categories}
            activeTab={selectedCat}
            onSelect={handleCategorySelect}
          />
        </View>
      )}

      {/* Products List */}
      <FlatList
        data={filtered}
        keyExtractor={p => p._id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        ListEmptyComponent={<Empty icon="📦" title="No Products Match" sub="Try clearing your search or status filter" />}
        renderItem={({ item: p }) => (
          <Card style={s.prodCard}>
            <View style={s.prodRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.prodCat}>{p.category || 'General'}</Text>
                <Text style={s.prodName}>{p.name}</Text>
                {p.barcode ? (
                  <Text style={s.prodBarcode}>Barcode: {p.barcode}</Text>
                ) : null}
              </View>
              <StockBadge status={p.stockStatus} />
            </View>

            <View style={s.prodMeta}>
              <View style={s.metaPill}>
                <Text style={s.metaLabel}>Selling Price</Text>
                <Text style={s.metaVal}>₹{p.price}</Text>
              </View>
              <View style={s.metaPill}>
                <Text style={s.metaLabel}>Current Stock</Text>
                <Text style={[s.metaVal, { color: p.stock === 0 ? colors.redLight : p.stock <= p.lowStockThreshold ? colors.amberLight : colors.greenLight }]}>
                  {p.stock} {p.unit || 'pcs'}
                </Text>
              </View>
              <View style={s.metaPill}>
                <Text style={s.metaLabel}>Threshold</Text>
                <Text style={[s.metaVal, { color: colors.text2 }]}>{p.lowStockThreshold || 5}</Text>
              </View>
            </View>

            <View style={s.actions}>
              <Btn title="Edit" variant="ghost" size="sm" onPress={() => openEdit(p)} style={{ flex: 1 }} />
              <Btn title="Delete" variant="danger" size="sm" onPress={() => del(p)} style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      />

      {/* Add / Edit Modal */}
      <AppModal visible={modal} onClose={() => setModal(false)} title={editing ? 'Edit Catalog Product' : 'Add New Product'}>
        <Input label="Product Name *" value={form.name} onChangeText={set('name')} placeholder="e.g. Organic Milk 1L" />
        <Input label="Barcode (Optional for Scanner)" value={form.barcode} onChangeText={set('barcode')} placeholder="e.g. 8901030383821" />

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Input label="Selling Price (₹) *" value={form.price} onChangeText={set('price')} keyboardType="numeric" placeholder="60" style={{ flex: 1 }} />
          <Input label="Initial Stock Qty *" value={form.stock} onChangeText={set('stock')} keyboardType="numeric" placeholder="40" style={{ flex: 1 }} />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Input label="Low Stock Alert Threshold" value={form.lowStockThreshold} onChangeText={set('lowStockThreshold')} keyboardType="numeric" placeholder="5" style={{ flex: 1 }} />
          <Input label="Category" value={form.category} onChangeText={set('category')} placeholder="Dairy, Bakery…" style={{ flex: 1 }} />
        </View>

        {/* Unit Selector */}
        <Text style={{ color: colors.text2, fontSize: 12, fontWeight: font.semibold, marginBottom: 6 }}>Unit of Measure</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md }}>
          {UNITS.map(u => (
            <TouchableOpacity
              key={u}
              onPress={() => set('unit')(u)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radius.sm,
                backgroundColor: form.unit === u ? colors.accent : colors.bg2,
                borderWidth: 1,
                borderColor: form.unit === u ? colors.accentLight : colors.border,
              }}
            >
              <Text style={{ color: form.unit === u ? colors.white : colors.text2, fontSize: 11, fontWeight: font.bold }}>
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.xl }}>
          <Btn title="Cancel" variant="ghost" onPress={() => setModal(false)} style={{ flex: 1 }} />
          <Btn title={editing ? 'Save Changes' : 'Create Product'} variant="primary" onPress={save} loading={saving} style={{ flex: 1 }} />
        </View>
      </AppModal>
    </View>
  );
}

const s = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: colors.bg },
  topBar:     { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.bg2, borderBottomWidth: 1, borderColor: colors.border, alignItems: 'center' },
  search:     { flex: 1, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border2, borderRadius: radius.md, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: 9, fontSize: 13 },
  prodCard:   { padding: spacing.md },
  prodRow:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.sm },
  prodCat:    { color: colors.text3, fontSize: 10, fontWeight: font.bold, textTransform: 'uppercase' },
  prodName:   { fontSize: 15, fontWeight: font.heavy, color: colors.text, marginTop: 2 },
  prodBarcode:{ fontSize: 11, color: colors.text3, fontFamily: 'monospace', marginTop: 3 },
  prodMeta:   { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.xs },
  metaPill:   { flex: 1, backgroundColor: colors.bg2, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  metaLabel:  { color: colors.text3, fontSize: 10, marginBottom: 2 },
  metaVal:    { fontSize: 13, fontFamily: 'monospace', fontWeight: font.bold, color: colors.text },
  actions:    { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
