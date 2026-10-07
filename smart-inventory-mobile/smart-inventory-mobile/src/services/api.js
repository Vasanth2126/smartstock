import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * SmartStock Mobile API Configuration
 * 
 * Local USB Development (ADB reverse tcp:5000 tcp:5000):
 *   http://127.0.0.1:5000/api
 * 
 * Production (Render / Cloud HTTPS):
 *   https://<your-render-domain>.onrender.com/api
 */
export const USB_DEV_URL = 'http://127.0.0.1:5000/api';

// Use environment variable if provided, otherwise default to local USB ADB reverse endpoint
export const DEFAULT_SERVER_URL = process.env.EXPO_PUBLIC_API_URL || USB_DEV_URL;

/**
 * Normalizes any user-entered or configured URL:
 * - Trims whitespace
 * - Strips trailing slashes
 * - Adds scheme (http:// or https://) if missing
 * - Appends /api without duplicating (e.g. .../api/api -> .../api)
 */
export const normalizeUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return DEFAULT_SERVER_URL;
  let clean = rawUrl.trim().replace(/\/+$/, '');
  if (!clean) return DEFAULT_SERVER_URL;

  // Add scheme if missing
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `http://${clean}`;
  }

  // Ensure /api suffix without duplication
  if (!clean.endsWith('/api')) {
    clean = `${clean}/api`;
  }

  return clean;
};

/**
 * Retrieves the active server base URL from AsyncStorage or falls back to DEFAULT_SERVER_URL.
 * Does not overwrite user's saved URL.
 */
export const getStoredServerUrl = async () => {
  try {
    const custom = await AsyncStorage.getItem('custom_server_url');
    if (custom && custom.trim()) {
      return normalizeUrl(custom);
    }
  } catch {
    // Fall back to default on storage error
  }
  return DEFAULT_SERVER_URL;
};

/**
 * Saves a custom server base URL to AsyncStorage and updates the Axios instance immediately.
 */
export const setCustomServerUrl = async (url) => {
  try {
    if (!url || !url.trim()) {
      await AsyncStorage.removeItem('custom_server_url');
      api.defaults.baseURL = DEFAULT_SERVER_URL;
      return DEFAULT_SERVER_URL;
    }
    const finalUrl = normalizeUrl(url);
    await AsyncStorage.setItem('custom_server_url', finalUrl);
    api.defaults.baseURL = finalUrl;
    return finalUrl;
  } catch (err) {
    console.warn('[API] Failed to save custom server URL:', err.message);
    return DEFAULT_SERVER_URL;
  }
};

const api = axios.create({
  baseURL: DEFAULT_SERVER_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    const activeUrl = await getStoredServerUrl();
    config.baseURL = activeUrl;

    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (__DEV__) {
      const fullUrl = `${config.baseURL.replace(/\/+$/, '')}/${config.url.replace(/^\/+/, '')}`;
      console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${fullUrl}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API RESPONSE] ${response.status} ${response.config?.url}`);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      if (!error.response) {
        console.log(`[API NETWORK ERROR] Cannot reach backend: ${error.config?.baseURL} (${error.message})`);
      } else {
        console.log(`[API ERROR] ${error.response.status} ${error.config?.url}:`, error.response.data?.message || error.message);
      }
    }
    return Promise.reject(error);
  }
);

export default api;