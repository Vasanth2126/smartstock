import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, StyleSheet, TextInput, Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Badge, Spinner, Empty, Card, StatCard,
  Btn, SectionHeader, PillTabs, AnimatedBarChart
} from '../components/UI';
import { colors, spacing, radius, font, shadows } from '../utils/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';

export default function SuperAdminScreen({ initialTab = 'shops' }) {
  const [stats, setStats]         = useState(null);
  const [shops, setShops]         = useState([]);
  const [users, setUsers]         = useState([]);
  const [tab, setTab]             = useState(initialTab); // 'shops', 'users', 'overview'
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('all'); // 'all', 'active', 'blocked'
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);
  const [detail, setDetail]       = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadAll = async () => {
    try {
      const [s, sh, u] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/shops'),
        api.get('/admin/users'),
      ]);
      setStats(s.data.stats);
      setShops(sh.data.shops || []);
      setUsers(u.data.users || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load Super Admin portal data' });
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  const toggleUser = async (userId, userName, currentStatus) => {
    try {
      const { data } = await api.patch(`/admin/users/${userId}/toggle`);
      Toast.show({
        type: 'success',
        text1: `${userName} is now ${currentStatus ? 'Blocked' : 'Active'}`,
      });
      loadAll();
      if (detail && detail.owner?._id === userId) {
        setDetail(d => ({
          ...d,
          owner: { ...d.owner, isActive: !d.owner.isActive },
        }));
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Action failed' });
    }
  };

  const loadDetail = async (ownerId) => {
    setDetailLoading(true);
    setDetailModal(true);
    try {
      const { data } = await api.get(`/admin/shops/${ownerId}`);
      setDetail(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load shop inspection details' });
      setDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredShops = shops.filter(s => {
    const matchesSearch = !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.shopName?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter === 'active') return s.isActive === true;
    if (statusFilter === 'blocked') return s.isActive === false;
    return true;
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      (u.shopName || u.owner?.shopName || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return u.isActive === true;
    if (statusFilter === 'blocked') return u.isActive === false;
    return true;
  });

  if (loading) return <Spinner />;

  // Format 7-day sales chart for inspection modal
  const chartData = (detail?.sales?.sevenDays?.daily || []).map(d => {
    const dt = new Date(d.date + 'T00:00:00');
    const label = dt.toLocaleDateString('en-IN', { weekday: 'narrow', day: 'numeric' });
    return {
      label,
      value: d.total || 0,
      color: colors.greenLight,
    };
  });

  return (
    <View style={s.container}>
      {/* Top Super Admin Banner */}
      <View style={s.headerBanner}>
        <View style={s.crownBadge}>
          <Text style={{ fontSize: 20 }}>👑</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Super Admin Portal</Text>
          <Text style={s.headerSub}>Shop governance, sales surveillance & access control</Text>
        </View>
      </View>

      {/* Navigation Pills (Shops & Sales vs Platform Users) */}
      <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.bg2 }}>
        <PillTabs
          tabs={[
            { key: 'shops', label: `🏪 Shops & Sales (${shops.length})` },
            { key: 'users', label: `👥 Platform Users (${users.length})` },
          ]}
          activeTab={tab}
          onSelect={setTab}
        />
      </View>

      {/* Search & Status Filters */}
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.xs, gap: spacing.xs }}>
        <TextInput
          style={s.search}
          placeholder={tab === 'shops' ? 'Search shops by name, owner, or email…' : 'Search users by name, email, role…'}
          placeholderTextColor={colors.text3}
          value={search}
          onChangeText={setSearch}
        />

        <PillTabs
          tabs={[
            { key: 'all',     label: 'All' },
            { key: 'active',  label: '✅ Active Only' },
            { key: 'blocked', label: '🚫 Blocked Only' },
          ]}
          activeTab={statusFilter}
          onSelect={setStatus}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); loadAll(); }} tintColor={colors.accent} />}
      >
        {/* SHOPS & SALES TAB */}
        {tab === 'shops' && (
          filteredShops.length === 0 ? (
            <Empty icon="🏪" title="No Shops Found" sub="No shops match your search criteria" />
          ) : (
            filteredShops.map(s => {
              const sales = s.sales || {};
              const todayRev = sales.today?.revenue || 0;
              const todayBills = sales.today?.count || 0;
              const sevenDayRev = sales.sevenDays?.revenue || 0;
              const sevenDayBills = sales.sevenDays?.count || 0;
              const monthlyRev = sales.monthly?.revenue || 0;
              const monthlyBills = sales.monthly?.count || 0;

              return (
                <Card key={s._id} style={{ padding: spacing.md }} glow={!s.isActive}>
                  {/* Shop Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 16, fontWeight: font.heavy }}>{s.shopName || s.name}</Text>
                      <Text style={{ color: colors.text2, fontSize: 12, marginTop: 2 }}>Owner: {s.name} ({s.email})</Text>
                      <Text style={{ color: colors.text3, fontSize: 11, marginTop: 1 }}>
                        Registered: {new Date(s.createdAt).toLocaleDateString('en-IN')} · {s.productCount || 0} Products · {s.staffCount || 0} Staff
                      </Text>
                    </View>
                    <Badge label={s.isActive ? '● Active' : '✕ Blocked'} color={s.isActive ? 'green' : 'red'} />
                  </View>

                  {/* Sales Performance Breakdown (Today, 7 Days, Monthly) */}
                  <Text style={styles.salesHeader}>📊 SALES PERFORMANCE BREAKDOWN</Text>
                  <View style={styles.salesMatrix}>
                    {/* Everyday / Today */}
                    <View style={styles.salesTile}>
                      <Text style={styles.salesLabel}>📅 Everyday (Today)</Text>
                      <Text style={styles.salesVal}>₹{todayRev.toLocaleString('en-IN')}</Text>
                      <Text style={styles.salesSub}>{todayBills} bills today</Text>
                    </View>

                    {/* 7 Days */}
                    <View style={styles.salesTile}>
                      <Text style={styles.salesLabel}>📊 Last 7 Days</Text>
                      <Text style={[styles.salesVal, { color: colors.accentLight }]}>₹{sevenDayRev.toLocaleString('en-IN')}</Text>
                      <Text style={styles.salesSub}>{sevenDayBills} bills in 7d</Text>
                    </View>

                    {/* Monthly */}
                    <View style={styles.salesTile}>
                      <Text style={styles.salesLabel}>📈 Monthly (30 Days)</Text>
                      <Text style={[styles.salesVal, { color: colors.purpleLight }]}>₹{monthlyRev.toLocaleString('en-IN')}</Text>
                      <Text style={styles.salesSub}>{monthlyBills} bills in 30d</Text>
                    </View>
                  </View>

                  {/* Actions (Inspect & Block/Unblock) */}
                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                    <Btn
                      title="Inspect Sales & Staff →"
                      variant="ghost"
                      size="sm"
                      onPress={() => loadDetail(s._id)}
                      style={{ flex: 1 }}
                    />
                    <Btn
                      title={s.isActive ? '🚫 Block Shop' : '✅ Unblock Shop'}
                      variant={s.isActive ? 'danger' : 'success'}
                      size="sm"
                      onPress={() => toggleUser(s._id, s.shopName || s.name, s.isActive)}
                      style={{ flex: 1 }}
                    />
                  </View>
                </Card>
              );
            })
          )
        )}

        {/* PLATFORM USERS TAB */}
        {tab === 'users' && (
          filteredUsers.length === 0 ? (
            <Empty icon="👥" title="No Users Found" sub="Try a different search or filter" />
          ) : (
            filteredUsers.map(u => (
              <Card key={u._id} style={{ padding: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: font.bold }}>{u.name}</Text>
                      <Badge
                        label={u.role.toUpperCase()}
                        color={u.role === 'superadmin' ? 'purple' : u.role === 'owner' ? 'blue' : 'default'}
                      />
                    </View>
                    <Text style={{ color: colors.text2, fontSize: 12, marginTop: 2 }}>{u.email}</Text>
                    <Text style={{ color: colors.text3, fontSize: 11, marginTop: 2 }}>
                      Store: {u.shopName || u.owner?.shopName || 'Platform HQ'} · Joined: {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                  <Badge label={u.isActive ? 'Active' : 'Blocked'} color={u.isActive ? 'green' : 'red'} />
                </View>

                {u.role !== 'superadmin' ? (
                  <View style={{ marginTop: spacing.sm, borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing.xs }}>
                    <Btn
                      title={u.isActive ? '🚫 Block User' : '✅ Unblock User'}
                      variant={u.isActive ? 'danger' : 'success'}
                      size="sm"
                      onPress={() => toggleUser(u._id, u.name, u.isActive)}
                    />
                  </View>
                ) : (
                  <Text style={{ color: colors.text3, fontSize: 10, marginTop: 4, fontStyle: 'italic' }}>
                    Super Admin master account cannot be blocked.
                  </Text>
                )}
              </Card>
            ))
          )
        )}
      </ScrollView>

      {/* Shop Inspection Detail Modal */}
      <Modal visible={detailModal} animationType="slide" onRequestClose={() => setDetailModal(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: font.heavy }}>Store Sales & Audit Detail</Text>
            <TouchableOpacity onPress={() => setDetailModal(false)} style={{ padding: 4 }}>
              <Text style={{ color: colors.text2, fontSize: 20 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {detailLoading ? <Spinner /> : detail && (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 40 }}>
              {/* Owner & Shop Summary */}
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: font.heavy }}>
                      {detail.owner.shopName || detail.owner.name}
                    </Text>
                    <Text style={{ color: colors.text2, fontSize: 13, marginTop: 2 }}>
                      Owner: {detail.owner.name} ({detail.owner.email})
                    </Text>
                    <Text style={{ color: colors.text3, fontSize: 11, marginTop: 2 }}>
                      Joined on {new Date(detail.owner.createdAt).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                  <Badge label={detail.owner.isActive ? 'Active Shop' : 'Blocked Shop'} color={detail.owner.isActive ? 'green' : 'red'} />
                </View>

                {/* Block / Unblock Action Button */}
                <Btn
                  title={detail.owner.isActive ? '🚫 Block This Entire Shop' : '✅ Unblock This Shop'}
                  variant={detail.owner.isActive ? 'danger' : 'success'}
                  size="md"
                  onPress={() => toggleUser(detail.owner._id, detail.owner.shopName || detail.owner.name, detail.owner.isActive)}
                  style={{ marginTop: spacing.md }}
                />
              </Card>

              {/* Exact Sales Breakdown (Everyday, 7-Day, Monthly, All-time) */}
              <Card glow>
                <SectionHeader title="Store Sales Performance Breakdown" icon="📊" />
                <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs }}>
                  <StatCard
                    icon="📅"
                    label="Today (Everyday)"
                    value={`₹${(detail.sales?.today?.revenue || 0).toLocaleString('en-IN')}`}
                    color="green"
                    sub={`${detail.sales?.today?.count || 0} bills today`}
                  />
                  <StatCard
                    icon="📊"
                    label="Last 7 Days"
                    value={`₹${(detail.sales?.sevenDays?.revenue || 0).toLocaleString('en-IN')}`}
                    color="blue"
                    sub={`${detail.sales?.sevenDays?.count || 0} bills in 7d`}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                  <StatCard
                    icon="📈"
                    label="Monthly (30 Days)"
                    value={`₹${(detail.sales?.monthly?.revenue || 0).toLocaleString('en-IN')}`}
                    color="purple"
                    sub={`${detail.sales?.monthly?.count || 0} bills in 30d`}
                  />
                  <StatCard
                    icon="💰"
                    label="All-Time Revenue"
                    value={`₹${(detail.sales?.allTime?.revenue || 0).toLocaleString('en-IN')}`}
                    color="cyan"
                    sub={`${detail.summary?.totalBills || 0} total bills`}
                  />
                </View>

                {/* 7-Day Sales Trend Bar Chart */}
                <View style={{ marginTop: spacing.md }}>
                  <Text style={{ color: colors.text2, fontSize: 12, fontWeight: font.bold, marginBottom: 4 }}>7-Day Daily Sales Trend (₹)</Text>
                  <AnimatedBarChart data={chartData} height={160} barColor={colors.greenLight} />
                </View>
              </Card>

              {/* Staff Registered in this Store */}
              <Card>
                <SectionHeader title={`Store Staff (${detail.staff?.length || 0})`} icon="👥" />
                {(detail.staff || []).length === 0 ? (
                  <Text style={{ color: colors.text3, fontSize: 12 }}>No staff registered for this store</Text>
                ) : (
                  detail.staff.map(st => (
                    <View key={st._id} style={styles.staffRow}>
                      <View>
                        <Text style={{ color: colors.text, fontSize: 13, fontWeight: font.bold }}>{st.name}</Text>
                        <Text style={{ color: colors.text2, fontSize: 11 }}>{st.email}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => toggleUser(st._id, st.name, st.isActive)}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: radius.sm,
                          backgroundColor: st.isActive ? colors.redBg : colors.greenBg,
                        }}
                      >
                        <Text style={{ color: st.isActive ? colors.redLight : colors.greenLight, fontSize: 11, fontWeight: font.bold }}>
                          {st.isActive ? 'Block Staff' : 'Unblock Staff'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </Card>

              {/* Recent Bills Issued */}
              <Card>
                <SectionHeader title="Recent Transaction History" icon="🧾" />
                {(detail.recentBills || []).length === 0 ? (
                  <Text style={{ color: colors.text3, fontSize: 12 }}>No transactions issued yet</Text>
                ) : (
                  detail.recentBills.map(b => (
                    <View key={b._id} style={styles.billRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.accentLight, fontFamily: 'monospace', fontSize: 12, fontWeight: font.bold }}>{b.billNumber}</Text>
                        <Text style={{ color: colors.text3, fontSize: 11, marginTop: 1 }}>
                          {b.billDate || new Date(b.createdAt).toLocaleDateString('en-IN')} · Mode: {b.paymentMethod?.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={{ color: colors.greenLight, fontFamily: 'monospace', fontSize: 14, fontWeight: font.bold }}>
                        ₹{b.totalAmount}
                      </Text>
                    </View>
                  ))
                )}
              </Card>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg },
  headerBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: colors.purpleBg, borderBottomWidth: 1, borderColor: colors.purpleGlow },
  crownBadge:   { width: 40, height: 40, borderRadius: radius.md, backgroundColor: 'rgba(168,85,247,0.3)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.purpleLight },
  headerTitle:  { color: colors.white, fontSize: 16, fontWeight: font.heavy },
  headerSub:    { color: colors.text2, fontSize: 11, marginTop: 2 },
  search:       { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border2, borderRadius: radius.md, color: colors.text, paddingHorizontal: spacing.md, paddingVertical: 9, fontSize: 13 },
});

const styles = StyleSheet.create({
  salesHeader:  { color: colors.text3, fontSize: 10, fontWeight: font.bold, letterSpacing: 0.5, marginTop: spacing.sm, marginBottom: 4 },
  salesMatrix:  { flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.bg2, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  salesTile:    { flex: 1, alignItems: 'center' },
  salesLabel:   { color: colors.text3, fontSize: 9, fontWeight: font.bold, marginBottom: 2 },
  salesVal:     { color: colors.greenLight, fontSize: 13, fontWeight: font.heavy, fontFamily: 'monospace' },
  salesSub:     { color: colors.text3, fontSize: 9, marginTop: 2 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.bg2, borderBottomWidth: 1, borderColor: colors.border },
  staffRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border },
  billRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border },
});
