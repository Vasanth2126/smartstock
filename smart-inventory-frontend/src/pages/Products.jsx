import React, { useEffect, useState } from 'react';
import {
  Btn,
  Badge,
  StockBadge,
  Spinner,
  Empty,
  Modal,
  Input,
  Select,
  Table,
} from '../components/ui/UI';
import {
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  AlertTriangle,
  Barcode,
  Sliders,
  Printer,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Products.css';

const BLANK = {
  name: '',
  sku: '',
  barcode: '',
  category: 'General',
  costPrice: '',
  price: '',
  taxRate: 0,
  stock: '',
  lowStockThreshold: 5,
  unit: 'pcs',
  batchNumber: '',
  expiryDate: '',
  supplier: '',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');

  // Product Form Modal
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  // Stock Adjustment Modal
  const [adjustModal, setAdjustModal] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Physical Stock Audit Count');
  const [adjusting, setAdjusting] = useState(false);

  // Bulk CSV Import Modal
  const [importModal, setImportModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  const load = async () => {
    try {
      const [p, s] = await Promise.all([api.get('/products'), api.get('/suppliers')]);
      setProducts(p.data.products || []);
      setSuppliers(s.data.suppliers || []);
    } catch (err) {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK);
    setModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku || '',
      barcode: p.barcode || '',
      category: p.category || 'General',
      costPrice: p.costPrice || '',
      price: p.price,
      taxRate: p.taxRate || 0,
      stock: p.stock,
      lowStockThreshold: p.lowStockThreshold || 5,
      unit: p.unit || 'pcs',
      batchNumber: p.batchNumber || '',
      expiryDate: p.expiryDate ? p.expiryDate.split('T')[0] : '',
      supplier: p.supplier?._id || '',
    });
    setModal(true);
  };

  const openAdjustStock = (p) => {
    setAdjustProduct(p);
    setAdjustQty(p.stock);
    setAdjustReason('Physical Stock Audit Count');
    setAdjustModal(true);
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        costPrice: Number(form.costPrice) || 0,
        price: Number(form.price),
        taxRate: Number(form.taxRate) || 0,
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        expiryDate: form.expiryDate ? new Date(form.expiryDate) : null,
      };

      if (editing) {
        await api.put(`/products/${editing._id}`, body);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', body);
        toast.success('Product created successfully');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustProduct) return;
    setAdjusting(true);
    try {
      await api.post(`/products/${adjustProduct._id}/adjust-stock`, {
        newStock: Number(adjustQty),
        reason: adjustReason,
      });
      toast.success(`Stock for "${adjustProduct.name}" updated to ${adjustQty}`);
      setAdjustModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Stock adjustment failed');
    } finally {
      setAdjusting(false);
    }
  };

  const deleteProduct = async (p) => {
    if (!window.confirm(`Deactivate product "${p.name}"?`)) return;
    try {
      await api.delete(`/products/${p._id}`);
      toast.success('Product deactivated');
      load();
    } catch (err) {
      toast.error('Deactivation failed');
    }
  };

  // CSV Bulk Import Handler
  const handleBulkImport = async () => {
    if (!csvText.trim()) {
      toast.error('Paste CSV content before importing');
      return;
    }
    setImporting(true);
    try {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const parsedProducts = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const vals = lines[i].split(',').map((v) => v.trim());
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = vals[idx];
        });

        if (row.name && row.price) {
          parsedProducts.push({
            name: row.name,
            sku: row.sku || '',
            barcode: row.barcode || '',
            category: row.category || 'General',
            costPrice: Number(row.costprice || row.cost || 0),
            price: Number(row.price),
            stock: Number(row.stock || 0),
            unit: row.unit || 'pcs',
            lowStockThreshold: Number(row.threshold || 5),
            batchNumber: row.batch || '',
            expiryDate: row.expiry || null,
          });
        }
      }

      if (parsedProducts.length === 0) {
        toast.error('No valid products detected in CSV data');
        return;
      }

      const { data } = await api.post('/products/bulk-import', { products: parsedProducts });
      toast.success(`Successfully imported ${data.importedCount} products!`);
      setImportModal(false);
      setCsvText('');
      load();
    } catch (err) {
      toast.error('CSV import failed');
    } finally {
      setImporting(false);
    }
  };

  // Export Catalogue to CSV
  const exportCatalogueCSV = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }
    const headers = 'Name,SKU,Barcode,Category,CostPrice,SellingPrice,Stock,Unit,Threshold,Batch,Expiry,Supplier\n';
    const rows = products
      .map(
        (p) =>
          `"${p.name}","${p.sku || ''}","${p.barcode || ''}","${p.category || 'General'}",${p.costPrice || 0},${p.price},${p.stock},"${p.unit || 'pcs'}",${p.lowStockThreshold || 5},"${p.batchNumber || ''}","${p.expiryDate ? p.expiryDate.split('T')[0] : ''}","${p.supplier?.name || ''}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SmartStock_Catalogue_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Catalogue exported to CSV');
  };

  // Filtered Products
  const displayed = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(q) ||
      (p.barcode || '').includes(search) ||
      (p.sku || '').toLowerCase().includes(q);

    let matchStock = true;
    if (filter === 'in_stock') matchStock = p.stockStatus === 'in_stock';
    else if (filter === 'low_stock') matchStock = p.stockStatus === 'low_stock';
    else if (filter === 'out_of_stock') matchStock = p.stockStatus === 'out_of_stock';

    let matchExpiry = true;
    if (expiryFilter === 'expired') matchExpiry = p.isExpired;
    else if (expiryFilter === 'near_expiry') matchExpiry = p.isNearExpiry;

    return matchSearch && matchStock && matchExpiry;
  });

  const columns = [
    {
      key: 'name',
      label: 'Product & SKU',
      render: (p) => (
        <div>
          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{p.name}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
            {p.sku && <span className="table-sku-chip font-mono">{p.sku}</span>}
            {p.barcode && <span className="table-barcode-chip font-mono">{p.barcode}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (p) => <Badge color="default">{p.category}</Badge>,
    },
    {
      key: 'pricing',
      label: 'Pricing & Margin',
      render: (p) => (
        <div>
          <div className="font-mono font-bold" style={{ color: '#38bdf8' }}>
            ₹{p.price}
          </div>
          <div className="font-mono text-xs text-muted">
            Cost: ₹{p.costPrice || 0}
            {p.marginPercentage !== undefined && (
              <span className={`margin-badge ${p.marginPercentage >= 30 ? 'high-margin' : 'mod-margin'}`}>
                +{p.marginPercentage}%
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock Level',
      render: (p) => (
        <div>
          <span
            className="font-mono font-bold"
            style={{
              color:
                p.stock === 0 ? 'var(--red)' : p.stock <= p.lowStockThreshold ? 'var(--amber)' : 'var(--green)',
            }}
          >
            {p.stock} {p.unit}
          </span>
          <div className="text-xs text-muted">Alert: &le; {p.lowStockThreshold}</div>
        </div>
      ),
    },
    {
      key: 'batchExpiry',
      label: 'Batch / Expiry',
      render: (p) => {
        if (!p.expiryDate && !p.batchNumber) {
          return <span className="text-muted text-xs">—</span>;
        }
        return (
          <div className="text-xs">
            {p.batchNumber && <div className="font-mono">{p.batchNumber}</div>}
            {p.isExpired ? (
              <span className="expiry-tag expired">Expired ({p.expiryDate.split('T')[0]})</span>
            ) : p.isNearExpiry ? (
              <span className="expiry-tag near-expiry">Near Expiry ({p.expiryDate.split('T')[0]})</span>
            ) : p.expiryDate ? (
              <span className="text-muted font-mono">{p.expiryDate.split('T')[0]}</span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => <StockBadge status={p.stockStatus} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (p) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn size="sm" variant="ghost" title="Quick Stock Adjustment" onClick={() => openAdjustStock(p)}>
            <Sliders size={13} />
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => openEdit(p)}>
            Edit
          </Btn>
          <Btn size="sm" variant="danger" onClick={() => deleteProduct(p)}>
            Delete
          </Btn>
        </div>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Enterprise Inventory Catalogue</div>
          <div className="page-sub">
            {products.length} registered articles &bull; Profit Margin & Expiry Tracked
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="default" onClick={() => setImportModal(true)}>
            <Upload size={14} /> Bulk CSV Import
          </Btn>
          <Btn variant="default" onClick={exportCatalogueCSV}>
            <Download size={14} /> Export CSV
          </Btn>
          <Btn variant="primary" onClick={openAdd}>
            <Plus size={16} /> Add Product
          </Btn>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="products-filters">
        <input
          className="prod-search"
          placeholder="Search by Name, SKU, Barcode, or Batch Number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {[
            ['all', 'All Stock'],
            ['in_stock', 'In Stock'],
            ['low_stock', '⚡ Low Stock'],
            ['out_of_stock', '🔴 Out of Stock'],
          ].map(([v, l]) => (
            <button
              key={v}
              className={`filter-tab ${filter === v ? 'active' : ''}`}
              onClick={() => setFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Product Table */}
      {loading ? (
        <Spinner />
      ) : (
        <Table columns={columns} data={displayed} emptyText="No inventory products match your criteria" />
      )}

      {/* Create / Edit Product Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? `Edit Product: ${editing.name}` : 'Register New Inventory Product'}
        width={580}
      >
        <form onSubmit={saveProduct} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid-2">
            <Input label="Product Name *" value={form.name} onChange={set('name')} placeholder="Organic Almond Milk 1L" required />
            <Input label="Category" value={form.category} onChange={set('category')} placeholder="Beverages" />
          </div>

          <div className="grid-3">
            <Input label="SKU / Article Code" value={form.sku} onChange={set('sku')} placeholder="BEV-1001" />
            <Input label="Barcode (EAN/UPC)" value={form.barcode} onChange={set('barcode')} placeholder="8901030383821" />
            <Select label="Unit of Measure" value={form.unit} onChange={set('unit')}>
              {['pcs', 'kg', 'g', 'litre', 'ml', 'box', 'pack', 'meter'].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid-3">
            <Input label="Cost Price (₹)" type="number" value={form.costPrice} onChange={set('costPrice')} min="0" step="0.01" placeholder="160" />
            <Input label="Selling Price (₹) *" type="number" value={form.price} onChange={set('price')} min="0" step="0.01" placeholder="240" required />
            <Input label="GST / Tax Rate (%)" type="number" value={form.taxRate} onChange={set('taxRate')} min="0" max="100" placeholder="5" />
          </div>

          <div className="grid-2">
            <Input label="Stock In Hand *" type="number" value={form.stock} onChange={set('stock')} min="0" placeholder="50" required />
            <Input label="Low Stock Alert Threshold" type="number" value={form.lowStockThreshold} onChange={set('lowStockThreshold')} min="0" placeholder="10" />
          </div>

          <div className="grid-2">
            <Input label="Batch Number" value={form.batchNumber} onChange={set('batchNumber')} placeholder="BATCH-2026-08" />
            <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={set('expiryDate')} />
          </div>

          <Select label="Associated Supplier" value={form.supplier} onChange={set('supplier')}>
            <option value="">No supplier assigned</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.phone})
              </option>
            ))}
          </Select>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn type="button" variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Btn>
            <Btn type="submit" variant="primary" loading={saving}>
              {editing ? 'Update Product' : 'Save Product'}
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Quick Stock Adjustment Modal */}
      <Modal
        open={adjustModal}
        onClose={() => setAdjustModal(false)}
        title={adjustProduct ? `Adjust Stock: ${adjustProduct.name}` : 'Stock Adjustment'}
        width={440}
      >
        {adjustProduct && (
          <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="adjust-info-box">
              <div>Current Recorded Stock: <strong>{adjustProduct.stock} {adjustProduct.unit}</strong></div>
              <div>Product SKU: <code>{adjustProduct.sku || 'N/A'}</code></div>
            </div>

            <Input
              label="New Exact Physical Count Quantity *"
              type="number"
              min="0"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              required
            />

            <Select
              label="Adjustment Reason (Audited)"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            >
              <option value="Physical Stock Audit Count">Physical Stock Audit Count</option>
              <option value="Supplier Direct Restock">Supplier Direct Restock</option>
              <option value="Damaged / Broken Goods">Damaged / Broken Goods</option>
              <option value="Expired Product Disposal">Expired Product Disposal</option>
              <option value="Theft / Unaccounted Shrinkage">Theft / Unaccounted Shrinkage</option>
            </Select>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn type="button" variant="ghost" onClick={() => setAdjustModal(false)}>
                Cancel
              </Btn>
              <Btn type="submit" variant="primary" loading={adjusting}>
                Commit Adjustment
              </Btn>
            </div>
          </form>
        )}
      </Modal>

      {/* Bulk CSV Import Modal */}
      <Modal open={importModal} onClose={() => setImportModal(false)} title="Bulk Import Products via CSV" width={560}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="csv-sample-info">
            <p style={{ margin: 0, fontSize: 12 }}>
              Paste comma-separated CSV rows below. Header format:
            </p>
            <code style={{ fontSize: 11, display: 'block', margin: '4px 0', background: 'rgba(0,0,0,0.3)', padding: 6, borderRadius: 4 }}>
              name,sku,barcode,category,costPrice,price,stock,unit,threshold,batch,expiry
            </code>
          </div>

          <textarea
            className="csv-textarea font-mono"
            rows={8}
            placeholder={`Organic Honey 500g,HON-01,8901111222,Groceries,150,220,30,pcs,5,BATCH-01,2026-12-31\nGreen Tea 100 Bags,TEA-02,8901111333,Beverages,110,180,45,box,10,BATCH-02,2027-01-15`}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn type="button" variant="ghost" onClick={() => setImportModal(false)}>
              Cancel
            </Btn>
            <Btn type="button" variant="primary" loading={importing} onClick={handleBulkImport}>
              <Upload size={14} /> Process & Import
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
