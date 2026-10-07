import React from 'react';
import './UI.css';

// Button
export function Btn({ children, variant = 'default', size = 'md', loading, className = '', ...props }) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="spinner-sm" /> : children}
    </button>
  );
}

// Card
export function Card({ children, className = '', ...props }) {
  return <div className={`glass-card card ${className}`} {...props}>{children}</div>;
}

// Badge / pill
export function Badge({ children, color = 'default' }) {
  const colorClassMap = {
    green: 'badge-emerald',
    emerald: 'badge-emerald',
    amber: 'badge-amber',
    red: 'badge-rose',
    rose: 'badge-rose',
    blue: 'badge-indigo',
    indigo: 'badge-indigo',
    purple: 'badge-indigo',
    default: 'badge-indigo',
  };
  return <span className={`badge ${colorClassMap[color] || 'badge-indigo'}`}>{children}</span>;
}

// Stock status badge
export function StockBadge({ status }) {
  const map = {
    in_stock:     { color: 'emerald', label: 'In Stock' },
    low_stock:    { color: 'amber',   label: 'Low Stock' },
    out_of_stock: { color: 'rose',    label: 'Out of Stock' },
  };
  const { color, label } = map[status] || map.in_stock;
  return <Badge color={color}>{label}</Badge>;
}

// Input
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <input className={`form-input ${error ? 'input-error' : ''}`} {...props} />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

// Select
export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={`form-group ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <select className={`form-input ${error ? 'input-error' : ''}`} {...props}>
        {children}
      </select>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

// Stat card
export function StatCard({ label, value, sub, color = 'indigo', icon: Icon }) {
  return (
    <div className={`stat-card glass-card stat-${color}`}>
      <div className="stat-header">
        <div className="stat-label">{label}</div>
        {Icon && <div className="stat-icon-wrapper">{typeof Icon === 'string' ? Icon : <Icon size={20} />}</div>}
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

// Spinner
export function Spinner() {
  return (
    <div className="spinner-wrapper">
      <div className="spinner" />
    </div>
  );
}

// Empty state
export function Empty({ icon = '📭', title = 'Nothing here yet', sub = '' }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
    </div>
  );
}

// Modal
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal glass-card" style={{ maxWidth: width }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// Table
export function Table({ columns, data, emptyText = 'No data available' }) {
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {data.length === 0
            ? <tr><td colSpan={columns.length} className="tbl-empty">{emptyText}</td></tr>
            : data.map((row, i) => (
                <tr key={row._id || i}>
                  {columns.map(c => (
                    <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                  ))}
                </tr>
              ))
          }
        </tbody>
      </table>
    </div>
  );
}
