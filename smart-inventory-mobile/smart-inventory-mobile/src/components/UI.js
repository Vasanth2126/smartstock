import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, Modal as RNModal,
  ScrollView, Pressable, Animated, Dimensions, StyleSheet
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, font, shadows } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ title, onPress, variant = 'primary', size = 'md', loading, disabled, style, icon }) {
  const isPrimary = variant === 'primary';
  const isSuccess = variant === 'success';
  const isDanger  = variant === 'danger';
  const isGhost   = variant === 'ghost';
  const isDefault = variant === 'default';

  const pad = size === 'sm'
    ? { paddingVertical: 8,  paddingHorizontal: 14 }
    : size === 'lg'
    ? { paddingVertical: 14, paddingHorizontal: 22 }
    : { paddingVertical: 11, paddingHorizontal: 18 };

  const fontSize = size === 'sm' ? 12 : size === 'lg' ? 15 : 13;

  const bgColors = isPrimary
    ? [colors.accent, '#4f46e5']
    : isSuccess
    ? [colors.green, '#059669']
    : isDanger
    ? [colors.red, '#dc2626']
    : isGhost
    ? ['transparent', 'transparent']
    : [colors.bg3, colors.bg2];

  const textColor = isPrimary || isSuccess || isDanger
    ? colors.white
    : isGhost
    ? colors.text2
    : colors.text;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[{
        borderRadius: radius.md,
        overflow: 'hidden',
        opacity: (disabled || loading) ? 0.55 : 1,
        borderWidth: isGhost ? 1 : 0,
        borderColor: colors.border2,
      }, isPrimary && shadows.glowPrimary, isSuccess && shadows.glowGreen, style]}
    >
      <LinearGradient
        colors={bgColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          ...pad,
        }]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {icon && <Text style={{ fontSize: fontSize + 2 }}>{icon}</Text>}
            <Text style={{ color: textColor, fontWeight: font.bold, fontSize, letterSpacing: 0.2 }}>
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, glow = false }) {
  return (
    <View style={[{
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: glow ? colors.borderGlow : colors.border,
      padding: spacing.lg,
      ...shadows.card,
    }, style]}>
      {children}
    </View>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ label, color = 'default' }) {
  const map = {
    default: { bg: colors.bg3,      text: colors.text2,  border: colors.border },
    green:   { bg: colors.greenBg,  text: colors.greenLight, border: colors.greenGlow },
    amber:   { bg: colors.amberBg,  text: colors.amberLight, border: colors.amberGlow },
    red:     { bg: colors.redBg,    text: colors.redLight,   border: colors.redGlow },
    blue:    { bg: colors.accentBg, text: colors.accentLight, border: colors.accentGlow },
    purple:  { bg: colors.purpleBg, text: colors.purpleLight, border: colors.purpleGlow },
  };
  const { bg, text, border } = map[color] || map.default;
  return (
    <View style={{
      backgroundColor: bg,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: border,
      alignSelf: 'flex-start',
    }}>
      <Text style={{ color: text, fontSize: 11, fontWeight: font.bold }}>{label}</Text>
    </View>
  );
}

// ── Stock Badge ───────────────────────────────────────────────────────────────
export function StockBadge({ status }) {
  const map = {
    in_stock:     { color: 'green', label: '● In Stock'     },
    low_stock:    { color: 'amber', label: '⚠️ Low Stock'    },
    out_of_stock: { color: 'red',   label: '✕ Depleted' },
  };
  const { color, label } = map[status] || map.in_stock;
  return <Badge label={label} color={color} />;
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, error, style, ...props }) {
  return (
    <View style={[{ marginBottom: spacing.md }, style]}>
      {label && (
        <Text style={{
          color: colors.text2,
          fontSize: 12,
          fontWeight: font.semibold,
          marginBottom: 6,
          letterSpacing: 0.3,
        }}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={colors.text3}
        style={{
          backgroundColor: colors.bg2,
          borderWidth: 1,
          borderColor: error ? colors.red : colors.border2,
          borderRadius: radius.md,
          color: colors.text,
          fontSize: 14,
          paddingHorizontal: spacing.md,
          paddingVertical: 11,
        }}
        {...props}
      />
      {error && (
        <Text style={{ color: colors.red, fontSize: 11, marginTop: 4, fontWeight: font.medium }}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ── Stat Trend Card (Rich Graphic KPI) ─────────────────────────────────────────
export function StatCard({ icon, label, value, sub, color = 'blue', trend }) {
  const map = {
    green:  { text: colors.greenLight,  glow: colors.greenGlow,  bg: colors.greenBg },
    amber:  { text: colors.amberLight,  glow: colors.amberGlow,  bg: colors.amberBg },
    red:    { text: colors.redLight,    glow: colors.redGlow,    bg: colors.redBg },
    blue:   { text: colors.accentLight, glow: colors.accentGlow, bg: colors.accentBg },
    purple: { text: colors.purpleLight, glow: colors.purpleGlow, bg: colors.purpleBg },
    cyan:   { text: colors.cyan,        glow: colors.cyanBg,     bg: colors.cyanBg },
    default:{ text: colors.text,        glow: colors.border,     bg: colors.bg3 },
  };
  const theme = map[color] || map.default;

  return (
    <View style={{
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.glow,
      padding: spacing.md + 2,
      flex: 1,
      minWidth: 140,
      position: 'relative',
      overflow: 'hidden',
      ...shadows.card,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{
          width: 34,
          height: 34,
          borderRadius: radius.md,
          backgroundColor: theme.bg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.glow,
        }}>
          <Text style={{ fontSize: 16 }}>{icon}</Text>
        </View>
        {trend && (
          <Badge label={trend} color={color} />
        )}
      </View>

      <Text style={{ color: colors.text2, fontSize: 11, fontWeight: font.medium, marginBottom: 4 }}>
        {label}
      </Text>
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: font.heavy, letterSpacing: -0.5 }}>
        {value}
      </Text>
      {sub && (
        <Text style={{ color: colors.text3, fontSize: 10, marginTop: 4 }}>
          {sub}
        </Text>
      )}
    </View>
  );
}

// ── Animated Graphical Bar Chart ──────────────────────────────────────────────
export function AnimatedBarChart({ data = [], height = 180, barColor = colors.accent }) {
  if (!data || data.length === 0) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.text3, fontSize: 12 }}>No chart data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value || 0), 1);

  return (
    <View style={{ height, width: '100%', paddingTop: 10 }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        {data.map((item, index) => {
          const val = item.value || 0;
          const pct = Math.max(Math.min((val / maxValue) * 100, 100), 6);

          return (
            <View key={index} style={{ alignItems: 'center', flex: 1, marginHorizontal: 3 }}>
              {/* Value Label */}
              <Text style={{ color: colors.text3, fontSize: 9, marginBottom: 4, fontFamily: 'monospace' }}>
                {val > 999 ? `${(val / 1000).toFixed(1)}k` : val > 0 ? val : '0'}
              </Text>

              {/* Bar */}
              <View style={{
                height: `${pct}%`,
                width: '100%',
                maxHeight: 120,
                backgroundColor: item.color || barColor,
                borderRadius: radius.xs,
                overflow: 'hidden',
              }}>
                <LinearGradient
                  colors={[item.color || barColor, 'rgba(0,0,0,0.3)']}
                  style={{ flex: 1 }}
                />
              </View>

              {/* Label */}
              <Text style={{ color: colors.text2, fontSize: 10, marginTop: 6, fontWeight: font.medium }} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Visual Stock Health Ring Meter ────────────────────────────────────────────
export function HealthRingMeter({ inStock = 0, lowStock = 0, outOfStock = 0 }) {
  const total = inStock + lowStock + outOfStock || 1;
  const inPct  = Math.round((inStock / total) * 100);
  const lowPct = Math.round((lowStock / total) * 100);
  const outPct = Math.max(0, 100 - inPct - lowPct);

  return (
    <View style={{ backgroundColor: colors.bg2, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ color: colors.text, fontSize: 13, fontWeight: font.bold }}>Catalog Stock Health</Text>
        <Text style={{ color: inPct >= 80 ? colors.greenLight : inPct >= 50 ? colors.amberLight : colors.redLight, fontSize: 13, fontWeight: font.heavy }}>
          {inPct}% Healthy
        </Text>
      </View>

      {/* Multi-Segment Health Progress Bar */}
      <View style={{ height: 12, borderRadius: radius.full, backgroundColor: colors.bg3, flexDirection: 'row', overflow: 'hidden', marginBottom: 12 }}>
        <View style={{ width: `${inPct}%`, backgroundColor: colors.green }} />
        <View style={{ width: `${lowPct}%`, backgroundColor: colors.amber }} />
        <View style={{ width: `${outPct}%`, backgroundColor: colors.red }} />
      </View>

      {/* Breakdown Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green }} />
          <Text style={{ color: colors.text2, fontSize: 11 }}>In Stock ({inStock})</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.amber }} />
          <Text style={{ color: colors.text2, fontSize: 11 }}>Low ({lowStock})</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red }} />
          <Text style={{ color: colors.text2, fontSize: 11 }}>Depleted ({outOfStock})</Text>
        </View>
      </View>
    </View>
  );
}

// ── Pill Tabs Selector ────────────────────────────────────────────────────────
export function PillTabs({ tabs = [], activeTab, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
      {tabs.map(tab => {
        const key = typeof tab === 'string' ? tab : tab.key;
        const label = typeof tab === 'string' ? tab : tab.label;
        const count = typeof tab === 'object' ? tab.count : undefined;
        const isActive = activeTab === key;

        return (
          <TouchableOpacity
            key={key}
            onPress={() => onSelect(key)}
            style={[{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: radius.full,
              backgroundColor: isActive ? colors.accent : colors.bg2,
              borderWidth: 1,
              borderColor: isActive ? colors.accentLight : colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }, isActive && shadows.glowPrimary]}
          >
            <Text style={{ color: isActive ? colors.white : colors.text2, fontSize: 12, fontWeight: font.bold }}>
              {label}
            </Text>
            {count !== undefined && (
              <View style={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.bg3,
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: radius.full,
              }}>
                <Text style={{ color: isActive ? colors.white : colors.text3, fontSize: 10, fontWeight: font.bold }}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ── Confetti Celebration Effect ───────────────────────────────────────────────
export function ConfettiBurst({ active }) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }).start();
    }
  }, [active]);

  if (!active) return null;

  const particles = Array.from({ length: 18 });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {particles.map((_, i) => {
        const angle = (i / particles.length) * 2 * Math.PI;
        const distance = 90 + (i % 3) * 35;
        const translateX = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(angle) * distance],
        });
        const translateY = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(angle) * distance + 40],
        });
        const opacity = animValue.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 1, 0],
        });
        const scale = animValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 1.3, 0.8],
        });

        const colorsList = [colors.green, colors.accent, colors.amber, colors.purple, colors.cyan];
        const pColor = colorsList[i % colorsList.length];

        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 8,
              height: 8,
              borderRadius: i % 2 === 0 ? 4 : 1,
              backgroundColor: pColor,
              transform: [{ translateX }, { translateY }, { scale }],
              opacity,
            }}
          />
        );
      })}
    </View>
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
    <View style={{ alignItems: 'center', padding: 36, backgroundColor: colors.bg2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginVertical: spacing.md }}>
      <Text style={{ fontSize: 38, marginBottom: 12 }}>{icon}</Text>
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: font.bold, marginBottom: 4, textAlign: 'center' }}>
        {title}
      </Text>
      {sub && (
        <Text style={{ color: colors.text2, fontSize: 12, textAlign: 'center' }}>{sub}</Text>
      )}
    </View>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, onAction, icon }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon && <Text style={{ fontSize: 16 }}>{icon}</Text>}
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: font.heavy }}>{title}</Text>
      </View>
      {action && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={{ color: colors.accentLight, fontSize: 12, fontWeight: font.bold }}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function AppModal({ visible, onClose, title, children }) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable onPress={e => e.stopPropagation()}>
          <View style={{
            backgroundColor: colors.bgCard,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            borderTopWidth: 1,
            borderColor: colors.borderGlow,
            maxHeight: '90%',
            ...shadows.card,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: spacing.lg,
              borderBottomWidth: 1,
              borderColor: colors.border,
            }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: font.bold }}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                <Text style={{ color: colors.text2, fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ padding: spacing.lg }}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}