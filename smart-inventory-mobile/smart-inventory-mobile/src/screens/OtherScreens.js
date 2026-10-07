import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  Alert, FlatList, TouchableOpacity, StyleSheet, Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Badge, Spinner, Empty, Card,
  AppModal, Input, Btn, StatCard, SectionHeader,
  AnimatedBarChart, PillTabs,
} from '../components/UI';
import { colors, spacing, radius, font, shadows } from '../utils/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';

const callPhone = (phone) => {
  if (phone) Linking.openURL(`tel:${phone}`);
};

const sendWhatsApp = (phone) => {
  if (phone) Linking.openURL(`https://wa.me/91${phone.replace(/\D/g, '')}`);
};

// ── ALERTS SCREEN ─────────────────────────────────────────────────────────────
export function AlertsScreen({ navigation }) {
  const [data, setData]          = useState(null);
  const [loading, setLoading]    = useState(true);
  const [refreshing, setRefresh] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/reports/dashboard');
      setData(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load stock alerts' });
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <Spinner />;

  const { outOfStockItems = [], lowStockItems = [] } = data?.stock || {};
  const allClear = outOfStockItems.length === 0 && lowStockItems.length === 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefresh(true); load(); }}
          tintColor={colors.accent}
        />
      }
    >
      {/* Overview Banner */}
      <View style={[styles.alertHeaderBanner, allClear ? { backgroundColor: colors.greenBg, borderColor: colors.greenGlow } : { backgroundColor: colors.redBg, borderColor: colors.redGlow }]}>
        <Text style={{ fontSize: 24 }}>{allClear ? '✅' : '🔔'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.white, fontSize: 14, fontWeight: font.bold }}>
            {allClear ? 'Catalog Fully Stocked' : `${outOfStockItems.length + lowStockItems.length} Attention Items Detected`}
          </Text>
          <Text style={{ color: colors.text2, fontSize: 11, marginTop: 2 }}>
            {allClear ? 'All product quantities are above safety thresholds' : 'Immediate replenishment recommended to avoid sales loss'}
          </Text>
        </View>
      </View>

      {allClear ? (
        <Empty icon="✅" title="Inventory in Prime Health" sub="No depleted or low stock items found" />
      ) : (
        <>
          {outOfStockItems.length > 0 && (
            <Card glow>
              <SectionHeader title={`🚫 Depleted Items (${outOfStockItems.length})`} icon="🚫" />
              {outOfStockItems.map(p => (
                <View key={p._id} style={[styles.alertRow, { backgroundColor: colors.redBg, borderColor: colors.redGlow }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: font.bold }}>{p.name}</Text>
                    <Text style={{ color: colors.redLight, fontSize: 11, marginTop: 2 }}>Current Stock: 0 units</Text>
                  </View>
                  <Btn
                    title="Contact Supplier"
                    variant="danger"
                    size="sm"
                    onPress={() => navigation?.navigate?.('Suppliers')}
                  />
                </View>
              ))}
            </Card>
          )}

          {lowStockItems.length > 0 && (
            <Card>
              <SectionHeader title={`⚠️ Low Stock Warnings (${lowStockItems.length})`} icon="⚠️" />
              {lowStockItems.map(p => (
                <View key={p._id} style={[styles.alertRow, { backgroundColor: colors.amberBg, borderColor: colors.amberGlow }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 14, fontWeight: font.bold }}>{p.name}</Text>
                    <Text style={{ color: colors.amberLight, fontSize: 11, marginTop: 2 }}>
                      {p.stock} units remaining (Alert threshold: {p.lowStockThreshold || p.threshold || 5})
                    </Text>
                  </View>
                  <Badge label="Low Stock" color="amber" />
                </View>
              ))}
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

// ── SUPPLIERS SCREEN ──────────────────────────────────────────────────────────
const BLANK_S = { name: '', phone: '', email: '', category: '', address: '' };

export function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(BLANK_S);
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/suppliers');
      setSuppliers(data.suppliers || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load suppliers directory' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK_S);
    setModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name:     s.name,
      phone:    s.phone    || '',
      email:    s.email    || '',
      category: s.category || '',
      address:  s.address  || '',
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.name) {
      Toast.show({ type: 'error', text1: 'Supplier name is required' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/suppliers/${editing._id}`, form);
        Toast.show({ type: 'success', text1: 'Supplier updated' });
      } else {
        await api.post('/suppliers', form);
        Toast.show({ type: 'success', text1: 'Supplier added' });
      }
      setModal(false);
      load();
    } catch {
      Toast.show({ type: 'error', text1: 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const del = (s) => {
    Alert.alert('Delete Supplier', `Delete "${s.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/suppliers/${s._id}`);
            Toast.show({ type: 'success', text1: 'Supplier deleted' });
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
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.supplierTopBar}>
        <View>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: font.heavy }}>Vendor Directory</Text>
          <Text style={{ color: colors.text2, fontSize: 11, marginTop: 2 }}>{suppliers.length} active suppliers</Text>
        </View>
        <Btn title="+ Add Vendor" variant="primary" size="sm" onPress={openAdd} />
      </View>

      <FlatList
        data={suppliers}
        keyExtractor={s => s._id}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        ListEmptyComponent={<Empty icon="🚚" title="No Vendors Found" sub="Tap + Add Vendor to register suppliers" />}
        renderItem={({ item: s }) => (
          <Card style={{ padding: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: font.bold }}>{s.name}</Text>
                {s.phone && <Text style={{ color: colors.text2, fontSize: 12, marginTop: 2 }}>📞 {s.phone}</Text>}
                {s.email && <Text style={{ color: colors.text3, fontSize: 11 }}>✉️ {s.email}</Text>}
                {s.address && <Text style={{ color: colors.text3, fontSize: 11 }}>📍 {s.address}</Text>}
              </View>
              <Badge label={s.category || 'Vendor'} color="blue" />
            </View>

            {/* Quick Action Dial / WhatsApp Buttons */}
            {s.phone ? (
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm }}>
                <Btn
                  title="Direct Call"
                  variant="success"
                  size="sm"
                  onPress={() => callPhone(s.phone)}
                  style={{ flex: 1 }}
                  icon="📞"
                />
                <Btn
                  title="WhatsApp"
                  variant="primary"
                  size="sm"
                  onPress={() => sendWhatsApp(s.phone)}
                  style={{ flex: 1 }}
                  icon="💬"
                />
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 2 }}>
              <Btn title="Edit Details" variant="ghost" size="sm" onPress={() => openEdit(s)} style={{ flex: 1 }} />
              <Btn title="Delete" variant="danger" size="sm" onPress={() => del(s)} style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      />

      <AppModal visible={modal} onClose={() => setModal(false)} title={editing ? 'Edit Supplier' : 'Add New Supplier'}>
        <Input label="Supplier / Company Name *" value={form.name} onChangeText={set('name')} placeholder="e.g. Amul Dairy Logistics" />
        <Input label="Phone Number" value={form.phone} onChangeText={set('phone')} placeholder="e.g. 9876543210" keyboardType="phone-pad" />
        <Input label="Email Address" value={form.email} onChangeText={set('email')} placeholder="supplier@trade.com" keyboardType="email-address" autoCapitalize="none" />
        <Input label="Category" value={form.category} onChangeText={set('category')} placeholder="Dairy, Beverages, FMCG…" />
        <Input label="Address / Warehouse Location" value={form.address} onChangeText={set('address')} placeholder="City / Street" />

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.xl }}>
          <Btn title="Cancel" variant="ghost" onPress={() => setModal(false)} style={{ flex: 1 }} />
          <Btn title={editing ? 'Save Changes' : 'Add Vendor'} variant="primary" onPress={save} loading={saving} style={{ flex: 1 }} />
        </View>
      </AppModal>
    </View>
  );
}

// ── REPORTS & GRAPHICAL ANALYTICS SCREEN ──────────────────────────────────────
export function ReportsScreen() {
  const [summary, setSummary]   = useState(null);
  const [sales, setSales]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [period, setPeriod]     = useState('7'); // '1', '7', '30'

  const loadReports = (days = period) => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const pastDays = days === '1' ? 0 : days === '7' ? 6 : 29;
    const fromDate = new Date(Date.now() - pastDays * 864e5).toISOString().split('T')[0];

    Promise.all([
      api.get('/reports/dashboard'),
      api.get(`/reports/sales?from=${fromDate}&to=${today}`),
    ]).then(([r1, r2]) => {
      setSummary(r1.data);
      setSales(r2.data);
    }).catch(() => {
      Toast.show({ type: 'error', text1: 'Failed to load report analytics' });
    }).finally(() => setLoading(false));
  };

  useFocusEffect(useCallback(() => {
    loadReports(period);
  }, [period]));

  if (loading) return <Spinner />;

  const { today = {} } = summary || {};
  const dailySales = sales?.dailySales || [];
  const topProducts = sales?.topProducts || [];

  // Format daily sales for graphical animated bar chart
  const chartData = dailySales.map(d => {
    const dt = new Date(d.date + 'T00:00:00');
    const label = dt.toLocaleDateString('en-IN', { weekday: 'narrow', day: 'numeric' });
    return {
      label,
      value: d.total || 0,
      color: colors.accent,
    };
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 32 }}
    >
      {/* Date Period Selector */}
      <View style={{ backgroundColor: colors.bg2, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }}>
        <PillTabs
          tabs={[
            { key: '1',  label: '📅 Today' },
            { key: '7',  label: '📊 Last 7 Days' },
            { key: '30', label: '📈 Last 30 Days' },
          ]}
          activeTab={period}
          onSelect={setPeriod}
        />
      </View>

      {/* KPI Cards Grid */}
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <StatCard icon="₹" label="Today Sales" value={`₹${(today.totalSales || 0).toLocaleString('en-IN')}`} color="green" />
        <StatCard icon="🧾" label="Bills Today" value={today.billCount || 0} color="blue" />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <StatCard icon="📦" label={`Period Revenue (${period}d)`} value={`₹${(sales?.totalRevenue || 0).toLocaleString('en-IN')}`} color="purple" />
        <StatCard icon="📈" label="Avg Bill Value" value={`₹${today.avgBillValue || 0}`} color="cyan" />
      </View>

      {/* Animated Graphical Daily Sales Bar Chart */}
      <Card glow>
        <SectionHeader title="Daily Sales Revenue Trend (₹)" icon="📊" />
        <AnimatedBarChart data={chartData} height={180} barColor={colors.accentLight} />
      </Card>

      {/* Top Products Leaderboard */}
      <Card>
        <SectionHeader title="Top Performing Products" icon="🏆" />
        {topProducts.length === 0 ? (
          <Empty icon="📊" title="No Product Sales in Period" />
        ) : (
          topProducts.slice(0, 8).map((p, i) => (
            <View key={i} style={styles.rankRow}>
              <View style={[styles.rankBadge, i < 3 && { backgroundColor: colors.accent, borderColor: colors.accentLight }]}>
                <Text style={{ color: colors.white, fontSize: 11, fontWeight: font.bold, fontFamily: 'monospace' }}>
                  {i + 1}
                </Text>
              </View>
              <View style={{ flex: 1, marginHorizontal: spacing.sm }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: font.semibold }}>{p.name}</Text>
                <Text style={{ color: colors.text2, fontSize: 11 }}>{p.qty} units sold</Text>
              </View>
              <Text style={{ color: colors.greenLight, fontFamily: 'monospace', fontSize: 14, fontWeight: font.heavy }}>
                ₹{(p.revenue || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          ))
        )}
      </Card>

      {/* Daily Breakdown List */}
      <Card>
        <SectionHeader title="Daily Summary Breakdown" icon="📋" />
        {dailySales.length === 0 ? (
          <Empty icon="📉" title="No Daily Records" />
        ) : (
          [...dailySales].reverse().map((d, i) => (
            <View key={i} style={styles.dailyRow}>
              <View>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: font.medium }}>
                  {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </Text>
                <Text style={{ color: colors.text3, fontSize: 11 }}>{d.count} transactions</Text>
              </View>
              <Text style={{ color: colors.greenLight, fontFamily: 'monospace', fontSize: 14, fontWeight: font.bold }}>
                ₹{(d.total || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  alertHeaderBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, ...shadows.card },
  alertRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.xs },
  supplierTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, backgroundColor: colors.bg2, borderBottomWidth: 1, borderColor: colors.border },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.border },
  rankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bg3, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border2 },
  dailyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.border },
});