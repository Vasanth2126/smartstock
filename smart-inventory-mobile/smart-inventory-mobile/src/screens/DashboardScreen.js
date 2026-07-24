import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { StatCard, Card, Badge, Spinner, Empty, SectionHeader } from '../components/UI';
import { colors, spacing, radius, font } from '../utils/theme';
import api from '../services/api';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [data, setData]         = useState(null);
  const [bills, setBills]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh]= useState(false);

  const load = async () => {
    try {
      const [r1, r2] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/bills/today'),
      ]);
      setData(r1.data);
      setBills(r2.data.bills || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <Spinner />;

  const { today, stock } = data;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting}, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={s.date}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <TouchableOpacity style={s.newBillBtn} onPress={() => navigation.navigate('POS')}>
          <Text style={s.newBillText}>+ Bill</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsGrid}>
        <StatCard icon="₹" label="Today's sales" value={`₹${today.totalSales.toLocaleString('en-IN')}`} color="green" sub={`${today.billCount} bills`} />
        <StatCard icon="🧾" label="Avg bill" value={`₹${today.avgBillValue}`} color="blue" />
        <StatCard icon="⚠️" label="Low stock" value={stock.lowStockCount} color="amber" />
        <StatCard icon="🚫" label="Out of stock" value={stock.outOfStockCount} color="red" />
      </View>

      {/* Alerts */}
      {(stock.outOfStockItems.length > 0 || stock.lowStockItems.length > 0) && (
        <Card style={{ marginBottom: spacing.lg }}>
          <SectionHeader title="Stock Alerts" action="View all" onAction={() => navigation.navigate('Alerts')} />
          {stock.outOfStockItems.slice(0, 3).map(p => (
            <View key={p._id} style={[s.alertRow, { backgroundColor: colors.redBg }]}>
              <Text style={{ color: colors.text, fontSize: 13 }}>{p.name}</Text>
              <Badge label="Out of stock" color="red" />
            </View>
          ))}
          {stock.lowStockItems.slice(0, 3).map(p => (
            <View key={p._id} style={[s.alertRow, { backgroundColor: colors.amberBg }]}>
              <Text style={{ color: colors.text, fontSize: 13 }}>{p.name} — {p.stock} left</Text>
              <Badge label="Low stock" color="amber" />
            </View>
          ))}
        </Card>
      )}

      {/* Today's bills */}
      <Card>
        <SectionHeader title="Today's bills" action="Go to POS →" onAction={() => navigation.navigate('POS')} />
        {bills.length === 0
          ? <Empty icon="🧾" title="No bills yet today" sub="Tap + Bill to start selling" />
          : bills.slice(0, 6).map(b => (
              <View key={b._id} style={s.billRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.billNum}>{b.billNumber}</Text>
                  <Text style={s.billItems} numberOfLines={1}>
                    {b.items.map(i => `${i.productName} ×${i.quantity}`).join(', ')}
                  </Text>
                </View>
                <Text style={s.billAmt}>₹{b.totalAmount}</Text>
              </View>
            ))
        }
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: colors.bg },
  content:    { padding: spacing.lg, paddingBottom: 32 },
  header:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.lg },
  greeting:   { fontSize: 18, fontWeight: font.bold, color: colors.text },
  date:       { fontSize: 12, color: colors.text2, marginTop: 2 },
  newBillBtn: { backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.sm },
  newBillText:{ color: colors.white, fontWeight: font.semibold, fontSize: 13 },
  statsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  alertRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.sm, marginBottom: spacing.sm },
  billRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.border },
  billNum:    { fontFamily: 'monospace', fontSize: 12, color: colors.accent },
  billItems:  { fontSize: 12, color: colors.text2, marginTop: 2 },
  billAmt:    { fontFamily: 'monospace', fontSize: 13, fontWeight: font.bold, color: colors.green },
});
