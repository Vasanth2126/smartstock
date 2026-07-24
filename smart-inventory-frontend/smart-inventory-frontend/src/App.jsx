import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import { Spinner } from './components/ui/UI';

import Login    from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import POS      from './pages/POS';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Alerts   from './pages/Alerts';
import Reports  from './pages/Reports';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><Spinner /></div>;
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
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
            style: { background: '#1f2435', color: '#e8eaf0', border: '1px solid #2a2f42', fontSize: 13 },
            success: { iconTheme: { primary: '#34d399', secondary: '#1f2435' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#1f2435' } },
          }}
        />
        <Routes>
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/"         element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/pos"      element={<PrivateRoute><POS /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
          <Route path="/suppliers"element={<PrivateRoute><Suppliers /></PrivateRoute>} />
          <Route path="/alerts"   element={<PrivateRoute><Alerts /></PrivateRoute>} />
          <Route path="/reports"  element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
