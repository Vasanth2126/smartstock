import React, { useEffect, useState } from 'react';
import { Card, StatCard, Badge, Spinner, Empty, Table, Btn } from '../components/ui/UI';
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Search,
  DollarSign,
  PieChart as PieChartIcon,
  Percent,
  Layers,
  ArrowUpRight,
  Boxes,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function Analytics() {
  const [forecastData, setForecastData] = useState(null);
  const [pnlData, setPnlData] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pnl'); // 'pnl' | 'abc' | 'forecast'
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [fRes, pRes, sRes] = await Promise.all([
        api.get('/reports/forecast'),
        api.get('/reports/profit-loss'),
        api.get('/reports/sales'),
      ]);
      setForecastData(fRes.data);
      setPnlData(pRes.data.pnl);
      setSalesReport(sRes.data);
    } catch (err) {
      toast.error('Failed to load analytics engine');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <Spinner />;

  const { forecasts = [], highRiskCount = 0, totalProductsAnalyzed = 0 } = forecastData || {};

  const filteredForecasts = forecasts.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (filter === 'risk') return item.riskLevel !== 'normal';
    if (filter === 'normal') return item.riskLevel === 'normal';
    if (filter === 'abc_a') return item.abcCategory === 'A';
    if (filter === 'abc_b') return item.abcCategory === 'B';
    if (filter === 'abc_c') return item.abcCategory === 'C';
    return true;
  });

  // Prepare Daily Sales vs Profit Chart Data
  const chartData = (salesReport?.dailySales || []).map((d) => ({
    date: d.date.slice(5), // MM-DD
    Revenue: d.revenue,
    Profit: d.profit,
  }));

  // Prepare Payment Mode Chart Data
  const paymentPieData = Object.entries(salesReport?.paymentBreakdown || {})
    .filter(([_, val]) => val > 0)
    .map(([key, value]) => ({
      name: key.toUpperCase(),
      value: Math.round(value),
    }));

  const forecastColumns = [
    {
      key: 'name',
      label: 'Product & Category',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{row.name}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            {row.category} &bull; <span className="font-mono">{row.sku || 'SKU'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'abc',
      label: 'ABC Pareto Class',
      render: (row) => (
        <span
          className="font-mono font-bold"
          style={{
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 11,
            background:
              row.abcCategory === 'A'
                ? 'rgba(99, 102, 241, 0.2)'
                : row.abcCategory === 'B'
                ? 'rgba(56, 189, 248, 0.2)'
                : 'rgba(148, 163, 184, 0.2)',
            color:
              row.abcCategory === 'A' ? '#818cf8' : row.abcCategory === 'B' ? '#38bdf8' : '#94a3b8',
          }}
        >
          Class {row.abcCategory} ({row.revenueContribution}%)
        </span>
      ),
    },
    {
      key: 'stock',
      label: 'Current Stock',
      render: (row) => (
        <span
          className="font-mono font-bold"
          style={{ color: row.stock === 0 ? '#f87171' : '#f8fafc' }}
        >
          {row.stock} units
        </span>
      ),
    },
    {
      key: 'dailyVelocity',
      label: '30-Day Avg Sales',
      render: (row) => (
        <span className="font-mono" style={{ color: '#38bdf8' }}>
          {row.dailyVelocity} / day
        </span>
      ),
    },
    {
      key: 'predictedDaysLeft',
      label: 'Predicted Run-out',
      render: (row) => {
        if (row.stock === 0) return <Badge color="rose">Depleted</Badge>;
        if (row.daysUntilStockout >= 90) return <span className="font-mono text-muted">90+ days</span>;
        return (
          <span
            className="font-mono font-bold"
            style={{ color: row.daysUntilStockout <= 7 ? '#fbbf24' : '#34d399' }}
          >
            ~{row.daysUntilStockout} days
          </span>
        );
      },
    },
    {
      key: 'riskLevel',
      label: 'Stock Health',
      render: (row) => (
        <Badge
          color={
            row.riskLevel === 'critical'
              ? 'rose'
              : row.riskLevel === 'warning'
              ? 'amber'
              : 'emerald'
          }
        >
          {row.riskLevel === 'critical'
            ? 'Stockout'
            : row.riskLevel === 'warning'
            ? 'Reorder Warning'
            : 'Optimal'}
        </Badge>
      ),
    },
    {
      key: 'recommendedReorder',
      label: 'AI Restock Advice',
      render: (row) => (
        <span className="font-mono font-bold" style={{ color: '#c084fc' }}>
          +{row.recommendedReorder} units
        </span>
      ),
    },
  ];

  return (
    <div className="analytics-page animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={24} className="text-purple" />
            Executive Business Analytics & Demand Intelligence
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
            Real-time P&L Statement, COGS Breakdown, ABC Inventory Matrix, and Machine-Assisted Stockout Velocity
          </p>
        </div>
        <Btn variant="default" onClick={fetchAnalytics}>
          <RefreshCw size={14} /> Refresh Analytics
        </Btn>
      </div>

      {/* High-Level P&L Financial Cards */}
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard
          icon={DollarSign}
          label="Net Sales Revenue"
          value={`₹${(pnlData?.netSales || 0).toLocaleString('en-IN')}`}
          color="indigo"
          sub={`${pnlData?.totalInvoices || 0} customer invoices`}
        />
        <StatCard
          icon={Boxes}
          label="Cost of Goods (COGS)"
          value={`₹${(pnlData?.cogs || 0).toLocaleString('en-IN')}`}
          color="amber"
          sub="Direct acquisition cost"
        />
        <StatCard
          icon={TrendingUp}
          label="Gross Profit"
          value={`₹${(pnlData?.grossProfit || 0).toLocaleString('en-IN')}`}
          color="emerald"
          sub="Net earnings before tax"
        />
        <StatCard
          icon={Percent}
          label="Gross Profit Margin"
          value={`${pnlData?.grossMarginPercent || 0}%`}
          color="purple"
          sub="Overall business margin"
        />
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>
        <button
          className={`filter-tab ${activeTab === 'pnl' ? 'active' : ''}`}
          onClick={() => setActiveTab('pnl')}
        >
          <TrendingUp size={14} /> Revenue vs Profit Trends
        </button>
        <button
          className={`filter-tab ${activeTab === 'abc' ? 'active' : ''}`}
          onClick={() => setActiveTab('abc')}
        >
          <Layers size={14} /> ABC Pareto Inventory Matrix
        </button>
        <button
          className={`filter-tab ${activeTab === 'forecast' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecast')}
        >
          <Sparkles size={14} /> AI Demand Velocity Forecast
        </button>
      </div>

      {/* TAB 1: P&L Trend Visualizations */}
      {activeTab === 'pnl' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
              Daily Revenue vs Profit Performance (₹)
            </h3>
            <div style={{ height: 300, width: '100%' }}>
              {chartData.length === 0 ? (
                <Empty icon="📈" title="No sales data" sub="Complete sales in POS to view charts" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
              Payment Channel Breakdown
            </h3>
            <div style={{ height: 300, width: '100%' }}>
              {paymentPieData.length === 0 ? (
                <Empty icon="💳" title="No payment data" sub="No payments recorded yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2 & 3: ABC Inventory Matrix & Demand Velocity */}
      {(activeTab === 'abc' || activeTab === 'forecast') && (
        <Card>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 18,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                className={filter === 'all' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                onClick={() => setFilter('all')}
              >
                All Products ({forecasts.length})
              </button>
              {activeTab === 'abc' ? (
                <>
                  <button
                    className={filter === 'abc_a' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                    onClick={() => setFilter('abc_a')}
                  >
                    🏆 Class A (Top 70% Revenue)
                  </button>
                  <button
                    className={filter === 'abc_b' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                    onClick={() => setFilter('abc_b')}
                  >
                    🥈 Class B (Next 20%)
                  </button>
                  <button
                    className={filter === 'abc_c' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                    onClick={() => setFilter('abc_c')}
                  >
                    📦 Class C (Slow/Tail)
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={filter === 'risk' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                    onClick={() => setFilter('risk')}
                  >
                    ⚠️ Stock Run-out Alerts ({highRiskCount})
                  </button>
                  <button
                    className={filter === 'normal' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                    onClick={() => setFilter('normal')}
                  >
                    ✅ Optimal Stock
                  </button>
                </>
              )}
            </div>

            <div style={{ position: 'relative', width: 260 }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }}
              />
              <input
                className="form-input"
                placeholder="Search by name or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36, width: '100%' }}
              />
            </div>
          </div>

          <Table
            columns={forecastColumns}
            data={filteredForecasts}
            emptyText="No inventory forecast items match your filter"
          />
        </Card>
      )}
    </div>
  );
}
