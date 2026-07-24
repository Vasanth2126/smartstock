import React, { useEffect, useState } from 'react';
import { Spinner, Empty, Badge } from '../components/ui/UI';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Alerts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/reports/dashboard').then(({ data }) => { setData(data); setLoading(false); });
  }, []);

  if (loading) return <div className="page"><Spinner /></div>;

  const { outOfStockItems, lowStockItems } = data.stock;
  const allClear = outOfStockItems.length === 0 && lowStockItems.length === 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Stock Alerts</div>
          <div className="page-sub">{outOfStockItems.length + lowStockItems.length} items need attention</div>
        </div>
        <button className="quick-bill-btn" style={{ background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)' }} onClick={() => navigate('/products')}>
          Manage Products →
        </button>
      </div>

      {allClear
        ? <Empty icon="✅" title="All products are well stocked" sub="No alerts right now" />
        : <>
            {outOfStockItems.length > 0 && (
              <section style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: 12 }}>🚫 Out of stock ({outOfStockItems.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {outOfStockItems.map(p => (
                    <div key={p._id} className="alert-item alert-red" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Badge color="red">Out of stock</Badge>
                        <button onClick={() => navigate('/products')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer' }}>Reorder →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {lowStockItems.length > 0 && (
              <section>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)', marginBottom: 12 }}>⚠️ Low stock ({lowStockItems.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lowStockItems.map(p => (
                    <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--amber-bg)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{p.name}</span>
                        <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--text2)' }}>{p.stock} remaining (threshold: {p.threshold})</span>
                      </div>
                      <Badge color="amber">Low stock</Badge>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
      }
    </div>
  );
}
