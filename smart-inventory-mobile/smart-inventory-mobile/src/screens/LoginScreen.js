import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Input, Btn, Badge } from '../components/UI';
import { colors, spacing, radius, font, shadows } from '../utils/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { getStoredServerUrl, setCustomServerUrl, resetToDefaultServerUrl, DEFAULT_SERVER_URL, normalizeUrl, getApiErrorMessage } from '../services/api';
import axios from 'axios';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [testingServer, setTestingServer] = useState(false);

  useEffect(() => {
    getStoredServerUrl().then(url => setServerUrl(url));
  }, []);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleSaveServer = async () => {
    const updated = await setCustomServerUrl(serverUrl);
    setServerUrl(updated);
    Alert.alert('Server Saved', `Active backend URL:\n${updated}`);
  };

  const handleResetServer = async () => {
    const updated = await resetToDefaultServerUrl();
    setServerUrl(updated);
    Alert.alert('Reset to USB Default', `Active backend URL reset to:\n${updated}\n\nMake sure to run on PC:\nadb reverse tcp:5000 tcp:5000`);
  };

  const handleTestServer = async () => {
    setTestingServer(true);
    try {
      const cleanUrl = normalizeUrl(serverUrl);
      const res = await axios.get(`${cleanUrl}/health`, { timeout: 5000 });
      if (res.data?.status === 'ok') {
        Alert.alert(
          '✅ Connected Successfully!',
          `Backend: ${res.data.system || 'SmartStock Enterprise API'}\nStatus: ${res.data.status}\nDatabase: ${res.data.database || 'Connected'}`
        );
      } else {
        Alert.alert('Connected', `Server responded with status: ${res.status}`);
      }
    } catch (err) {
      const isNetworkError = !err.response;
      Alert.alert(
        isNetworkError ? '⚡ Connection Failed' : `Error (${err.response?.status})`,
        isNetworkError
          ? `Could not reach: ${normalizeUrl(serverUrl)}\n\nFor USB development:\n1. Ensure USB debugging is enabled on phone\n2. Run on PC: adb reverse tcp:5000 tcp:5000\n3. Backend is running on port 5000.`
          : (err.response?.data?.message || err.message)
      );
    } finally {
      setTestingServer(false);
    }
  };

  const submit = async (emailOverride, passOverride) => {
    const email = emailOverride || form.email;
    const password = passOverride || form.password;

    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter both your email address and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      let title = 'Login Failed';
      let message = getApiErrorMessage(err);

      if (!err.response) {
        title = '⚡ Server Connection Failed';
        message = `Cannot connect to SmartStock server at:\n${serverUrl}\n\nPlease check:\n1. USB cable connected\n2. Run on PC: adb reverse tcp:5000 tcp:5000\n3. Node/Express backend is running on port 5000.`;
      } else if (err.response.status === 401) {
        title = 'Invalid Credentials';
        message = err.response.data?.message || 'Invalid email or password.';
      } else if (err.response.status === 403) {
        title = 'Access Denied';
        message = err.response.data?.message || 'You do not have permission to access this portal.';
      } else if (err.response.status === 404) {
        title = 'Endpoint Not Found (404)';
        message = 'Requested login route not found on the backend. Expected /api/auth/login.';
      } else if (err.response.status === 429) {
        title = 'Too Many Requests';
        message = 'Too many login attempts. Please wait a moment and try again.';
      } else if (err.response.status >= 500) {
        title = 'Server Error (500)';
        message = err.response.data?.message || 'SmartStock server encountered an error.';
      }

      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (email, password) => {
    setForm({ email, password });
    submit(email, password);
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      {/* Brand Header */}
      <View style={s.logoRow}>
        <View style={s.logoBadge}>
          <Text style={{ fontSize: 24 }}>⚡</Text>
        </View>
        <View>
          <Text style={s.logoText}>SmartStock</Text>
          <Text style={s.logoSub}>Cloud Inventory & POS Billing</Text>
        </View>
      </View>

      <Text style={s.title}>Sign in to Account</Text>
      <Text style={s.sub}>Select your role credentials or sign in below</Text>

      {/* Input Fields */}
      <Input
        label="Email Address"
        value={form.email}
        onChangeText={set('email')}
        placeholder="you@shop.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        label="Password"
        value={form.password}
        onChangeText={set('password')}
        placeholder="••••••••"
        secureTextEntry
      />

      <Btn
        title="Sign in to Workspace"
        onPress={() => submit()}
        loading={loading}
        size="lg"
        style={{ marginTop: spacing.sm }}
      />

      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={s.link} activeOpacity={0.7}>
        <Text style={s.linkText}>
          Don't have a shop account? <Text style={{ color: colors.accentLight, fontWeight: font.bold }}>Register Store</Text>
        </Text>
      </TouchableOpacity>

      {/* 1-Tap Quick Role Login Buttons */}
      <View style={s.quickLoginCard}>
        <Text style={s.quickLoginTitle}>⚡ 1-TAP QUICK DEMO LOGIN</Text>

        {/* Shop Owner */}
        <TouchableOpacity
          style={s.demoRoleBtn}
          onPress={() => quickFill('owner@retailhub.com', 'password123')}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 16 }}>🏪</Text>
              <Text style={s.roleName}>Shop Owner (Full Access)</Text>
            </View>
            <Text style={s.roleEmail}>owner@retailhub.com</Text>
          </View>
          <Badge label="Owner" color="blue" />
        </TouchableOpacity>

        {/* Super Admin */}
        <TouchableOpacity
          style={[s.demoRoleBtn, { borderColor: colors.purpleGlow }]}
          onPress={() => quickFill('admin@smartstock.com', 'password123')}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 16 }}>👑</Text>
              <Text style={s.roleName}>Super Admin (Platform HQ)</Text>
            </View>
            <Text style={s.roleEmail}>admin@smartstock.com</Text>
          </View>
          <Badge label="Admin" color="purple" />
        </TouchableOpacity>

        {/* Staff / Cashier */}
        <TouchableOpacity
          style={s.demoRoleBtn}
          onPress={() => quickFill('cashier@retailhub.com', 'password123')}
          activeOpacity={0.8}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 16 }}>🧑‍💼</Text>
              <Text style={s.roleName}>Staff / Cashier</Text>
            </View>
            <Text style={s.roleEmail}>cashier@retailhub.com</Text>
          </View>
          <Badge label="Staff" color="default" />
        </TouchableOpacity>
      </View>

      {/* Backend Server Connection Settings */}
      <View style={s.serverCard}>
        <TouchableOpacity 
          style={s.serverHeader} 
          onPress={() => setShowServerConfig(!showServerConfig)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 16 }}>⚙️</Text>
            <Text style={s.serverTitle}>Backend Server Connection</Text>
          </View>
          <Text style={s.serverToggle}>{showServerConfig ? '▲ Hide' : '▼ Change IP'}</Text>
        </TouchableOpacity>

        <Text style={s.serverSubtitle}>
          Connected to: <Text style={{ color: colors.accentLight, fontWeight: font.bold }}>{serverUrl}</Text>
        </Text>

        {showServerConfig && (
          <View style={{ marginTop: 12, gap: 10 }}>
            <Text style={s.serverHelpText}>
              • USB Development: Use http://127.0.0.1:5000/api (Run: adb reverse tcp:5000 tcp:5000){'\n'}
              • Cloud / Production: Use https://your-app.onrender.com/api
            </Text>
            <TextInput
              style={s.serverInput}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://127.0.0.1:5000/api"
              placeholderTextColor={colors.text3}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity 
                style={[s.serverBtn, { flex: 1, backgroundColor: colors.accentBg, borderColor: colors.accentGlow }]} 
                onPress={handleSaveServer}
              >
                <Text style={{ color: colors.accentLight, fontWeight: font.bold, fontSize: 11 }}>💾 Save URL</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[s.serverBtn, { flex: 1.1, backgroundColor: colors.bg2, borderColor: colors.border }]} 
                onPress={handleTestServer}
                disabled={testingServer}
              >
                <Text style={{ color: colors.text, fontWeight: font.bold, fontSize: 11 }}>
                  {testingServer ? '⏳ Testing...' : '⚡ Test Connection'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[s.serverBtn, { flex: 0.9, backgroundColor: colors.bg3, borderColor: colors.border2 }]} 
                onPress={handleResetServer}
              >
                <Text style={{ color: colors.text2, fontWeight: font.bold, fontSize: 11 }}>🔄 Reset USB</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, paddingTop: 60, paddingBottom: 40 },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.xl },
  logoBadge: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.accentGlow },
  logoText:  { fontSize: 24, fontWeight: font.heavy, color: colors.text, letterSpacing: -0.5 },
  logoSub:   { fontSize: 12, color: colors.text2, marginTop: 1 },
  title:     { fontSize: 24, fontWeight: font.heavy, color: colors.text, marginBottom: 4 },
  sub:       { fontSize: 13, color: colors.text2, marginBottom: spacing.lg },
  link:      { marginVertical: spacing.lg, alignItems: 'center' },
  linkText:  { color: colors.text2, fontSize: 13 },

  quickLoginCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.card,
  },
  quickLoginTitle: { color: colors.text3, fontSize: 11, fontWeight: font.bold, letterSpacing: 0.5, marginBottom: 4 },
  demoRoleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg2,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleName: { color: colors.text, fontSize: 13, fontWeight: font.bold },
  roleEmail: { color: colors.text3, fontSize: 11, marginTop: 2, fontFamily: 'monospace' },

  serverCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serverTitle: { color: colors.text, fontSize: 13, fontWeight: font.bold },
  serverToggle: { color: colors.accentLight, fontSize: 12, fontWeight: font.bold },
  serverSubtitle: { color: colors.text3, fontSize: 11, marginTop: 4 },
  serverHelpText: { color: colors.text2, fontSize: 11, lineHeight: 16 },
  serverInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 12,
  },
  serverBtn: {
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
