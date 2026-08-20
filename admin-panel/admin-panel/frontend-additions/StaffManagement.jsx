// NEW FILE: smart-inventory-frontend/src/pages/StaffManagement.jsx

import React, { useEffect, useState } from 'react';
import { Btn, Card, Badge, Spinner, Empty, Modal, Input, Table } from '../components/ui/UI';
import api from '../services/api';
import toast from 'react-hot-toast';

const BLANK = { name: '', email: '', password: '' };

export default function StaffManagement() {
  const [staff, setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]     = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/admin/staff');
      setStaff(data.staff);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setForm(BLANK); setModal(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, email: s.email, password: '' });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }
    if (!editing && !form.password) { toast.error('Password required for new staff'); return; }
    setSaving(true);
    try {
      if (editing) {
        const body = { name: form.name };
        if (form.password) body.password = form.password;
        await api.put(`/admin/staff/${editing._id}`, body);
        toast.success('Staff updated');
      } else {
        await api.post('/admin/staff', form);
        toast.success('Staff account created');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const remove = async (s) => {
    if (!window.confirm(`Remove "${s.name}" from staff?`)) return;
    try {
      await api.delete(`/admin/staff/${s._id}`);
      toast.success('Staff removed');
      load();
    } catch { toast.error('Remove failed'); }
  };

  const columns = [
    { key: 'name', label: 'Staff Member', render: s => (
      <div>
        <div style={{ fontWeight: 500 }}>{s.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.email}</div>
      </div>
    )},
    { key: 'role', label: 'Role', render: () => <Badge color="default">Staff</Badge> },
    { key: 'lastLogin', label: 'Last login', render: s => s.lastLogin
      ? new Date(s.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : <span style={{ color: 'var(--text3)' }}>Never</span>
    },
    { key: 'isActive', label: 'Status', render: s => <Badge color={s.isActive ? 'green' : 'red'}>{s.isActive ? 'Active' : 'Removed'}</Badge> },
    { key: 'createdAt', label: 'Added on', render: s => new Date(s.createdAt).toLocaleDateString('en-IN') },
    { key: 'actions', label: '', render: s => (
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn size="sm" variant="ghost"  onClick={() => openEdit(s)}>Edit</Btn>
        <Btn size="sm" variant="danger" onClick={() => remove(s)}>Remove</Btn>
      </div>
    )},
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Staff Management</div>
          <div className="page-sub">{staff.length} staff member{staff.length !== 1 ? 's' : ''} in your shop</div>
        </div>
        <Btn variant="primary" onClick={openAdd}>+ Add Staff</Btn>
      </div>

      {/* Info card */}
      <Card style={{ marginBottom: 20, background: 'var(--accent-bg)', borderColor: 'rgba(79,142,247,0.2)' }}>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>
          <strong style={{ color: 'var(--accent)' }}>Staff accounts</strong> can log in to this system and create bills, manage products, and view reports —
          but cannot manage staff or access the admin panel. Share the login credentials with your staff members.
        </div>
      </Card>

      {loading
        ? <Spinner />
        : staff.length === 0
          ? <Empty icon="👥" title="No staff yet" sub="Add your first staff member to let them use the POS system" />
          : <Table columns={columns} data={staff} emptyText="No staff members" />
      }

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit staff member' : 'Add staff member'}>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Full name *"
            value={form.name}
            onChange={set('name')}
            placeholder="Suresh Kumar"
            required
          />
          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="suresh@shop.com"
            required
            disabled={!!editing}
          />
          <Input
            label={editing ? 'New password (leave blank to keep current)' : 'Password *'}
            type="password"
            value={form.password}
            onChange={set('password')}
            placeholder={editing ? 'Leave blank to keep unchanged' : 'Min 6 characters'}
            minLength={form.password ? 6 : undefined}
          />
          {!editing && (
            <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text2)' }}>
              Share these credentials with your staff member. They can log in at the same URL as you.
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Btn type="button" variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" variant="primary" loading={saving}>{editing ? 'Save changes' : 'Create account'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
