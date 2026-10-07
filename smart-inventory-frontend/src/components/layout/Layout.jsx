import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Truck,
  Bell,
  BarChart3,
  Sparkles,
  Users,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import './Layout.css';

const NAV_ALL = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['owner', 'staff', 'superadmin'] },
  { to: '/pos', icon: Receipt, label: 'POS Terminal', roles: ['owner', 'staff', 'superadmin'] },
  { to: '/products', icon: Package, label: 'Products & Stock', roles: ['owner', 'staff', 'superadmin'] },
  { to: '/customers', icon: UserCheck, label: 'Customers (CRM)', roles: ['owner', 'staff', 'superadmin'] },
  { to: '/forecast', icon: Sparkles, label: 'Analytics & P&L', roles: ['owner', 'superadmin'] },
  { to: '/suppliers', icon: Truck, label: 'Suppliers', roles: ['owner', 'superadmin'] },
  { to: '/alerts', icon: Bell, label: 'Alerts', roles: ['owner', 'staff', 'superadmin'] },
  { to: '/reports', icon: BarChart3, label: 'Sales Reports', roles: ['owner', 'superadmin'] },
  { to: '/audit-logs', icon: ShieldAlert, label: 'Audit Trail', roles: ['owner', 'superadmin'] },
  { to: '/staff', icon: Users, label: 'Staff Management', roles: ['owner', 'superadmin'] },
  { to: '/superadmin', icon: ShieldCheck, label: 'Super Admin', roles: ['superadmin'] },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const nav = NAV_ALL.filter((n) => n.roles.includes(user?.role));
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`layout${collapsed ? ' collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-badge">⚡</div>
            {!collapsed && (
              <div className="logo-text-wrapper">
                <span className="logo-text">SmartStock</span>
                <span className="logo-subtext">ENTERPRISE PRO</span>
              </div>
            )}
          </div>
          <button
            className="collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {!collapsed && user && (
          <div className="shop-info glass-card-sm">
            <div className="shop-avatar">
              <Store size={18} />
            </div>
            <div className="shop-meta">
              <div className="shop-name">{user.shopName || user.name}</div>
              <div className="shop-role-badge">
                <span className={`role-dot role-${user.role}`} />
                <span className="role-name">{user.role?.toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? label : ''}
            >
              <Icon size={18} className="nav-icon" />
              {!collapsed && <span className="nav-label">{label}</span>}
              {to === '/forecast' && !collapsed && (
                <span className="ai-badge font-mono">P&L</span>
              )}
            </NavLink>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </aside>

      <main className="main-content">
        <div className="main-wrapper animate-fade-in">{children}</div>
      </main>
    </div>
  );
}