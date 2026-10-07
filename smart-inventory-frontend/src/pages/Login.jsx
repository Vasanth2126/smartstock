import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Btn, Input } from '../components/ui/UI';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password = 'password123') => {
    setForm({ email, password });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⚡ SmartStock</div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to manage your shop</p>
        <form onSubmit={submit} className="auth-form">
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@shop.com" required />
          <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••" required />
          <Btn type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%', marginTop: 8 }}>
            Sign in
          </Btn>
        </form>
        <p className="auth-footer">
          No account? <Link to="/register" className="auth-link">Register your shop</Link>
        </p>
        <div className="auth-demo">
          <span style={{ width: '100%', marginBottom: 4, fontWeight: 600 }}>Quick Demo Logins:</span>
          <button
            type="button"
            className="demo-pill"
            onClick={() => fillDemo('owner@retailhub.com')}
          >
            🏪 Owner (Alex)
          </button>
          <button
            type="button"
            className="demo-pill"
            onClick={() => fillDemo('cashier@retailhub.com')}
          >
            💳 Cashier (Sarah)
          </button>
          <button
            type="button"
            className="demo-pill"
            onClick={() => fillDemo('admin@smartstock.com')}
          >
            🛡️ Superadmin
          </button>
          <button
            type="button"
            className="demo-pill"
            onClick={() => fillDemo('ramesh@shop.com')}
          >
            🛒 Ramesh Store
          </button>
        </div>
      </div>
    </div>
  );
}
