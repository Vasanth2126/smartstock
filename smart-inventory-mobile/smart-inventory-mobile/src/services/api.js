import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend IP when testing on a real phone
// Use your PC's local IP e.g. http://192.168.1.100:5000/api
// For Android emulator use: http://10.0.2.2:5000/api
const BASE_URL = 'http://10.0.2.2:5000/api';

const api = axios.create({ baseURL: BASE_URL });

// Attach token on every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
