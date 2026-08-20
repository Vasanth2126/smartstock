import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For Android Emulator use: http://10.0.2.2:5000/api
// For Real Phone use your PC IP: http://192.168.1.XXX:5000/api
const BASE_URL = 'http://10.0.2.2:5000/api';

const api = axios.create({ baseURL: BASE_URL });

// Attach token on every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;