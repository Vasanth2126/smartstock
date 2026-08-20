import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Input, Btn } from '../components/UI';
import { colors, spacing, radius, font } from '../utils/theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.email || !form.password) { Alert.alert('Error', 'Fill in all fields'); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      Alert.alert('Login failed', err.response?.data?.message || 'Check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.logoRow}>
        <Text style={s.logoIcon}>⚡</Text>
        <Text style={s.logoText}>SmartStock</Text>
      </View>
      <Text style={s.title}>Welcome back</Text>
      <Text style={s.sub}>Sign in to manage your shop</Text>

      <Input label="Email" value={form.email} onChangeText={set('email')}
        placeholder="you@shop.com" keyboardType="email-address" autoCapitalize="none" />
      <Input label="Password" value={form.password} onChangeText={set('password')}
        placeholder="••••••" secureTextEntry />

      <Btn title="Sign in" onPress={submit} loading={loading} size="lg" style={{ marginTop: 8 }} />

      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={s.link}>
        <Text style={s.linkText}>No account? <Text style={{ color: colors.accent }}>Register your shop</Text></Text>
      </TouchableOpacity>

      <View style={s.demo}>
        <Text style={{ color: colors.text2, fontSize: 12 }}>Demo: </Text>
        <Text style={{ color: colors.accent, fontSize: 12 }}>ramesh@shop.com / password123</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.xl, paddingTop: 80 },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.xl },
  logoIcon:  { fontSize: 28 },
  logoText:  { fontSize: 22, fontWeight: font.bold, color: colors.accent },
  title:     { fontSize: 26, fontWeight: font.bold, color: colors.text, marginBottom: 6 },
  sub:       { fontSize: 14, color: colors.text2, marginBottom: spacing.xl },
  link:      { marginTop: spacing.lg, alignItems: 'center' },
  linkText:  { color: colors.text2, fontSize: 13 },
  demo:      { flexDirection: 'row', marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.bg3, borderRadius: radius.sm, flexWrap: 'wrap' },
});
