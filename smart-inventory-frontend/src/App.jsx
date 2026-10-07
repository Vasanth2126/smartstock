import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import { Spinner } from './components/ui/UI';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import StaffManagement from './pages/StaffManagement';
import SuperAdmin from './pages/SuperAdmin';
import Analytics from './pages/Analytics';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e2438', color: '#f8fafc', border: '1px solid #334155', fontSize: 13 },
            success: { iconTheme: { primary: '#34d399', secondary: '#1e2438' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#1e2438' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/pos" element={<PrivateRoute><POS /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
          <Route path="/forecast" element={<PrivateRoute roles={['owner', 'superadmin']}><Analytics /></PrivateRoute>} />
          <Route path="/alerts" element={<PrivateRoute><Alerts /></PrivateRoute>} />

          <Route path="/suppliers" element={<PrivateRoute roles={['owner', 'superadmin']}><Suppliers /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute roles={['owner', 'superadmin']}><Reports /></PrivateRoute>} />
          <Route path="/audit-logs" element={<PrivateRoute roles={['owner', 'superadmin']}><AuditLogs /></PrivateRoute>} />
          <Route path="/staff" element={<PrivateRoute roles={['owner', 'superadmin']}><StaffManagement /></PrivateRoute>} />
          <Route path="/superadmin" element={<PrivateRoute roles={['superadmin']}><SuperAdmin /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}