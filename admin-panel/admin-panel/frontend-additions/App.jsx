// REPLACE smart-inventory-frontend/src/App.jsx with this

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import { Spinner } from './components/ui/UI';

import Login          from './pages/Login';
import Register       from './pages/Register';
import Dashboard      from './pages/Dashboard';
import POS            from './pages/POS';
import Products       from './pages/Products';
import Suppliers      from './pages/Suppliers';
import Alerts         from './pages/Alerts';
import Reports        from './pages/Reports';
import StaffManagement from './pages/StaffManagement';
import SuperAdmin     from './pages/SuperAdmin';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <Spinner />
    </div>
  );
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
            style: { background:'#1f2435', color:'#e8eaf0', border:'1px solid #2a2f42', fontSize:13 },
            success: { iconTheme: { primary:'#34d399', secondary:'#1f2435' } },
            error:   { iconTheme: { primary:'#f87171', secondary:'#1f2435' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* All roles */}
          <Route path="/"         element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/pos"      element={<PrivateRoute><POS /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
          <Route path="/alerts"   element={<PrivateRoute><Alerts /></PrivateRoute>} />

          {/* Owner + superadmin only */}
          <Route path="/suppliers" element={<PrivateRoute roles={['owner','superadmin']}><Suppliers /></PrivateRoute>} />
          <Route path="/reports"   element={<PrivateRoute roles={['owner','superadmin']}><Reports /></PrivateRoute>} />
          <Route path="/staff"     element={<PrivateRoute roles={['owner','superadmin']}><StaffManagement /></PrivateRoute>} />

          {/* Superadmin only */}
          <Route path="/superadmin" element={<PrivateRoute roles={['superadmin']}><SuperAdmin /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
