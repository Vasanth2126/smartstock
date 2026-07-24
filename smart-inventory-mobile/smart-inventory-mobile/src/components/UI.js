import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, Modal as RNModal,
  ScrollView, Pressable,
} from 'react-native';
import { colors, spacing, radius, font } from '../utils/theme';

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ title, onPress, variant = 'primary', size = 'md', loading, disabled, style }) {
  const bg = {
    primary: colors.accent,
    success: colors.greenBg,
    danger:  colors.redBg,
    ghost:   'transparent',
    default: colors.bg3,
  }[variant];

  const textColor = {
    primary: colors.white,
    success: colors.green,
    danger:  colors.red,
    ghost:   colors.text2,
    default: colors.text,
  }[variant];

  const pad = size === 'sm' ? { paddingVertical: 7, paddingHorizontal: 14 }
            : size === 'lg' ? { paddingVertical: 14, paddingHorizontal: 20 }
            :                 { paddingVertical: 10, paddingHorizontal: 16 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[{
        backgroundColor: bg,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        opacity: (disabled || loading) ? 0.5 : 1,
        borderWidth: variant === 'ghost' ? 1 : 0,
        borderColor: colors.border,
        ...pad,
      }, style]}
    >
      {loading
        ? <ActivityIndicator size="small" color={textColor} />
        : <Text style={{ color: textColor, fontWeight: font.semibold, fontSize: size === 'sm' ? 12 : 14 }}>{title}</Text>
      }
    </TouchableOpacity>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return (
    <View style={[{
      backgroundColor: colors.bg2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    }, style]}>
      {children}
    </View>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, color = 'default' }) {
  const map = {
    default: { bg: colors.bg3,     text: colors.text2 },
    green:   { bg: colors.greenBg, text: colors.green },
    amber:   { bg: colors.amberBg, text: colors.amber },
    red:     { bg: colors.redBg,   text: colors.red   },
    blue:    { bg: colors.accentBg,text: colors.accent },
  };
  const { bg, text } = map[color] || map.default;
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full }}>
      <Text style={{ color: text, fontSize: 11, fontWeight: font.medium }}>{label}</Text>
    </View>
  );
}

export function StockBadge({ status }) {
  const map = {
    in_stock:     { color: 'green', label: 'In stock' },
    low_stock:    { color: 'amber', label: 'Low stock' },
    out_of_stock: { color: 'red',   label: 'Out of stock' },
  };
  const { color, label } = map[status] || map.in_stock;
  return <Badge label={label} color={color} />;
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, style, ...props }) {
  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      {label && <Text style={{ color: colors.text2, fontSize: 12, fontWeight: font.medium, marginBottom: 5 }}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.text3}
        style={{
          backgroundColor: colors.bg3,
          borderWidth: 1,
          borderColor: error ? colors.red : colors.border2,
          borderRadius: radius.sm,
          color: colors.text,
          fontSize: 14,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
        }}
        {...props}
      />
      {error && <Text style={{ color: colors.red, fontSize: 11, marginTop: 3 }}>{error}</Text>}
    </View>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, sub, color = 'default' }) {
  const valColor = {
    green: colors.green, amber: colors.amber,
    red: colors.red, blue: colors.accent, default: colors.text,
  }[color];
  return (
    <Card style={{ flex: 1, minWidth: '45%' }}>
      <Text style={{ fontSize: 20, marginBottom: 8 }}>{icon}</Text>
      <Text style={{ color: colors.text2, fontSize: 11, marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: valColor, fontSize: 22, fontWeight: font.bold }}>{value}</Text>
      {sub && <Text style={{ color: colors.text3, fontSize: 11, marginTop: 3 }}>{sub}</Text>}
    </Card>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'large' }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ActivityIndicator size={size} color={colors.accent} />
    </View>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function Empty({ icon = '📭', title, sub }) {
  return (
    <View style={{ alignItems: 'center', padding: 40 }}>
      <Text style={{ fontSize: 36, marginBottom: 12 }}>{icon}</Text>
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: font.medium, marginBottom: 6 }}>{title}</Text>
      {sub && <Text style={{ color: colors.text2, fontSize: 13, textAlign: 'center' }}>{sub}</Text>}
    </View>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: font.semibold }}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ color: colors.accent, fontSize: 13 }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function AppModal({ visible, onClose, title, children }) {
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={e => e.stopPropagation()}>
          <View style={{
            backgroundColor: colors.bg2,
            borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
            borderTopWidth: 1, borderColor: colors.border,
            maxHeight: '90%',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderColor: colors.border }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: font.semibold }}>{title}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: colors.text2, fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
