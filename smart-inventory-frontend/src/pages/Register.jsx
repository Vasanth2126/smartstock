import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Btn, Input } from '../components/ui/UI';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', shopName: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⚡ SmartStock</div>
        <h1 className="auth-title">Create your shop</h1>
        <p className="auth-sub">Set up your inventory in minutes</p>
        <form onSubmit={submit} className="auth-form">
          <Input label="Your name" type="text" value={form.name} onChange={set('name')} placeholder="Ramesh Kumar" required />
          <Input label="Shop name" type="text" value={form.shopName} onChange={set('shopName')} placeholder="Ramesh General Store" />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@shop.com" required />
          <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required minLength={6} />
          <Btn type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%', marginTop: 8 }}>
            Create account
          </Btn>
        </form>
        <p className="auth-footer">
          Already registered? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
