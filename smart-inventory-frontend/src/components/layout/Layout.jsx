import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const NAV_ALL = [
  { to: '/',           icon: '⬛', label: 'Dashboard',    roles: ['owner','staff','superadmin'] },
  { to: '/pos',        icon: '🧾', label: 'Billing (POS)', roles: ['owner','staff','superadmin'] },
  { to: '/products',   icon: '📦', label: 'Products',      roles: ['owner','staff','superadmin'] },
  { to: '/suppliers',  icon: '🚚', label: 'Suppliers',     roles: ['owner','superadmin'] },
  { to: '/alerts',     icon: '🔔', label: 'Alerts',        roles: ['owner','staff','superadmin'] },
  { to: '/reports',    icon: '📊', label: 'Reports',       roles: ['owner','superadmin'] },
  { to: '/staff',      icon: '👥', label: 'Staff',         roles: ['owner','superadmin'] },
  { to: '/superadmin', icon: '⚡', label: 'Admin Panel',   roles: ['superadmin'] },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const nav = NAV_ALL.filter(n => n.roles.includes(user?.role));
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`layout${collapsed ? ' collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            {!collapsed && <span className="logo-text">SmartStock</span>}
          </div>
          <button className="collapse-btn" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {!collapsed && user && (
          <div className="shop-info">
            <div className="shop-avatar">{user.shopName?.[0] || user.name?.[0]}</div>
            <div>
              <div className="shop-name">{user.shopName || user.name}</div>
              <div className="shop-role" style={{
                color: user.role === 'superadmin' ? 'var(--purple)' :
                       user.role === 'owner'      ? 'var(--accent)' : 'var(--text3)'
              }}>
                {user.role}
              </div>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {nav.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? label : ''}
            >
              <span className="nav-icon">{icon}</span>
              {!collapsed && <span className="nav-label">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <span>🚪</span>
          {!collapsed && <span>Sign out</span>}
        </button>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}