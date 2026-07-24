import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatCard, Card, Badge, Spinner, Empty } from '../components/ui/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/bills/today'),
    ]).then(([r1, r2]) => {
      setData(r1.data);
      setBills(r2.data.bills || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><Spinner /></div>;

  const { today, stock, topProducts } = data;
  const chartData = topProducts.map(p => ({ name: p.name.length > 10 ? p.name.slice(0, 10) + '…' : p.name, qty: p.qty }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Good day, {user?.name?.split(' ')[0]} 👋</div>
          <div className="page-sub">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <button className="quick-bill-btn" onClick={() => navigate('/pos')}>
          + New Bill
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon="₹" label="Today's sales" value={`₹${today.totalSales.toLocaleString('en-IN')}`} color="green" sub={`${today.billCount} bills`} />
        <StatCard icon="🧾" label="Avg bill value" value={`₹${today.avgBillValue}`} color="blue" />
        <StatCard icon="⚠️" label="Low stock items" value={stock.lowStockCount} color="amber" sub="Need reorder soon" />
        <StatCard icon="🚫" label="Out of stock" value={stock.outOfStockCount} color="red" sub="Reorder now" />
      </div>

      <div className="dash-grid">
        {/* Today's bills */}
        <Card>
          <div className="card-head">
            <span className="card-title">Today's bills</span>
            <button className="view-all" onClick={() => navigate('/pos')}>View POS →</button>
          </div>
          {bills.length === 0
            ? <Empty icon="🧾" title="No bills yet today" sub="Go to Billing to create a sale" />
            : <div className="bills-list">
                {bills.slice(0, 8).map(b => (
                  <div className="bill-row" key={b._id}>
                    <div>
                      <span className="bill-num">{b.billNumber}</span>
                      <span className="bill-items">{b.items.map(i => `${i.productName} ×${i.quantity}`).join(', ')}</span>
                    </div>
                    <div className="bill-amount">₹{b.totalAmount}</div>
                  </div>
                ))}
              </div>
          }
        </Card>

        {/* Top products chart */}
        <Card>
          <div className="card-head">
            <span className="card-title">Top sold today</span>
          </div>
          {chartData.length === 0
            ? <Empty icon="📊" title="No sales yet" sub="Create a bill to see data" />
            : <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#8b90a7', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#8b90a7', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#1f2435', border: '1px solid #2a2f42', borderRadius: 8, fontSize: 12 }}
                    cursor={{ fill: 'rgba(79,142,247,0.08)' }}
                  />
                  <Bar dataKey="qty" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#4f8ef7' : '#363c54'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </Card>

        {/* Low stock alerts */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <div className="card-head">
            <span className="card-title">Stock alerts</span>
            <button className="view-all" onClick={() => navigate('/alerts')}>View all →</button>
          </div>
          {stock.outOfStockItems.length === 0 && stock.lowStockItems.length === 0
            ? <Empty icon="✅" title="All products well stocked" />
            : <div className="alerts-grid">
                {stock.outOfStockItems.map(p => (
                  <div className="alert-item alert-red" key={p._id}>
                    <span>{p.name}</span>
                    <Badge color="red">Out of stock</Badge>
                  </div>
                ))}
                {stock.lowStockItems.map(p => (
                  <div className="alert-item alert-amber" key={p._id}>
                    <span>{p.name} — <strong>{p.stock}</strong> left</span>
                    <Badge color="amber">Low stock</Badge>
                  </div>
                ))}
              </div>
          }
        </Card>
      </div>
    </div>
  );
}
