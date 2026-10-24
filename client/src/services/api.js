import axios from 'axios';

export const getApiBaseUrl = () => {
  const custom = localStorage.getItem('dutube_api_url') || import.meta.env.VITE_API_URL;
  if (custom) return custom.endsWith('/api') ? custom : `${custom}/api`;
  if (typeof window !== 'undefined') {
    // 1. If running inside Native Capacitor Android/iOS app
    if (window.Capacitor?.isNativePlatform() || window.AndroidBridge !== undefined) {
      if (import.meta.env.VITE_API_URL) return `${import.meta.env.VITE_API_URL}/api`;
      return 'http://192.168.1.4:5000/api';
    }
    // 2. If in browser on port 5000
    if (window.location.port === '5000') {
      return '/api';
    }
    // 3. If in browser on localhost (e.g. Vite 5173)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // 4. If in mobile browser over LAN
    if (window.location.hostname) {
      return `${window.location.protocol}//${window.location.hostname}:5000/api`;
    }
    return 'http://192.168.1.4:5000/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dutube_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentToken = localStorage.getItem('dutube_token');
      if (currentToken) {
        localStorage.removeItem('dutube_token');
        localStorage.removeItem('dutube_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
