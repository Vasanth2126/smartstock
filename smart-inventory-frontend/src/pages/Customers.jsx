import React, { useEffect, useState } from 'react';
import { Card, StatCard, Badge, Spinner, Empty, Table, Btn, Modal, Input } from '../components/ui/UI';
import {
  Users,
  Search,
  Plus,
  Coins,
  CreditCard,
  Phone,
  Mail,
  Receipt,
  UserCheck,
  DollarSign,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const BLANK_CUSTOMER = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  creditBalance: 0,
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK_CUSTOMER);
  const [saving, setSaving] = useState(false);

  // Credit adjustment modal
  const [creditModal, setCreditModal] = useState(false);
  const [selectedCust, setSelectedCust] = useState(null);
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditReason, setCreditReason] = useState('');

  const loadCustomers = async () => {
    try {
      const { data } = await api.get('/customers');
      setCustomers(data.customers || []);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK_CUSTOMER);
    setModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
      notes: c.notes || '',
      creditBalance: c.creditBalance || 0,
    });
    setModal(true);
  };

  const openCreditAdjust = (c) => {
    setSelectedCust(c);
    setCreditAmount(0);
    setCreditReason('Khata / Store Credit Settlement');
    setCreditModal(true);
  };

  const saveCustomer = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/customers/${editing._id}`, form);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', form);
        toast.success('Customer created');
      }
      setModal(false);
      loadCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const submitCreditAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedCust) return;
    try {
      await api.post(`/customers/${selectedCust._id}/adjust-credit`, {
        amount: Number(creditAmount),
        reason: creditReason,
      });
      toast.success(`Khata balance updated by ₹${creditAmount}`);
      setCreditModal(false);
      loadCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Credit adjustment failed');
    }
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      !search ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(search) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  const totalLoyalty = customers.reduce((s, c) => s + (c.loyaltyPoints || 0), 0);
  const totalRevenue = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);

  const columns = [
    {
      key: 'name',
      label: 'Customer Details',
      render: (c) => (
        <div>
          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{c.name}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2, fontSize: 11, color: '#94a3b8' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Phone size={11} /> {c.phone}
            </span>
            {c.email && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Mail size={11} /> {c.email}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'loyaltyPoints',
      label: 'Loyalty Points',
      render: (c) => (
        <span className="font-mono font-bold" style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Coins size={14} /> {c.loyaltyPoints} pts
        </span>
      ),
    },
    {
      key: 'totalSpent',
      label: 'Lifetime Value (LTV)',
      render: (c) => (
        <div>
          <div className="font-mono font-bold" style={{ color: '#38bdf8' }}>
            ₹{c.totalSpent.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-muted">{c.visitCount} visits</div>
        </div>
      ),
    },
    {
      key: 'creditBalance',
      label: 'Khata / Credit Ledger',
      render: (c) => (
        <span
          className="font-mono font-bold"
          style={{
            color: (c.creditBalance || 0) < 0 ? '#f87171' : (c.creditBalance || 0) > 0 ? '#34d399' : '#94a3b8',
          }}
        >
          {(c.creditBalance || 0) < 0 ? `Owes ₹${Math.abs(c.creditBalance)}` : (c.creditBalance || 0) > 0 ? `Credit ₹${c.creditBalance}` : '₹0.00'}
        </span>
      ),
    },
    {
      key: 'lastVisit',
      label: 'Last Interaction',
      render: (c) => (
        <span className="text-xs text-muted font-mono">
          {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (c) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn size="sm" variant="ghost" title="Adjust Khata Balance" onClick={() => openCreditAdjust(c)}>
            <DollarSign size={13} /> Khata
          </Btn>
          <Btn size="sm" variant="ghost" onClick={() => openEdit(c)}>
            Edit
          </Btn>
        </div>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Customer Relationship Management (CRM)</div>
          <div className="page-sub">
            Track customer lifetime value (LTV), loyalty rewards, and store credit (Khata) balances
          </div>
        </div>
        <Btn variant="primary" onClick={openAdd}>
          <Plus size={16} /> Add Customer
        </Btn>
      </div>

      {/* KPI Stats */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <StatCard
          icon={Users}
          label="Registered Customers"
          value={customers.length}
          color="indigo"
          sub="Loyalty program members"
        />
        <StatCard
          icon={Coins}
          label="Total Loyalty Points in Circulation"
          value={totalLoyalty}
          color="amber"
          sub="Available for POS redemption"
        />
        <StatCard
          icon={UserCheck}
          label="CRM Lifetime Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          color="emerald"
          sub="Generated from registered customers"
        />
      </div>

      {/* Search Bar */}
      <div className="products-filters">
        <input
          className="prod-search"
          placeholder="Search by Customer Name, Phone, or Email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : (
        <Table columns={columns} data={filtered} emptyText="No customer accounts match search" />
      )}

      {/* Customer Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? `Edit Customer: ${editing.name}` : 'Register New Customer'}
        width={480}
      >
        <form onSubmit={saveCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="Customer Full Name *" value={form.name} onChange={set('name')} placeholder="David Miller" required />
          <Input label="Phone Number (10 Digits) *" value={form.phone} onChange={set('phone')} placeholder="9876543210" required />
          <Input label="Email Address" type="email" value={form.email} onChange={set('email')} placeholder="david.miller@gmail.com" />
          <Input label="Billing Address" value={form.address} onChange={set('address')} placeholder="Suite 402, High Street" />
          <Input label="Internal CRM Notes" value={form.notes} onChange={set('notes')} placeholder="VIP customer, prefers UPI" />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn type="button" variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Btn>
            <Btn type="submit" variant="primary" loading={saving}>
              {editing ? 'Update Customer' : 'Save Customer'}
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Credit (Khata) Adjustment Modal */}
      <Modal
        open={creditModal}
        onClose={() => setCreditModal(false)}
        title={selectedCust ? `Adjust Khata Balance: ${selectedCust.name}` : 'Khata Ledger Adjustment'}
        width={420}
      >
        {selectedCust && (
          <form onSubmit={submitCreditAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="adjust-info-box">
              <div>Customer: <strong>{selectedCust.name}</strong> ({selectedCust.phone})</div>
              <div>Current Balance: <strong className="font-mono">₹{selectedCust.creditBalance || 0}</strong></div>
            </div>

            <Input
              label="Adjustment Amount (₹) (Use negative for debt, positive for payment) *"
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="e.g. 500 or -200"
              required
            />

            <Input
              label="Audit Note / Settlement Reference"
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              placeholder="Payment received via GooglePay"
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn type="button" variant="ghost" onClick={() => setCreditModal(false)}>
                Cancel
              </Btn>
              <Btn type="submit" variant="primary">
                Commit Balance
              </Btn>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
