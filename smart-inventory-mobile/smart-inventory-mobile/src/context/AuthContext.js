import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (err) {
        if (__DEV__) {
          console.log('[AUTH CHECK] Session verification failed:', err.response?.data?.message || err.message);
        }
        await AsyncStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  const login = async (email, password) => {
    if (__DEV__) {
      console.log(`[AUTH] Login initiated for: ${email}`);
    }

    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
      });

      if (__DEV__) {
        console.log(`[AUTH] Login successful for: ${data.user?.email} (Role: ${data.user?.role})`);
      }

      await AsyncStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (err) {
      if (__DEV__) {
        console.log('[AUTH] Login failed:', err.response?.data?.message || err.message);
      }
      throw err;
    }
  };

  const register = async (form) => {
    const { data } = await api.post('/auth/register', form);
    await AsyncStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
