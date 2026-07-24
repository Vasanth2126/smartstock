import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Input, Btn } from '../components/UI';
import { colors, spacing, font } from '../utils/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm]       = useState({ name: '', email: '', password: '', shopName: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.email || !form.password) { Alert.alert('Error', 'Fill in required fields'); return; }
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      Alert.alert('Registration failed', err.response?.data?.message || 'Try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.xl, paddingTop: 60 }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: 24, fontWeight: font.bold, color: colors.text, marginBottom: 6 }}>Create your shop</Text>
      <Text style={{ fontSize: 14, color: colors.text2, marginBottom: spacing.xl }}>Set up your inventory in minutes</Text>

      <Input label="Your name *" value={form.name} onChangeText={set('name')} placeholder="Ramesh Kumar" />
      <Input label="Shop name" value={form.shopName} onChangeText={set('shopName')} placeholder="Ramesh General Store" />
      <Input label="Email *" value={form.email} onChangeText={set('email')} placeholder="you@shop.com" keyboardType="email-address" autoCapitalize="none" />
      <Input label="Password *" value={form.password} onChangeText={set('password')} placeholder="Min 6 characters" secureTextEntry />

      <Btn title="Create account" onPress={submit} loading={loading} size="lg" style={{ marginTop: 8 }} />

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg, alignItems: 'center' }}>
        <Text style={{ color: colors.text2, fontSize: 13 }}>Already registered? <Text style={{ color: colors.accent }}>Sign in</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
