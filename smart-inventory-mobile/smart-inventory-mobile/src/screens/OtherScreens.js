// ── AlertsScreen ──────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Badge, Spinner, Empty, Card } from '../components/UI';
import { colors, spacing, radius, font } from '../utils/theme';
import api from '../services/api';

export function AlertsScreen() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh]= useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/reports/dashboard');
      setData(data);
    } finally { setLoading(false); setRefresh(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <Spinner />;
  const { outOfStockItems, lowStockItems } = data.stock;
  const allClear = outOfStockItems.length === 0 && lowStockItems.length === 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor={colors.accent} />}
    >
      {allClear
        ? <Empty icon="✅" title="All products well stocked" sub="No alerts right now" />
        : <>
            {outOfStockItems.length > 0 && (
              <>
                <Text style={a.sectionTitle(colors.red)}>🚫 Out of stock ({outOfStockItems.length})</Text>
                {outOfStockItems.map(p => (
                  <View key={p._id} style={[a.alertRow, { backgroundColor: colors.redBg, borderColor: 'rgba(248,113,113,0.2)' }]}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: font.medium }}>{p.name}</Text>
                    <Badge label="Reorder now" color="red" />
                  </View>
                ))}
              </>
            )}
            {lowStockItems.length > 0 && (
              <>
                <Text style={[a.sectionTitle(colors.amber), { marginTop: spacing.lg }]}>⚠️ Low stock ({lowStockItems.length})</Text>
                {lowStockItems.map(p => (
                  <View key={p._id} style={[a.alertRow, { backgroundColor: colors.amberBg, borderColor: 'rgba(251,191,36,0.2)' }]}>
                    <View>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: font.medium }}>{p.name}</Text>
                      <Text style={{ color: colors.text2, fontSize: 12, marginTop: 2 }}>{p.stock} remaining · threshold {p.threshold}</Text>
                    </View>
                    <Badge label="Low stock" color="amber" />
                  </View>
                ))}
              </>
            )}
          </>
      }
    </ScrollView>
  );
}

const a = {
  sectionTitle: (color) => ({ fontSize: 13, fontWeight: font.semibold, color, marginBottom: spacing.sm }),
  alertRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.sm, borderWidth: 1, marginBottom: spacing.sm },
};


// ── SuppliersScreen ───────────────────────────────────────────────────────────
import { Alert, FlatList, TouchableOpacity } from 'react-native';
import { AppModal, Input, Btn } from '../components/UI';
import Toast from 'react-native-toast-message';

const BLANK_S = { name: '', phone: '', email: '', category: '', address: '' };

export function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(BLANK_S);
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    try { const { data } = await api.get('/suppliers'); setSuppliers(data.suppliers); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const set = k => v => setForm(f => ({ ...f, [k]: v }));
  const openAdd  = () => { setEditing(null); setForm(BLANK_S); setModal(true); };
  const openEdit = s => { setEditing(s); setForm({ name: s.name, phone: s.phone || '', email: s.email || '', category: s.category || '', address: s.address || '' }); setModal(true); };

  const save = async () => {
    if (!form.name) { Toast.show({ type: 'error', text1: 'Supplier name required' }); return; }
    setSaving(true);
    try {
      if (editing) { await api.put(`/suppliers/${editing._id}`, form); Toast.show({ type: 'success', text1: 'Updated' }); }
      else          { await api.post('/suppliers', form); Toast.show({ type: 'success', text1: 'Supplier added' }); }
      setModal(false); load();
    } catch { Toast.show({ type: 'error', text1: 'Save failed' }); }
    finally { setSaving(false); }
  };

  const del = s => Alert.alert('Delete', `Delete "${s.name}"?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await api.delete(`/suppliers/${s._id}`); Toast.show({ type: 'success', text1: 'Deleted' }); load(); }
      catch { Toast.show({ type: 'error', text1: 'Delete failed' }); }
    }},
  ]);

  if (loading) return <Spinner />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.md, borderBottomWidth: 1, borderColor: colors.border }}>
        <Btn title="+ Add Supplier" variant="primary" onPress={openAdd} />
      </View>
      <FlatList
        data={suppliers}
        keyExtractor={s => s._id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        renderItem={({ item: s }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: font.semibold }}>{s.name}</Text>
                {s.phone    && <Text style={{ color: colors.text2, fontSize: 12, marginTop: 2 }}>📞 {s.phone}</Text>}
                {s.category && <Text style={{ color: colors.text2, fontSize: 12 }}>📦 {s.category}</Text>}
              </View>
              <Badge label={s.category || 'Supplier'} color="blue" />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Btn title="Edit"   variant="ghost"  size="sm" onPress={() => openEdit(s)} style={{ flex: 1 }} />
              <Btn title="Delete" variant="danger" size="sm" onPress={() => del(s)}      style={{ flex: 1 }} />
            </View>
          </Card>
        )}
        ListEmptyComponent={<Empty icon="🚚" title="No suppliers yet" sub="Tap + Add Supplier" />}
      />
      <AppModal visible={modal} onClose={() => setModal(false)} title={editing ? 'Edit supplier' : 'Add supplier'}>
        <Input label="Supplier name *" value={form.name}     onChangeText={set('name')}     placeholder="Amul Dairy" />
        <Input label="Phone"           value={form.phone}    onChangeText={set('phone')}    placeholder="9876543210" keyboardType="phone-pad" />
        <Input label="Email"           value={form.email}    onChangeText={set('email')}    placeholder="supplier@email.com" keyboardType="email-address" />
        <Input label="Category"        value={form.category} onChangeText={set('category')} placeholder="Dairy, Grains…" />
        <Input label="Address"         value={form.address}  onChangeText={set('address')}  placeholder="Optional" />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Btn title="Cancel" variant="ghost"   onPress={() => setModal(false)} style={{ flex: 1 }} />
          <Btn title="Save"   variant="primary" onPress={save} loading={saving} style={{ flex: 1 }} />
        </View>
      </AppModal>
    </View>
  );
}


// ── ReportsScreen ─────────────────────────────────────────────────────────────
export function ReportsScreen() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales]     = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const week  = new Date(Date.now() - 6 * 864e5).toISOString().split('T')[0];
    Promise.all([
      api.get('/reports/dashboard'),
      api.get(`/reports/sales?from=${week}&to=${today}`),
    ]).then(([r1, r2]) => { setSummary(r1.data); setSales(r2.data); }).finally(() => setLoading(false));
  }, []));

  if (loading) return <Spinner />;
  const { today } = summary;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      {/* Stats */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <View style={{ width: '47%' }}><StatCard icon="₹" label="Today's revenue"  value={`₹${today.totalSales.toLocaleString('en-IN')}`} color="green" /></View>
        <View style={{ width: '47%' }}><StatCard icon="🧾" label="Bills today"      value={today.billCount}       color="blue" /></View>
        <View style={{ width: '47%' }}><StatCard icon="📦" label="7-day revenue"    value={`₹${(sales?.totalRevenue || 0).toLocaleString('en-IN')}`} color="purple" /></View>
        <View style={{ width: '47%' }}><StatCard icon="📈" label="Avg bill value"   value={`₹${today.avgBillValue}`} /></View>
      </View>

      {/* Top products */}
      <Card>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: font.semibold, marginBottom: spacing.md }}>Top products (7 days)</Text>
        {(sales?.topProducts || []).length === 0
          ? <Empty icon="📊" title="No sales yet" />
          : sales.topProducts.slice(0, 8).map((p, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: i < sales.topProducts.length - 1 ? 1 : 0, borderColor: colors.border }}>
                <Text style={{ color: colors.text3, fontFamily: 'monospace', fontSize: 12, width: 24 }}>{i + 1}</Text>
                <Text style={{ flex: 1, color: colors.text, fontSize: 13 }}>{p.name}</Text>
                <Text style={{ color: colors.text2, fontSize: 12, marginRight: spacing.md }}>{p.qty} sold</Text>
                <Text style={{ color: colors.green, fontFamily: 'monospace', fontSize: 13, fontWeight: font.bold }}>₹{p.revenue.toLocaleString('en-IN')}</Text>
              </View>
            ))
        }
      </Card>

      {/* Daily sales */}
      <Card>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: font.semibold, marginBottom: spacing.md }}>Daily breakdown (7 days)</Text>
        {(sales?.dailySales || []).length === 0
          ? <Empty icon="📉" title="No sales in this period" />
          : [...(sales.dailySales)].reverse().map((d, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.text2, fontSize: 13 }}>{new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                <Text style={{ color: colors.text2, fontSize: 12 }}>{d.count} bills</Text>
                <Text style={{ color: colors.green, fontFamily: 'monospace', fontSize: 13, fontWeight: font.bold }}>₹{d.total.toLocaleString('en-IN')}</Text>
              </View>
            ))
        }
      </Card>
    </ScrollView>
  );
}

// re-export StatCard for Reports (already imported from UI but easier here)
import { StatCard } from '../components/UI';
