import React, { useEffect, useState } from 'react';
import { Btn, Badge, StockBadge, Spinner, Empty, Modal, Input, Select, Table } from '../components/ui/UI';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Products.css';

const BLANK = { name: '', price: '', stock: '', lowStockThreshold: 5, barcode: '', category: 'General', unit: 'pcs', supplier: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [p, s] = await Promise.all([api.get('/products'), api.get('/suppliers')]);
    setProducts(p.data.products);
    setSuppliers(s.data.suppliers);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setForm(BLANK); setModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, price: p.price, stock: p.stock, lowStockThreshold: p.lowStockThreshold, barcode: p.barcode || '', category: p.category || 'General', unit: p.unit || 'pcs', supplier: p.supplier?._id || '' });
    setModal(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form, price: Number(form.price), stock: Number(form.stock), lowStockThreshold: Number(form.lowStockThreshold) };
      if (editing) {
        await api.put(`/products/${editing._id}`, body);
        toast.success('Product updated');
      } else {
        await api.post('/products', body);
        toast.success('Product added');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const del = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await api.delete(`/products/${p._id}`);
      toast.success('Product deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const displayed = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').includes(search);
    const matchFilter = filter === 'all' || p.stockStatus === filter;
    return matchSearch && matchFilter;
  });

  const columns = [
    { key: 'name', label: 'Product', render: p => (
      <div>
        <div style={{ fontWeight: 500 }}>{p.name}</div>
        {p.barcode && <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{p.barcode}</div>}
      </div>
    )},
    { key: 'category', label: 'Category', render: p => <Badge color="default">{p.category}</Badge> },
    { key: 'price', label: 'Price', render: p => <span style={{ fontFamily: 'var(--mono)' }}>₹{p.price}</span> },
    { key: 'stock', label: 'Stock', render: p => (
      <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: p.stock === 0 ? 'var(--red)' : p.stock <= p.lowStockThreshold ? 'var(--amber)' : 'var(--green)' }}>
        {p.stock} {p.unit}
      </span>
    )},
    { key: 'lowStockThreshold', label: 'Alert at', render: p => <span style={{ color: 'var(--text2)' }}>{p.lowStockThreshold}</span> },
    { key: 'supplier', label: 'Supplier', render: p => p.supplier?.name || <span style={{ color: 'var(--text3)' }}>—</span> },
    { key: 'status', label: 'Status', render: p => <StockBadge status={p.stockStatus} /> },
    { key: 'actions', label: '', render: p => (
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn size="sm" variant="ghost" onClick={() => openEdit(p)}>Edit</Btn>
        <Btn size="sm" variant="danger" onClick={() => del(p)}>Delete</Btn>
      </div>
    )},
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Products</div>
          <div className="page-sub">{products.length} items in inventory</div>
        </div>
        <Btn variant="primary" onClick={openAdd}>+ Add Product</Btn>
      </div>

      <div className="products-filters">
        <input className="prod-search" placeholder="Search by name or barcode…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="filter-tabs">
          {[['all', 'All'], ['in_stock', 'In stock'], ['low_stock', 'Low stock'], ['out_of_stock', 'Out of stock']].map(([v, l]) => (
            <button key={v} className={`filter-tab ${filter === v ? 'active' : ''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? <Spinner /> : <Table columns={columns} data={displayed} emptyText="No products match your filter" />}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit product' : 'Add product'}>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid-2">
            <Input label="Product name *" value={form.name} onChange={set('name')} placeholder="Bread" required />
            <Input label="Barcode" value={form.barcode} onChange={set('barcode')} placeholder="Optional" />
          </div>
          <div className="grid-2">
            <Input label="Price (₹) *" type="number" value={form.price} onChange={set('price')} min="0" step="0.01" required />
            <Input label="Stock quantity *" type="number" value={form.stock} onChange={set('stock')} min="0" required />
          </div>
          <div className="grid-2">
            <Input label="Low stock alert threshold" type="number" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} min="0" />
            <Select label="Unit" value={form.unit} onChange={set('unit')}>
              {['pcs', 'kg', 'g', 'litre', 'ml', 'dozen', 'pack'].map(u => <option key={u}>{u}</option>)}
            </Select>
          </div>
          <div className="grid-2">
            <Input label="Category" value={form.category} onChange={set('category')} placeholder="General" />
            <Select label="Supplier" value={form.supplier} onChange={set('supplier')}>
              <option value="">No supplier</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Btn type="button" variant="ghost" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn type="submit" variant="primary" loading={saving}>{editing ? 'Save changes' : 'Add product'}</Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
