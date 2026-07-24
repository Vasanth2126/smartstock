import React, { useEffect, useState } from 'react';
import { Btn, Spinner, Modal, Input, Table } from '../components/ui/UI';
import api from '../services/api';
import toast from 'react-hot-toast';

const BLANK = { name: '', phone: '', email: '', address: '', category: '', notes: '' };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/suppliers').then(({ data }) => { setSuppliers(data.suppliers); setLoading(false); });
  useEffect(() => { load(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const openAdd  = () => { setEditing(null); setForm(BLANK); setModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '', category: s.category || '', notes: s.notes || '' }); setModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await api.put(`/suppliers/${editing._id}`, form); toast.success('Supplier updated'); }
      else          { await api.post('/suppliers', form); toast.success('Supplier added'); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const del = async (s) => {
    if (!window.confirm(`Delete "${s.name}"?`)) return;
    try { await api.delete(`/suppliers/${s._id}`); toast.success('Supplier deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const columns = [
    { key: 'name',     label: 'Supplier',  render: s => <strong>{s.name}</strong> },
    { key: 'phone',    label: 'Phone',     render: s => s.phone || '—' },
    { key: 'email',    label: 'Email',     render: s => s.email || '—' },
    { key: 'category', label: 'Category',  render: s => s.category || '—' },
    { key: 'actions',  label: '',          render: s => (
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn size="sm" variant="ghost"   onClick={() => openEdit(s)}>Edit</Btn>
        <Btn size="sm" variant="danger"  onClick={() => del(s)}>Delete</Btn>
      </div>
    )},
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Suppliers</div>
          <div className="page-sub">{suppliers.length} vendors</div>
        </div>
        <Btn variant="primary" onClick={openAdd}>+ Add Supplier</Btn>
      </div>

      {loading ? <Spinner /> : <Table columns={columns} data={suppliers} emptyText="No suppliers yet" />}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit supplier' : 'Add supplier'}>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid-2">
            <Input label="Supplier name *" value={form.name} onChange={set('name')} required />
            <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="9876543210" />
          </div>
          <div className="grid-2">
            <Input label="Email" type="email" value={form.email} onChange={set('email')} />
            <Input label="Category" value={form.category} onChange={set('category')} placeholder="Dairy, Grains…" />
          </div>
          <Input label="Address" value={form.address} onChange={set('address')} />
          <Input label="Notes" value={form.notes} onChange={set('notes')} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn type="button" variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" variant="primary" loading={saving}>{editing ? 'Save changes' : 'Add supplier'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
