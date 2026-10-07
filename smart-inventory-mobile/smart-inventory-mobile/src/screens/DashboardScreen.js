import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { StatCard, Card, Badge, Spinner, Empty, SectionHeader, HealthRingMeter, Btn } from '../components/UI';
import { colors, spacing, radius, font, shadows } from '../utils/theme';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [data, setData]          = useState(null);
  const [bills, setBills]        = useState([]);
  const [loading, setLoading]    = useState(true);
  const [refreshing, setRefresh] = useState(false);

  const load = async () => {
    try {
      const [r1, r2] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/bills/today'),
      ]);
      setData(r1.data);
      setBills(r2.data.bills || []);
    } catch (e) {
      console.error('Error loading dashboard data', e);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <Spinner />;

  const { today = {}, stock = {} } = data || {};
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const outOfStockCount = stock?.outOfStockCount || (stock?.outOfStockItems || []).length || 0;
  const lowStockCount = stock?.lowStockCount || (stock?.lowStockItems || []).length || 0;
  const totalStockCount = stock?.totalProducts || 24;
  const inStockCount = Math.max(0, totalStockCount - outOfStockCount - lowStockCount);

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor={colors.accent} />}
    >
      {/* Top Welcome Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.greeting}>{greeting}, {user?.name?.split(' ')[0]} 👋</Text>
          </View>
          <Text style={s.date}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
          <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Badge label={user?.shopName || 'SmartStock POS'} color="blue" />
            <Badge label={user?.role?.toUpperCase() || 'USER'} color={user?.role === 'superadmin' ? 'purple' : user?.role === 'owner' ? 'green' : 'default'} />
          </View>
        </View>

        <Btn
          title="+ New Bill"
          variant="primary"
          size="sm"
          onPress={() => navigation.navigate('POS')}
        />
      </View>

      {/* AI Demand Forecasting Spotlight Banner */}
      <TouchableOpacity 
        style={s.aiCard}
        onPress={() => navigation.navigate('AI Demand')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.25)', 'rgba(99, 102, 241, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.aiGradient}
        >
          <Text style={{ fontSize: 26 }}>✨</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.aiTitle}>SmartStock AI Demand Intelligence</Text>
              <Badge label="AI Active" color="purple" />
            </View>
            <Text style={s.aiSub}>Predictive 30-day velocity algorithms & runout risk warnings</Text>
          </View>
          <Text style={s.aiArrow}>→</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Quick Action Matrix */}
      <View style={s.quickActionsRow}>
        <TouchableOpacity style={s.actionTile} onPress={() => navigation.navigate('POS')} activeOpacity={0.75}>
          <View style={[s.actionIconWrap, { backgroundColor: colors.greenBg, borderColor: colors.greenGlow }]}>
            <Text style={s.actionIcon}>🧾</Text>
          </View>
          <Text style={s.actionText}>POS Billing</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.actionTile} onPress={() => navigation.navigate('AI Demand')} activeOpacity={0.75}>
          <View style={[s.actionIconWrap, { backgroundColor: colors.purpleBg, borderColor: colors.purpleGlow }]}>
            <Text style={s.actionIcon}>🔮</Text>
          </View>
          <Text style={s.actionText}>AI Forecast</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.actionTile} onPress={() => navigation.navigate('Products')} activeOpacity={0.75}>
          <View style={[s.actionIconWrap, { backgroundColor: colors.accentBg, borderColor: colors.accentGlow }]}>
            <Text style={s.actionIcon}>📦</Text>
          </View>
          <Text style={s.actionText}>Products</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.actionTile} onPress={() => navigation.navigate('Alerts')} activeOpacity={0.75}>
          <View style={[s.actionIconWrap, { backgroundColor: colors.amberBg, borderColor: colors.amberGlow }]}>
            <Text style={s.actionIcon}>🔔</Text>
          </View>
          <Text style={s.actionText}>Stock Alerts</Text>
          {(outOfStockCount > 0 || lowStockCount > 0) && (
            <View style={s.badgeDot} />
          )}
        </TouchableOpacity>
      </View>

      {/* Graphical Stock Health Ring */}
      <View style={{ marginBottom: spacing.md }}>
        <HealthRingMeter
          inStock={inStockCount}
          lowStock={lowStockCount}
          outOfStock={outOfStockCount}
        />
      </View>

      {/* KPI Stats Grid */}
      <View style={s.statsGrid}>
        <StatCard
          icon="₹"
          label="Today's Revenue"
          value={`₹${(today?.totalSales || 0).toLocaleString('en-IN')}`}
          color="green"
          sub={`${today?.billCount || 0} bills processed today`}
        />
        <StatCard
          icon="🧾"
          label="Average Ticket"
          value={`₹${today?.avgBillValue || 0}`}
          color="blue"
          sub="Per transaction"
        />
      </View>

      <View style={s.statsGrid}>
        <StatCard
          icon="⚠️"
          label="Low Stock Warning"
          value={lowStockCount}
          color="amber"
          sub="Approaching threshold"
        />
        <StatCard
          icon="🚫"
          label="Stock Run-Outs"
          value={outOfStockCount}
          color="red"
          sub="Immediate reorder needed"
        />
      </View>

      {/* Inventory Alerts Quick Drawer */}
      {(outOfStockCount > 0 || lowStockCount > 0) && (
        <Card style={{ marginBottom: spacing.md }} glow>
          <SectionHeader
            title="Critical Stock Alerts"
            action="View All Alerts →"
            onAction={() => navigation.navigate('Alerts')}
            icon="⚠️"
          />
          {(stock?.outOfStockItems || []).slice(0, 3).map(p => (
            <View key={p._id} style={[s.alertRow, { backgroundColor: colors.redBg, borderColor: colors.redGlow }]}>
              <View>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: font.bold }}>{p.name}</Text>
                <Text style={{ color: colors.redLight, fontSize: 11, marginTop: 2 }}>Stock depleted (0 units)</Text>
              </View>
              <Badge label="Reorder" color="red" />
            </View>
          ))}
          {(stock?.lowStockItems || []).slice(0, 3).map(p => (
            <View key={p._id} style={[s.alertRow, { backgroundColor: colors.amberBg, borderColor: colors.amberGlow }]}>
              <View>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: font.bold }}>{p.name}</Text>
                <Text style={{ color: colors.amberLight, fontSize: 11, marginTop: 2 }}>{p.stock} remaining (Alert at {p.lowStockThreshold || p.threshold})</Text>
              </View>
              <Badge label="Low Stock" color="amber" />
            </View>
          ))}
        </Card>
      )}

      {/* Today's Transactions Timeline */}
      <Card>
        <SectionHeader
          title="Today's POS Transactions"
          action="Go to POS →"
          onAction={() => navigation.navigate('POS')}
          icon="🧾"
        />
        {bills.length === 0 ? (
          <Empty icon="🧾" title="No POS Sales Today" sub="Tap + New Bill to checkout customer transactions" />
        ) : (
          bills.slice(0, 6).map(b => (
            <View key={b._id} style={s.billRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.billNum}>{b.billNumber}</Text>
                  <Badge label={b.paymentMethod ? b.paymentMethod.toUpperCase() : 'CASH'} color="blue" />
                </View>
                <Text style={s.billItems} numberOfLines={1}>
                  {b.items.map(i => `${i.productName} (×${i.quantity})`).join(', ')}
                </Text>
              </View>
              <Text style={s.billAmt}>₹{b.totalAmount}</Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: colors.bg },
  content:    { padding: spacing.md, paddingBottom: 32 },
  header:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },
  greeting:   { fontSize: 18, fontWeight: font.heavy, color: colors.text },
  date:       { fontSize: 12, color: colors.text2, marginTop: 2 },
  
  aiCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.purpleGlow,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  aiGradient: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  aiTitle: { color: colors.white, fontSize: 13, fontWeight: font.bold },
  aiSub: { color: colors.text2, fontSize: 11, marginTop: 2 },
  aiArrow: { color: colors.purpleLight, fontSize: 18, fontWeight: font.heavy },

  quickActionsRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  actionTile: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shadows.card,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 6,
  },
  actionIcon: { fontSize: 18 },
  actionText: { color: colors.text, fontSize: 11, fontWeight: font.semibold },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.amber,
  },

  statsGrid:  { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  alertRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.xs },
  billRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.border },
  billNum:    { fontFamily: 'monospace', fontSize: 12, color: colors.accentLight, fontWeight: font.bold },
  billItems:  { fontSize: 11, color: colors.text2, marginTop: 3 },
  billAmt:    { fontFamily: 'monospace', fontSize: 15, fontWeight: font.heavy, color: colors.greenLight },
});