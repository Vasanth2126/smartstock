import React, { useEffect, useState } from 'react';
import { StatCard, Card, Badge, Spinner, Empty, Table } from '../components/ui/UI';
import api from '../services/api';
import toast from 'react-hot-toast';
import './SuperAdmin.css';

export default function SuperAdmin() {
  const [stats, setStats]     = useState(null);
  const [shops, setShops]     = useState([]);
  const [users, setUsers]     = useState([]);
  const [tab, setTab]         = useState('overview');
  const [search, setSearch]   = useState('');
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
      setShops(sh.data.shops);
      setUsers(u.data.users);
    } catch (e) {
      toast.error('Failed to load admin data');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const toggleUser = async (userId) => {
    try {
      const { data } = await api.patch(`/admin/users/${userId}/toggle`);
      toast.success(data.message);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const loadDetail = async (ownerId) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/admin/shops/${ownerId}`);
      setDetail(data);
      setTab('detail');
    } finally { setDetailLoading(false); }
  };

  const filteredShops = shops.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.shopName?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page"><Spinner /></div>;

  const shopColumns = [
    { key: 'shopName', label: 'Shop', render: s => (
      <div>
        <div style={{ fontWeight: 500 }}>{s.shopName || s.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.email}</div>
      </div>
    )},
    { key: 'owner',        label: 'Owner',    render: s => s.name },
    { key: 'productCount', label: 'Products', render: s => <span className="mono">{s.productCount}</span> },
    { key: 'billCount',    label: 'Bills',    render: s => <span className="mono">{s.billCount}</span> },
    { key: 'totalRevenue', label: 'Revenue',  render: s => <span className="mono text-green">₹{(s.totalRevenue||0).toLocaleString('en-IN')}</span> },
    { key: 'staffCount',   label: 'Staff',    render: s => <span className="mono">{s.staffCount}</span> },
    { key: 'isActive',     label: 'Status',   render: s => <Badge color={s.isActive ? 'green' : 'red'}>{s.isActive ? 'Active' : 'Blocked'}</Badge> },
    { key: 'actions', label: '', render: s => (
      <div style={{ display:'flex', gap:8 }}>
        <button className="sa-btn sa-btn-ghost" onClick={() => loadDetail(s._id)}>View →</button>
        <button className={`sa-btn ${s.isActive ? 'sa-btn-danger' : 'sa-btn-success'}`} onClick={() => toggleUser(s._id)}>
          {s.isActive ? 'Block' : 'Unblock'}
        </button>
      </div>
    )},
  ];

  const userColumns = [
    { key: 'name', label: 'Name', render: u => (
      <div>
        <div style={{ fontWeight: 500 }}>{u.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>{u.email}</div>
      </div>
    )},
    { key: 'role', label: 'Role', render: u => (
      <Badge color={u.role==='superadmin'?'purple':u.role==='owner'?'blue':'default'}>{u.role}</Badge>
    )},
    { key: 'owner',     label: 'Shop',       render: u => u.owner?.shopName || u.shopName || '—' },
    { key: 'lastLogin', label: 'Last login',  render: u => u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never' },
    { key: 'isActive',  label: 'Status',     render: u => <Badge color={u.isActive?'green':'red'}>{u.isActive?'Active':'Blocked'}</Badge> },
    { key: 'actions',   label: '',           render: u => u.role !== 'superadmin' && (
      <button className={`sa-btn ${u.isActive?'sa-btn-danger':'sa-btn-success'}`} onClick={() => toggleUser(u._id)}>
        {u.isActive ? 'Block' : 'Unblock'}
      </button>
    )},
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">⚡ Super Admin Panel</div>
          <div className="page-sub">Platform-wide management — all shops and users</div>
        </div>
      </div>

      <div className="sa-tabs">
        {[
          ['overview','Overview'],
          ['shops','All Shops'],
          ['users','All Users'],
          ...(detail?[['detail',`Shop: ${detail?.owner?.shopName||''}`]]:[])
        ].map(([key,label]) => (
          <button key={key} className={`sa-tab ${tab===key?'active':''}`} onClick={()=>setTab(key)}>{label}</button>
        ))}
      </div>

      {tab==='overview' && stats && (
        <>
          <div className="grid-4" style={{marginBottom:24}}>
            <StatCard icon="🏪" label="Total shops"     value={stats.totalShops}    color="blue" />
            <StatCard icon="👥" label="Total staff"     value={stats.totalStaff}    color="default" />
            <StatCard icon="📦" label="Total products"  value={stats.totalProducts} color="purple" />
            <StatCard icon="₹"  label="Today's revenue" value={`₹${(stats.todayRevenue||0).toLocaleString('en-IN')}`} color="green" sub={`${stats.todayBillCount} bills today`} />
          </div>
          <Card>
            <div style={{fontWeight:600,fontSize:14,marginBottom:16}}>Recently registered shops</div>
            <Table
              columns={[
                {key:'shopName',label:'Shop',render:s=>s.shopName||s.name},
                {key:'email',label:'Email'},
                {key:'isActive',label:'Status',render:s=><Badge color={s.isActive?'green':'red'}>{s.isActive?'Active':'Blocked'}</Badge>},
                {key:'createdAt',label:'Joined',render:s=>new Date(s.createdAt).toLocaleDateString('en-IN')},
                {key:'actions',label:'',render:s=><button className="sa-btn sa-btn-ghost" onClick={()=>loadDetail(s._id)}>View →</button>},
              ]}
              data={shops.slice(0,5)}
            />
          </Card>
        </>
      )}

      {tab==='shops' && (
        <>
          <input className="sa-search" placeholder="Search shops…" value={search} onChange={e=>setSearch(e.target.value)} />
          <Table columns={shopColumns} data={filteredShops} emptyText="No shops found" />
        </>
      )}

      {tab==='users' && (
        <>
          <input className="sa-search" placeholder="Search users…" value={search} onChange={e=>setSearch(e.target.value)} />
          <Table columns={userColumns} data={filteredUsers} emptyText="No users found" />
        </>
      )}

      {tab==='detail' && (
        detailLoading ? <Spinner /> : detail && (
          <div className="detail-grid">
            <Card>
              <div style={{fontWeight:600,fontSize:15,marginBottom:16}}>{detail.owner.shopName||detail.owner.name}</div>
              <div className="detail-info">
                <span className="detail-label">Owner</span><span>{detail.owner.name}</span>
                <span className="detail-label">Email</span><span>{detail.owner.email}</span>
                <span className="detail-label">Status</span><Badge color={detail.owner.isActive?'green':'red'}>{detail.owner.isActive?'Active':'Blocked'}</Badge>
                <span className="detail-label">Joined</span><span>{new Date(detail.owner.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="grid-2" style={{marginTop:16}}>
                <StatCard icon="₹"  label="Today's sales" value={`₹${(detail.summary.todaySales||0).toLocaleString('en-IN')}`} color="green" />
                <StatCard icon="🧾" label="Total bills"   value={detail.summary.totalBills} color="blue" />
              </div>
              <div style={{marginTop:12}}>
                <button className={`sa-btn ${detail.owner.isActive?'sa-btn-danger':'sa-btn-success'}`} onClick={()=>toggleUser(detail.owner._id)}>
                  {detail.owner.isActive?'Block this shop':'Unblock this shop'}
                </button>
              </div>
            </Card>
            <Card>
              <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Staff ({detail.staff.length})</div>
              {detail.staff.length===0
                ? <Empty icon="👥" title="No staff members" />
                : detail.staff.map(s=>(
                    <div key={s._id} className="staff-row">
                      <div>
                        <div style={{fontWeight:500,fontSize:13}}>{s.name}</div>
                        <div style={{fontSize:11,color:'var(--text2)'}}>{s.email}</div>
                      </div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>
                        {s.lastLogin?`Last: ${new Date(s.lastLogin).toLocaleDateString('en-IN')}`:'Never logged in'}
                      </div>
                    </div>
                  ))
              }
            </Card>
            <Card style={{gridColumn:'1 / -1'}}>
              <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>Recent bills</div>
              <Table
                columns={[
                  {key:'billNumber',label:'Bill #',render:b=><span className="mono text-accent">{b.billNumber}</span>},
                  {key:'items',label:'Items',render:b=>b.items.map(i=>`${i.productName} ×${i.quantity}`).join(', ')},
                  {key:'totalAmount',label:'Total',render:b=><span className="mono text-green">₹{b.totalAmount}</span>},
                  {key:'billDate',label:'Date'},
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