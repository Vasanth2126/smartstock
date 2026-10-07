import React, { useEffect, useState } from 'react';
import { StatCard, Card, Badge, Spinner, Empty, Table, Btn } from '../components/ui/UI';
import api from '../services/api';
import toast from 'react-hot-toast';
import './SuperAdmin.css';

export default function SuperAdmin() {
  const [stats, setStats]     = useState(null);
  const [shops, setShops]     = useState([]);
  const [users, setUsers]     = useState([]);
  const [tab, setTab]         = useState('shops'); // 'shops', 'users', 'detail'
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail]   = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadAll = async () => {
    try {
      const [s, sh, u] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/shops'),
        api.get('/admin/users'),
      ]);
      setStats(s.data.stats);
      setShops(sh.data.shops || []);
      setUsers(u.data.users || []);
    } catch (e) {
      toast.error('Failed to load superadmin data');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const toggleUser = async (userId, name, currentStatus) => {
    try {
      const { data } = await api.patch(`/admin/users/${userId}/toggle`);
      toast.success(data.message || `${name} status updated`);
      loadAll();
      if (detail && detail.owner?._id === userId) {
        setDetail(d => ({
          ...d,
          owner: { ...d.owner, isActive: !d.owner.isActive },
        }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const loadDetail = async (ownerId) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/admin/shops/${ownerId}`);
      setDetail(data);
      setTab('detail');
    } catch {
      toast.error('Failed to load shop inspection details');
    } finally { setDetailLoading(false); }
  };

  const filteredShops = shops.filter(s => {
    const matches = !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.shopName?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase());
    if (!matches) return false;
    if (statusFilter === 'active') return s.isActive === true;
    if (statusFilter === 'blocked') return s.isActive === false;
    return true;
  });

  const filteredUsers = users.filter(u => {
    const matches = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      (u.shopName || u.owner?.shopName || '').toLowerCase().includes(search.toLowerCase());
    if (!matches) return false;
    if (statusFilter === 'active') return u.isActive === true;
    if (statusFilter === 'blocked') return u.isActive === false;
    return true;
  });

  if (loading) return <div className="page"><Spinner /></div>;

  const shopColumns = [
    { key: 'shopName', label: 'Shop & Owner', render: s => (
      <div>
        <div style={{ fontWeight: 600, color: '#fff' }}>{s.shopName || s.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>Owner: {s.name} ({s.email})</div>
      </div>
    )},
    { key: 'everydaySales', label: '📅 Everyday (Today)', render: s => (
      <div>
        <div className="mono text-green" style={{ fontWeight: 700 }}>
          ₹{(s.sales?.today?.revenue || 0).toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{s.sales?.today?.count || 0} bills today</div>
      </div>
    )},
    { key: 'sevenDaySales', label: '📊 Last 7 Days', render: s => (
      <div>
        <div className="mono text-accent" style={{ fontWeight: 700 }}>
          ₹{(s.sales?.sevenDays?.revenue || 0).toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{s.sales?.sevenDays?.count || 0} bills (7d)</div>
      </div>
    )},
    { key: 'monthlySales', label: '📈 Monthly (30d)', render: s => (
      <div>
        <div className="mono text-purple" style={{ fontWeight: 700 }}>
          ₹{(s.sales?.monthly?.revenue || 0).toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{s.sales?.monthly?.count || 0} bills (30d)</div>
      </div>
    )},
    { key: 'status', label: 'Status', render: s => (
      <Badge color={s.isActive ? 'green' : 'red'}>{s.isActive ? 'Active' : 'Blocked'}</Badge>
    )},
    { key: 'actions', label: 'Actions', render: s => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="sa-btn sa-btn-ghost" onClick={() => loadDetail(s._id)}>Inspect Details →</button>
        <button
          className={`sa-btn ${s.isActive ? 'sa-btn-danger' : 'sa-btn-success'}`}
          onClick={() => toggleUser(s._id, s.shopName || s.name, s.isActive)}
        >
          {s.isActive ? 'Block Shop' : 'Unblock Shop'}
        </button>
      </div>
    )},
  ];

  const userColumns = [
    { key: 'name', label: 'User Details', render: u => (
      <div>
        <div style={{ fontWeight: 600 }}>{u.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>{u.email}</div>
      </div>
    )},
    { key: 'role', label: 'Role', render: u => (
      <Badge color={u.role==='superadmin'?'purple':u.role==='owner'?'blue':'default'}>{u.role.toUpperCase()}</Badge>
    )},
    { key: 'shop', label: 'Store Association', render: u => u.owner?.shopName || u.shopName || 'Platform HQ' },
    { key: 'createdAt', label: 'Registered Date', render: u => new Date(u.createdAt).toLocaleDateString('en-IN') },
    { key: 'status', label: 'Status', render: u => <Badge color={u.isActive?'green':'red'}>{u.isActive?'Active':'Blocked'}</Badge> },
    { key: 'actions', label: '', render: u => u.role !== 'superadmin' && (
      <button
        className={`sa-btn ${u.isActive?'sa-btn-danger':'sa-btn-success'}`}
        onClick={() => toggleUser(u._id, u.name, u.isActive)}
      >
        {u.isActive ? 'Block User' : 'Unblock User'}
      </button>
    )},
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">👑 Super Admin Portal</div>
          <div className="page-sub">Shop governance, sales surveillance & access control (Everyday, 7 Days, Monthly)</div>
        </div>
      </div>

      <div className="sa-tabs">
        <button className={`sa-tab ${tab==='shops'?'active':''}`} onClick={()=>setTab('shops')}>
          🏪 Shops & Sales Breakdown ({shops.length})
        </button>
        <button className={`sa-tab ${tab==='users'?'active':''}`} onClick={()=>setTab('users')}>
          👥 Platform Users ({users.length})
        </button>
        {detail && (
          <button className={`sa-tab ${tab==='detail'?'active':''}`} onClick={()=>setTab('detail')}>
            🔍 Shop Inspection: {detail.owner.shopName || detail.owner.name}
          </button>
        )}
      </div>

      {/* Search and Filters */}
      {tab !== 'detail' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <input
            className="sa-search"
            style={{ margin: 0, flex: 1 }}
            placeholder={tab === 'shops' ? 'Search shops by name, owner, or email…' : 'Search users…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={statusFilter === 'all' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button
              className={statusFilter === 'active' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              onClick={() => setStatusFilter('active')}
            >
              Active
            </button>
            <button
              className={statusFilter === 'blocked' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              onClick={() => setStatusFilter('blocked')}
            >
              Blocked
            </button>
          </div>
        </div>
      )}

      {/* SHOPS TAB */}
      {tab === 'shops' && (
        <Table columns={shopColumns} data={filteredShops} emptyText="No shops found" />
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <Table columns={userColumns} data={filteredUsers} emptyText="No users found" />
      )}

      {/* DETAIL INSPECTION TAB */}
      {tab === 'detail' && (
        detailLoading ? <Spinner /> : detail && (
          <div className="detail-grid">
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>{detail.owner.shopName || detail.owner.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Owner: {detail.owner.name} ({detail.owner.email})</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Joined: {new Date(detail.owner.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
                <Badge color={detail.owner.isActive ? 'green' : 'red'}>{detail.owner.isActive ? 'Active' : 'Blocked'}</Badge>
              </div>

              <div style={{ marginBottom: 16 }}>
                <button
                  className={`sa-btn ${detail.owner.isActive ? 'sa-btn-danger' : 'sa-btn-success'}`}
                  style={{ width: '100%', padding: '10px 16px' }}
                  onClick={() => toggleUser(detail.owner._id, detail.owner.shopName || detail.owner.name, detail.owner.isActive)}
                >
                  {detail.owner.isActive ? '🚫 Block This Entire Shop' : '✅ Unblock This Shop'}
                </button>
              </div>

              {/* Exact Sales Matrix */}
              <div className="grid-2" style={{ gap: 10 }}>
                <StatCard
                  icon="📅"
                  label="Everyday (Today Sales)"
                  value={`₹${(detail.sales?.today?.revenue || 0).toLocaleString('en-IN')}`}
                  color="green"
                  sub={`${detail.sales?.today?.count || 0} bills today`}
                />
                <StatCard
                  icon="📊"
                  label="Last 7 Days Sales"
                  value={`₹${(detail.sales?.sevenDays?.revenue || 0).toLocaleString('en-IN')}`}
                  color="blue"
                  sub={`${detail.sales?.sevenDays?.count || 0} bills in 7d`}
                />
                <StatCard
                  icon="📈"
                  label="Monthly (30 Days Sales)"
                  value={`₹${(detail.sales?.monthly?.revenue || 0).toLocaleString('en-IN')}`}
                  color="purple"
                  sub={`${detail.sales?.monthly?.count || 0} bills in 30d`}
                />
                <StatCard
                  icon="💰"
                  label="All-Time Total Revenue"
                  value={`₹${(detail.sales?.allTime?.revenue || 0).toLocaleString('en-IN')}`}
                  color="cyan"
                  sub={`${detail.summary?.totalBills || 0} total bills`}
                />
              </div>
            </Card>

            <Card>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Store Staff ({detail.staff.length})</div>
              {detail.staff.length === 0 ? (
                <Empty icon="👥" title="No staff members" />
              ) : (
                detail.staff.map(s => (
                  <div key={s._id} className="staff-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.email}</div>
                    </div>
                    <button
                      className={`sa-btn ${s.isActive ? 'sa-btn-danger' : 'sa-btn-success'}`}
                      onClick={() => toggleUser(s._id, s.name, s.isActive)}
                    >
                      {s.isActive ? 'Block Staff' : 'Unblock Staff'}
                    </button>
                  </div>
                ))
              )}
            </Card>

            <Card style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Recent Sales Transactions</div>
              <Table
                columns={[
                  { key: 'billNumber', label: 'Bill #', render: b => <span className="mono text-accent">{b.billNumber}</span> },
                  { key: 'items', label: 'Items', render: b => b.items.map(i => `${i.productName} ×${i.quantity}`).join(', ') },
                  { key: 'paymentMethod', label: 'Payment Mode', render: b => <Badge color="blue">{b.paymentMethod?.toUpperCase()}</Badge> },
                  { key: 'totalAmount', label: 'Total Paid', render: b => <span className="mono text-green">₹{b.totalAmount}</span> },
                  { key: 'billDate', label: 'Date', render: b => b.billDate || new Date(b.createdAt).toLocaleDateString('en-IN') },
                ]}
                data={detail.recentBills}
                emptyText="No bills yet"
              />
            </Card>
          </div>
        )
      )}
    </div>
  );
}