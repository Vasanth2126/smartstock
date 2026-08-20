import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const checkLogin = async () => {
    console.log("========== AUTH START ==========");

    try {
      const token = await AsyncStorage.getItem("token");
      console.log("Token:", token);

      if (!token) {
        console.log("No token found");
        setLoading(false);
        return;
      }

      console.log("Calling /auth/me...");

      const res = await api.get("/auth/me");

      console.log("Response received");
      console.log(res.data);

      setUser(res.data.user);
    } catch (err) {
      console.log("AUTH ERROR");
      console.log(err.message);

      if (err.response) {
        console.log(err.response.status);
        console.log(err.response.data);
      }

      await AsyncStorage.removeItem("token");
    }

    console.log("Loading false");
    setLoading(false);
  };

  checkLogin();
}, []);

  const login = async (email, password) => {
  console.log("1. Login started");

  try {
    console.log("2. Sending request");

    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    console.log("3. Response received");
    console.log(data);

    await AsyncStorage.setItem("token", data.token);

    console.log("4. Token stored");

    setUser(data.user);

    console.log("5. User updated");
  } catch (err) {
    console.log("LOGIN ERROR");
    console.log(err);
    console.log(err.response?.data);
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
