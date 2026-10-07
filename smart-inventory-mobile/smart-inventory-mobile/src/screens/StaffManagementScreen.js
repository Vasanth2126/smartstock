import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, RefreshControl,
  Alert, FlatList, TouchableOpacity, StyleSheet
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Badge, Spinner, Empty, Card,
  AppModal, Input, Btn, SectionHeader,
} from '../components/UI';
import { colors, spacing, radius, font } from '../utils/theme';
import api from '../services/api';
import Toast from 'react-native-toast-message';

const BLANK_STAFF = { name: '', email: '', password: '' };

export default function StaffManagementScreen() {
  const [staff, setStaff]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh]= useState(false);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(BLANK_STAFF);
  const [saving, setSaving]     = useState(false);

  const loadStaff = async () => {
    try {
      const { data } = await api.get('/admin/staff');
      setStaff(data.staff || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load staff list' });
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  };

  useFocusEffect(useCallback(() => { loadStaff(); }, []));

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK_STAFF);
    setModal(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, email: s.email, password: '' });
    setModal(true);
  };

  const save = async () => {
    if (!form.name || !form.email) {
      Toast.show({ type: 'error', text1: 'Name and email are required' });
      return;
    }
    if (!editing && !form.password) {
      Toast.show({ type: 'error', text1: 'Password is required' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const body = { name: form.name };
        if (form.password) body.password = form.password;
        await api.put(`/admin/staff/${editing._id}`, body);
        Toast.show({ type: 'success', text1: 'Staff updated successfully' });
      } else {
        await api.post('/admin/staff', form);
        Toast.show({ type: 'success', text1: 'Staff account created' });
      }
      setModal(false);
      loadStaff();
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const removeStaff = (s) => {
    Alert.alert('Remove Staff', `Are you sure you want to remove "${s.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/staff/${s._id}`);
            Toast.show({ type: 'success', text1: 'Staff removed' });
            loadStaff();
          } catch {
            Toast.show({ type: 'error', text1: 'Remove failed' });
          }
        },
      },
    ]);
  };

  if (loading) return <Spinner />;

  return (
    <View style={s.container}>
      {/* Top Action Bar */}
      <View style={s.topBar}>
        <View>
          <Text style={s.headerTitle}>Staff Accounts</Text>
          <Text style={s.headerSub}>{staff.length} staff member{staff.length !== 1 ? 's' : ''} assigned</Text>
        </View>
        <Btn title="+ Add Staff" variant="primary" size="sm" onPress={openAdd} />
      </View>

      {/* Permissions Info Banner */}
      <View style={s.infoBanner}>
        <Text style={{ fontSize: 18 }}>🛡️</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.infoBannerTitle}>Role Access Guidelines</Text>
          <Text style={s.infoBannerText}>
            Staff accounts can process POS billing, view catalog, and manage inventory alerts. Store management and revenue analytics are restricted.
          </Text>
        </View>
      </View>

      <FlatList
        data={staff}
        keyExtractor={item => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); loadStaff(); }} tintColor={colors.accent} />}
        contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
        ListEmptyComponent={<Empty icon="👥" title="No Staff Added" sub="Tap + Add Staff to create login credentials" />}
        renderItem={({ item: s }) => (
          <Card style={s.staffCard}>
            <View style={s.staffRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.staffName}>{s.name}</Text>
                  <Badge label="Staff" color="blue" />
                </View>
                <Text style={s.staffEmail}>{s.email}</Text>
              </View>
              <Badge label={s.isActive ? 'Active' : 'Removed'} color={s.isActive ? 'green' : 'red'} />
            </View>

            <View style={s.staffMeta}>
              <Text style={s.metaText}>
                🕒 Last login: {s.lastLogin ? new Date(s.lastLogin).toLocaleDateString('en-IN') : 'Never'}
              </Text>
              <Text style={s.metaText}>
                📅 Added: {new Date(s.createdAt).toLocaleDateString('en-IN')}
              </Text>
            </View>

            <View style={s.actionRow}>
              <Btn title="Edit" variant="ghost" size="sm" onPress={() => openEdit(s)} style={{ flex: 1 }} />
              <Btn title="Remove" variant="danger" size="sm" onPress={() => removeStaff(s)} style={{ flex: 1 }} />
            </View>
          </Card>
        )}
      />

      <AppModal visible={modal} onClose={() => setModal(false)} title={editing ? 'Edit Staff Account' : 'Add New Staff'}>
        <Input label="Full Name *" value={form.name} onChangeText={set('name')} placeholder="e.g. Rahul Sharma" />
        <Input label="Email Address *" value={form.email} onChangeText={set('email')} placeholder="rahul@store.com" keyboardType="email-address" autoCapitalize="none" editable={!editing} />
        <Input label={editing ? 'New Password (leave blank to keep unchanged)' : 'Password *'} value={form.password} onChangeText={set('password')} secureTextEntry placeholder="Min 6 characters" />

        <View style={s.modalNote}>
          <Text style={s.modalNoteText}>
            💡 Staff will use this email and password to log in directly via the mobile app or web portal.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl }}>
          <Btn title="Cancel" variant="ghost" onPress={() => setModal(false)} style={{ flex: 1 }} />
          <Btn title={editing ? 'Save Changes' : 'Create Account'} variant="primary" onPress={save} loading={saving} style={{ flex: 1 }} />
        </View>
      </AppModal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: font.heavy },
  headerSub: { color: colors.text2, fontSize: 11, marginTop: 2 },
  infoBanner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.accentGlow,
    borderRadius: radius.md,
    margin: spacing.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  infoBannerTitle: { color: colors.white, fontSize: 12, fontWeight: font.bold },
  infoBannerText: { color: colors.text2, fontSize: 11, marginTop: 2 },
  staffCard: { padding: spacing.md },
  staffRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  staffName: { color: colors.text, fontSize: 14, fontWeight: font.bold },
  staffEmail: { color: colors.text2, fontSize: 12, marginTop: 2 },
  staffMeta: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, marginVertical: spacing.xs },
  metaText: { color: colors.text3, fontSize: 11 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalNote: { backgroundColor: colors.bg3, padding: spacing.md, borderRadius: radius.sm, marginVertical: spacing.sm },
  modalNoteText: { color: colors.text2, fontSize: 11 },
});
