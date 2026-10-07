import React, { useEffect, useState } from 'react';
import { StatCard, Card, Spinner, Empty } from '../components/ui/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import api from '../services/api';

const fmtDate = (d) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/reports/dashboard'),
      api.get(`/reports/sales?from=${from}&to=${to}`),
    ]).then(([r1, r2]) => {
      setSummary(r1.data);
      setSales(r2.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toCustom = { contentStyle: { background: '#1f2435', border: '1px solid #2a2f42', borderRadius: 8, fontSize: 12 }, cursor: { fill: 'rgba(79,142,247,0.08)' } };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Reports</div>
          <div className="page-sub">Sales analytics and performance</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" className="bill-input" style={{ width: 140 }} value={from} onChange={e => setFrom(e.target.value)} />
          <span style={{ color: 'var(--text2)', fontSize: 13 }}>to</span>
          <input type="date" className="bill-input" style={{ width: 140 }} value={to} onChange={e => setTo(e.target.value)} />
          <button onClick={load} style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 13, cursor: 'pointer' }}>Apply</button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Today stats */}
          <div className="grid-4" style={{ marginBottom: 24 }}>
            <StatCard icon="₹" label="Today's revenue" value={`₹${(summary?.today?.totalSales || 0).toLocaleString('en-IN')}`} color="green" />
            <StatCard icon="🧾" label="Bills today" value={summary?.today?.billCount || 0} color="blue" />
            <StatCard icon="📦" label="Revenue in period" value={`₹${(sales?.totalRevenue || 0).toLocaleString('en-IN')}`} color="purple" />
            <StatCard icon="📈" label="Avg bill value" value={`₹${(summary?.today?.avgBillValue || 0).toLocaleString('en-IN')}`} color="default" />
          </div>

          <div className="grid-2" style={{ marginBottom: 20 }}>
            {/* Daily sales line chart */}
            <Card>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Daily sales (₹)</div>
              {(sales?.dailySales || []).length === 0
                ? <Empty icon="📉" title="No sales in this period" />
                : <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={sales.dailySales.map(d => ({ ...d, dateLabel: fmtDate(d.date) }))} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="dateLabel" tick={{ fill: '#8b90a7', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#8b90a7', fontSize: 11 }} />
                      <Tooltip {...toCustom} formatter={v => [`₹${v}`, 'Sales']} />
                      <Line type="monotone" dataKey="total" stroke="#4f8ef7" strokeWidth={2} dot={{ fill: '#4f8ef7', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
              }
            </Card>

            {/* Top products bar chart */}
            <Card>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Top products by revenue</div>
              {(sales?.topProducts || []).length === 0
                ? <Empty icon="📦" title="No product sales yet" />
                : <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sales.topProducts.slice(0, 6).map(p => ({ ...p, shortName: p.name.length > 10 ? p.name.slice(0, 10) + '…' : p.name }))} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="shortName" tick={{ fill: '#8b90a7', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#8b90a7', fontSize: 11 }} />
                      <Tooltip {...toCustom} formatter={v => [`₹${v}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#34d399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
              }
            </Card>
          </div>

          {/* Top products table */}
          <Card>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Product breakdown</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>{['#', 'Product', 'Units sold', 'Revenue'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: 'var(--text2)', borderBottom: '1px solid var(--border)', fontWeight: 500 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {(sales?.topProducts || []).length === 0
                  ? <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text2)', padding: 24 }}>No sales data</td></tr>
                  : sales.topProducts.map((p, i) => (
                      <tr key={i}>
                        <td style={{ padding: '10px 12px', color: 'var(--text2)', fontFamily: 'var(--mono)' }}>{i + 1}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>{p.name}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)' }}>{p.qty}</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', color: 'var(--green)' }}>₹{p.revenue.toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
