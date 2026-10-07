import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StatCard, Card, Badge, Spinner, Empty, Btn } from '../components/ui/UI';
import {
  IndianRupee,
  Receipt,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  Sparkles,
  PlusCircle,
  ArrowRight,
  PackageCheck,
  DollarSign,
  Boxes,
  ShieldAlert,
  Users,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import api from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [bills, setBills] = useState([]);
  const [salesReport, setSalesReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/bills/today'),
      api.get('/reports/sales'),
    ])
      .then(([r1, r2, r3]) => {
        setData(r1.data);
        setBills(r2.data.bills || []);
        setSalesReport(r3.data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const { today, stock, topProducts } = data || { today: {}, stock: {}, topProducts: [] };

  const chartData = (topProducts || []).map((p) => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name,
    qty: p.qty,
  }));

  const trendData = salesReport?.dailySales || [
    { date: 'Today', total: today?.totalSales || 0 },
  ];

  return (
    <div className="dashboard-page animate-fade-in">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">
            Welcome back, {user?.name?.split(' ')[0]} <span className="wave">👋</span>
          </h1>
          <p className="dash-subtitle">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            &bull; Enterprise Store & Warehouse Control Panel
          </p>
        </div>
        <div className="dash-actions" style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => navigate('/customers')}>
            <Users size={16} />
            <span>CRM Khata</span>
          </button>
          <button className="btn-primary" onClick={() => navigate('/pos')}>
            <PlusCircle size={18} />
            <span>Launch POS Terminal</span>
          </button>
        </div>
      </div>

      {/* AI Demand Intelligence Banner */}
      <div className="ai-banner glass-card" onClick={() => navigate('/forecast')}>
        <div className="ai-banner-content">
          <div className="ai-icon-chip">
            <Sparkles size={22} className="text-purple" />
          </div>
          <div>
            <div className="ai-banner-title">SmartStock Profit & Loss & AI Demand Forecasting</div>
            <div className="ai-banner-desc">
              P&L Gross Margins, ABC Pareto matrix classification, 30-day velocity, and stockout run-out simulations.
            </div>
          </div>
        </div>
        <button className="btn-secondary btn-sm">
          <span>Explore Analytics</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Key Metric Stat Cards */}
      <div className="grid-4 stats-grid">
        <StatCard
          icon={IndianRupee}
          label="Today's Revenue"
          value={`₹${(today?.totalSales || 0).toLocaleString('en-IN')}`}
          color="emerald"
          sub={`${today?.billCount || 0} invoices &bull; Avg ₹${today?.avgBillValue || 0}`}
        />
        <StatCard
          icon={TrendingUp}
          label="Today's Gross Profit"
          value={`₹${(today?.totalProfit || 0).toLocaleString('en-IN')}`}
          color="indigo"
          sub="Net margin on today's items"
        />
        <StatCard
          icon={Boxes}
          label="Inventory Valuation"
          value={`₹${(stock?.inventoryRetailValue || 0).toLocaleString('en-IN')}`}
          color="purple"
          sub={`Cost: ₹${(stock?.inventoryCostValue || 0).toLocaleString('en-IN')}`}
        />
        <StatCard
          icon={AlertTriangle}
          label="Stock Alert Count"
          value={(stock?.lowStockCount || 0) + (stock?.outOfStockCount || 0)}
          color="amber"
          sub={`${stock?.outOfStockCount || 0} depleted &bull; ${stock?.nearExpiryCount || 0} near expiry`}
        />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid grid-2">
        {/* Sales Revenue Trend Chart */}
        <Card className="chart-card">
          <div className="card-head">
            <div>
              <div className="card-title">Revenue Trend (Recent Days)</div>
              <div className="card-sub">Daily total billing aggregation</div>
            </div>
            <TrendingUp size={20} className="text-muted" />
          </div>
          {trendData.length === 0 ? (
            <Empty icon="📊" title="No billing data" sub="Create bills in POS to see revenue analytics" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#fff',
                  }}
                  formatter={(val) => [`₹${val}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Top Sold Products */}
        <Card className="chart-card">
          <div className="card-head">
            <div>
              <div className="card-title">Top Selling Products Today</div>
              <div className="card-sub">Units sold per product</div>
            </div>
            <PackageCheck size={20} className="text-muted" />
          </div>
          {chartData.length === 0 ? (
            <Empty icon="🛍️" title="No sales recorded today" sub="Sales breakdown will appear here" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: '#fff',
                  }}
                />
                <Bar dataKey="qty" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#10b981' : i === 1 ? '#6366f1' : '#374151'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Recent Bills & Stock Alerts */}
      <div className="grid-2 lower-grid">
        {/* Recent Bills */}
        <Card>
          <div className="card-head">
            <span className="card-title">Today's Transactions</span>
            <button className="btn-ghost btn-sm" onClick={() => navigate('/pos')}>
              View POS →
            </button>
          </div>
          {bills.length === 0 ? (
            <Empty icon="🧾" title="No bills created today" sub="Go to POS Terminal to generate sales" />
          ) : (
            <div className="bills-list">
              {bills.slice(0, 5).map((b) => (
                <div className="bill-row" key={b._id}>
                  <div className="bill-info">
                    <span className="bill-num font-mono">{b.billNumber}</span>
                    <span className="bill-items-summary">
                      {b.items.map((i) => `${i.productName} (×${i.quantity})`).join(', ')}
                    </span>
                  </div>
                  <div className="bill-total font-mono">₹{b.totalAmount}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Stock Alerts Quick List */}
        <Card>
          <div className="card-head">
            <span className="card-title">Stock & Expiry Alerts</span>
            <button className="btn-ghost btn-sm" onClick={() => navigate('/alerts')}>
              View All Alerts →
            </button>
          </div>
          {(!stock?.outOfStockItems || stock.outOfStockItems.length === 0) &&
          (!stock?.lowStockItems || stock.lowStockItems.length === 0) ? (
            <Empty icon="✅" title="All inventory optimal" sub="No low-stock or out-of-stock items" />
          ) : (
            <div className="alerts-list">
              {(stock?.outOfStockItems || []).map((p) => (
                <div className="alert-row alert-rose-border" key={p._id}>
                  <div>
                    <div className="alert-item-name">{p.name}</div>
                    <div className="alert-item-sub">Stock depleted</div>
                  </div>
                  <Badge color="rose">Out of Stock</Badge>
                </div>
              ))}
              {(stock?.lowStockItems || []).map((p) => (
                <div className="alert-row alert-amber-border" key={p._id}>
                  <div>
                    <div className="alert-item-name">{p.name}</div>
                    <div className="alert-item-sub">Only {p.stock} units remaining</div>
                  </div>
                  <Badge color="amber">Low Stock</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
