import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  FlatList, RefreshControl, StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, StatCard, Badge, Spinner, Empty, PillTabs, Btn } from '../components/UI';
import { colors, spacing, radius, font, shadows } from '../utils/theme';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import Toast from 'react-native-toast-message';

export default function AIForecastScreen({ navigation }) {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('all'); // all, risk, normal

  const fetchForecast = async () => {
    try {
      const res = await api.get('/reports/forecast');
      setData(res.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load AI Forecast analysis' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchForecast();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchForecast();
  };

  if (loading) return <Spinner />;

  const { forecasts = [], highRiskCount = 0, totalProductsAnalyzed = 0 } = data || {};

  const filteredForecasts = (forecasts || []).filter(item => {
    if (!item) return false;
    const name = (item.name || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch = name.includes(query) || category.includes(query);
    if (!matchesSearch) return false;
    if (filter === 'risk') return item.riskLevel !== 'normal';
    if (filter === 'normal') return item.riskLevel === 'normal';
    return true;
  });

  const healthScore = totalProductsAnalyzed > 0 
    ? Math.round(((totalProductsAnalyzed - highRiskCount) / totalProductsAnalyzed) * 100) 
    : 100;

  return (
    <View style={s.container}>
      {/* Header Banner */}
      <View style={s.banner}>
        <LinearGradient
          colors={['rgba(168, 85, 247, 0.25)', 'rgba(99, 102, 241, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.bannerRow}
        >
          <Text style={{ fontSize: 26 }}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>SmartStock AI Demand Intelligence</Text>
            <Text style={s.bannerSub}>30-Day Sales Velocity & Predictive Stock Depletion</Text>
          </View>
          <Btn title="Refresh" variant="ghost" size="sm" onPress={fetchForecast} />
        </LinearGradient>
      </View>

      {/* Summary KPI Cards Grid */}
      <View style={s.statsRow}>
        <StatCard icon="📊" label="Analyzed" value={totalProductsAnalyzed} color="blue" />
        <StatCard icon="⚠️" label="Runout Risk" value={highRiskCount} color="amber" />
        <StatCard icon="🛡️" label="Health Ratio" value={`${healthScore}%`} color="green" />
      </View>

      {/* Search & Filter Controls */}
      <View style={s.controlsRow}>
        <TextInput
          style={s.searchInput}
          placeholder="Search items for AI predictions…"
          placeholderTextColor={colors.text3}
          value={search}
          onChangeText={setSearch}
        />
        <PillTabs
          tabs={[
            { key: 'all',    label: `All Items (${forecasts.length})` },
            { key: 'risk',   label: `⚠️ Risk Alerts (${highRiskCount})` },
            { key: 'normal', label: '✅ Optimal Stock' },
          ]}
          activeTab={filter}
          onSelect={setFilter}
        />
      </View>

      {/* Predictive Cards List */}
      <FlatList
        data={filteredForecasts}
        keyExtractor={item => (item._id ? item._id.toString() : Math.random().toString())}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 24 }}
        ListEmptyComponent={<Empty icon="🔮" title="No Items Found" sub="Try changing your search or filter" />}
        renderItem={({ item }) => {
          const daysLeft = item.daysUntilStockout ?? item.predictedDaysLeft ?? 999;
          const currentStock = Number(item.stock) || 0;
          return (
            <Card style={s.forecastCard} glow={item.riskLevel !== 'normal'}>
              <View style={s.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.itemCategory}>{(item.category || 'GENERAL').toUpperCase()}</Text>
                  <Text style={s.itemName}>{item.name || 'Unnamed Item'}</Text>
                </View>
                <Badge 
                  label={item.riskLevel === 'critical' ? '🚫 Out of Stock' : item.riskLevel === 'warning' ? '⚠️ Runout Risk' : '✅ Optimal'} 
                  color={item.riskLevel === 'critical' ? 'red' : item.riskLevel === 'warning' ? 'amber' : 'green'} 
                />
              </View>

              <View style={s.metricsGrid}>
                <View style={s.metricBox}>
                  <Text style={s.metricLabel}>Current Stock</Text>
                  <Text style={[s.metricValue, currentStock === 0 && { color: colors.redLight }]}>
                    {currentStock} units
                  </Text>
                </View>

                <View style={s.metricBox}>
                  <Text style={s.metricLabel}>30-Day Velocity</Text>
                  <Text style={[s.metricValue, { color: colors.accentLight }]}>
                    {item.dailyVelocity || 0}/day
                  </Text>
                </View>

                <View style={s.metricBox}>
                  <Text style={s.metricLabel}>Predicted Runout</Text>
                  <Text style={[s.metricValue, { color: currentStock === 0 ? colors.redLight : daysLeft <= 7 ? colors.amberLight : colors.greenLight }]}>
                    {currentStock === 0 ? 'Depleted' : daysLeft >= 90 ? '90+ days' : `~${daysLeft} days`}
                  </Text>
                </View>
              </View>

              {item.recommendedReorder > 0 && (
                <View style={s.reorderBox}>
                  <Text style={s.reorderText}>
                    💡 AI Recommendation: Suggested Restock <Text style={{ fontWeight: font.bold, color: colors.purpleLight }}>+{item.recommendedReorder} units</Text>
                  </Text>
                </View>
              )}
            </Card>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg },
  banner:      { borderBottomWidth: 1, borderColor: colors.purpleGlow },
  bannerRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  bannerTitle: { color: colors.white, fontSize: 14, fontWeight: font.bold },
  bannerSub:   { color: colors.text2, fontSize: 11, marginTop: 2 },
  statsRow:    { flexDirection: 'row', gap: spacing.xs, padding: spacing.md, paddingBottom: spacing.xs },
  controlsRow: { paddingHorizontal: spacing.md, gap: spacing.xs, marginBottom: spacing.xs },
  searchInput: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    fontSize: 13,
  },
  forecastCard: { padding: spacing.md, gap: spacing.sm },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemCategory: { color: colors.text3, fontSize: 10, fontWeight: font.bold, letterSpacing: 0.5 },
  itemName:     { color: colors.text, fontSize: 15, fontWeight: font.heavy, marginTop: 2 },
  metricsGrid:  { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.bg2, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  metricBox:    { alignItems: 'center', flex: 1 },
  metricLabel:  { color: colors.text2, fontSize: 10 },
  metricValue:  { color: colors.text, fontSize: 13, fontWeight: font.bold, marginTop: 2, fontFamily: 'monospace' },
  reorderBox: {
    backgroundColor: colors.purpleBg,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.purpleGlow,
  },
  reorderText:  { color: colors.text, fontSize: 12 },
});
