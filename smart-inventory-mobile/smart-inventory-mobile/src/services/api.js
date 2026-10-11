import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SmartStock Mobile API Configuration
 *
 * Local USB Development (via ADB reverse tcp:5000 tcp:5000):
 *   http://127.0.0.1:5000/api
 *
 * Production (Render / Cloud HTTPS):
 *   https://<your-render-domain>.onrender.com/api
 *   (Configured via EXPO_PUBLIC_API_URL or in-app Server Settings)
 */
export const USB_DEV_URL = 'http://127.0.0.1:5000/api';

// Environment-provided API URL (set via EXPO_PUBLIC_API_URL in .env or EAS Build)
export const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

// Default server URL: Uses environment variable if provided, otherwise USB dev endpoint
export const DEFAULT_SERVER_URL = ENV_API_URL || USB_DEV_URL;

export const STORAGE_KEY_CUSTOM_URL = 'custom_server_url';

/**
 * Normalizes any user-entered or configured URL:
 * - Trims whitespace
 * - Adds scheme (http:// for local loopback/IPs, https:// for remote domains)
 * - Strips all trailing slashes
 * - Strips duplicate /api segments (e.g., .../api/api -> .../api)
 * - Always appends a clean single /api suffix
 */
export const normalizeUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return DEFAULT_SERVER_URL;
  let clean = rawUrl.trim();
  if (!clean) return DEFAULT_SERVER_URL;

  // Add scheme if missing
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    const isLocal = clean.startsWith('127.0.0.1') || clean.startsWith('localhost') || clean.startsWith('10.');
    clean = isLocal ? `http://${clean}` : `https://${clean}`;
  }

  // Strip all trailing slashes
  clean = clean.replace(/\/+$/, '');

  // Strip duplicate trailing /api segments to prevent .../api/api
  clean = clean.replace(/(\/api)+$/i, '');

  // Ensure clean single /api suffix
  return `${clean}/api`;
};

// In-memory cache of the currently active base URL for immediate effect
let activeBaseUrl = DEFAULT_SERVER_URL;

/**
 * Retrieves the active server base URL from AsyncStorage or falls back to DEFAULT_SERVER_URL.
 * Does not overwrite user's saved URL.
 */
export const getStoredServerUrl = async () => {
  try {
    const custom = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM_URL);
    if (custom && custom.trim()) {
      activeBaseUrl = normalizeUrl(custom);
      return activeBaseUrl;
    }
  } catch {
    // Fall back to default on storage error
  }
  activeBaseUrl = DEFAULT_SERVER_URL;
  return DEFAULT_SERVER_URL;
};

/**
 * Saves a custom server base URL to AsyncStorage and updates the Axios instance immediately.
 * If url is empty or equals DEFAULT_SERVER_URL, removes custom override.
 */
export const setCustomServerUrl = async (url) => {
  try {
    if (!url || !url.trim() || url.trim() === DEFAULT_SERVER_URL) {
      await AsyncStorage.removeItem(STORAGE_KEY_CUSTOM_URL);
      activeBaseUrl = DEFAULT_SERVER_URL;
      api.defaults.baseURL = DEFAULT_SERVER_URL;
      return DEFAULT_SERVER_URL;
    }
    const finalUrl = normalizeUrl(url);
    await AsyncStorage.setItem(STORAGE_KEY_CUSTOM_URL, finalUrl);
    activeBaseUrl = finalUrl;
    api.defaults.baseURL = finalUrl;
    return finalUrl;
  } catch (err) {
    console.warn('[API] Failed to save custom server URL:', err.message);
    return activeBaseUrl;
  }
};

/**
 * Resets the server URL back to the default USB dev endpoint.
 */
export const resetToDefaultServerUrl = async () => {
  return setCustomServerUrl('');
};

/**
 * Centralized API error message resolver for clean, user-friendly alerts.
 * Distinguishes Network, 400, 401, 403, 404, 429, and 500 errors.
 */
export const getApiErrorMessage = (error, defaultMsg = 'An unexpected error occurred.') => {
  if (!error) return defaultMsg;
  if (!error.response) {
    return 'Cannot connect to SmartStock server. Check the backend server connection.';
  }
  const status = error.response.status;
  const backendMsg = error.response.data?.message;

  if (status === 400) {
    return backendMsg || 'Invalid request. Please check your inputs.';
  }
  if (status === 401) {
    return backendMsg || 'Invalid email or password.';
  }
  if (status === 403) {
    return backendMsg || 'You do not have permission to perform this action.';
  }
  if (status === 404) {
    return backendMsg || 'Requested endpoint not found on server.';
  }
  if (status === 429) {
    return backendMsg || 'Too many attempts. Please wait a moment and try again.';
  }
  if (status >= 500) {
    return backendMsg || 'SmartStock server encountered an error.';
  }
  return backendMsg || error.message || defaultMsg;
};

// Initialize active URL from storage on module load
getStoredServerUrl().then(url => {
  activeBaseUrl = url;
  api.defaults.baseURL = url;
});

const api = axios.create({
  baseURL: DEFAULT_SERVER_URL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token and Normalize URL
api.interceptors.request.use(
  async (config) => {
    // Ensure active baseURL is applied
    const activeUrl = activeBaseUrl || (await getStoredServerUrl());
    config.baseURL = activeUrl;

    // Prevent double /api if config.url starts with /api
    if (config.url) {
      if (config.url === '/api') {
        config.url = '';
      } else if (config.url.startsWith('/api/')) {
        config.url = config.url.replace(/^\/api\//, '/');
      }
    }

    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (__DEV__) {
      const baseClean = (config.baseURL || '').replace(/\/+$/, '');
      const pathClean = (config.url || '').replace(/^\/+/, '');
      const fullUrl = pathClean ? `${baseClean}/${pathClean}` : baseClean;
      console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${fullUrl}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Development Logging (Safe - never logs token or password)
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API RESPONSE] ${response.status} ${response.config?.method?.toUpperCase()} ${response.config?.url}`);
    }
    return response;
  },
  (error) => {
    if (__DEV__) {
      if (!error.response) {
        console.log(`[API NETWORK ERROR] Cannot reach backend: ${error.config?.baseURL} (${error.message})`);
      } else {
        const errorMsg = error.response.data?.message || error.message;
        console.log(`[API ERROR] ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${errorMsg}`);
      }
    }
    return Promise.reject(error);
  }
);

export default api;