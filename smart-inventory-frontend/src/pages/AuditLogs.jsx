import React, { useEffect, useState } from 'react';
import { Card, StatCard, Badge, Spinner, Empty, Table, Btn } from '../components/ui/UI';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Sliders,
  FileText,
  Activity,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter !== 'ALL') params.action = actionFilter;
      if (entityFilter !== 'ALL') params.entityType = entityFilter;

      const { data } = await api.get('/audit-logs', { params });
      setLogs(data.logs || []);
    } catch (err) {
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      !search ||
      log.summary.toLowerCase().includes(q) ||
      (log.user?.name || '').toLowerCase().includes(q) ||
      (log.ipAddress || '').includes(search)
    );
  });

  const getActionBadgeColor = (action) => {
    if (action.includes('CREATE')) return 'emerald';
    if (action.includes('UPDATE') || action.includes('ADJUSTMENT')) return 'indigo';
    if (action.includes('DELETE') || action.includes('REFUND')) return 'rose';
    if (action.includes('LOGIN')) return 'amber';
    return 'default';
  };

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (log) => (
        <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>
          <div>{new Date(log.createdAt).toLocaleDateString()}</div>
          <div>{new Date(log.createdAt).toLocaleTimeString()}</div>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'Operator / Staff',
      render: (log) => (
        <div>
          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{log.user?.name || 'System Auto'}</div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>
            {log.user?.role?.toUpperCase()} &bull; {log.ipAddress || '127.0.0.1'}
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Event Type',
      render: (log) => (
        <Badge color={getActionBadgeColor(log.action)}>{log.action.replace('_', ' ')}</Badge>
      ),
    },
    {
      key: 'entity',
      label: 'Target Entity',
      render: (log) => <span className="font-mono font-semibold text-xs">{log.entityType}</span>,
    },
    {
      key: 'summary',
      label: 'Audit Summary & Change Payload',
      render: (log) => (
        <div>
          <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>{log.summary}</div>
          {log.details && Object.keys(log.details).length > 0 && (
            <div
              style={{
                fontSize: 10,
                color: '#94a3b8',
                fontFamily: 'monospace',
                marginTop: 2,
                maxWidth: 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {JSON.stringify(log.details)}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Enterprise System Audit Trail & Compliance</div>
          <div className="page-sub">
            Immutable chronological record of inventory adjustments, cashier transactions, price revisions, and staff sessions
          </div>
        </div>
        <Btn variant="default" onClick={fetchLogs}>
          <RefreshCw size={14} /> Refresh Audit Trail
        </Btn>
      </div>

      {/* KPI Stats */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <StatCard
          icon={Activity}
          label="Total Audited Events"
          value={logs.length}
          color="indigo"
          sub="Recent security and inventory mutations"
        />
        <StatCard
          icon={ShieldAlert}
          label="Compliance Status"
          value="100% Active"
          color="emerald"
          sub="All critical mutation handlers monitored"
        />
        <StatCard
          icon={Clock}
          label="Ledger Retention"
          value="365 Days"
          color="purple"
          sub="Encrypted tamper-resistant logging"
        />
      </div>

      {/* Filters Bar */}
      <div className="products-filters">
        <input
          className="prod-search"
          placeholder="Filter audit logs by keyword, staff name, or IP address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-tabs">
          {[
            ['ALL', 'All Events'],
            ['PRODUCT_CREATE', 'Product Add'],
            ['STOCK_ADJUSTMENT', 'Stock Adjust'],
            ['BILL_CREATE', 'POS Invoices'],
            ['BILL_REFUND', 'Refunds'],
            ['USER_LOGIN', 'Logins'],
          ].map(([v, l]) => (
            <button
              key={v}
              className={`filter-tab ${actionFilter === v ? 'active' : ''}`}
              onClick={() => setActionFilter(v)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : (
        <Table columns={columns} data={filteredLogs} emptyText="No audit entries match filter criteria" />
      )}
    </div>
  );
}
