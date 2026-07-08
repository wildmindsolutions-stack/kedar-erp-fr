import axios from 'axios';
import { clearSessionExpiry } from './session';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120_000,
});

/** Ping Render/Neon to reduce cold-start wait before real requests. */
export function warmupApi() {
  if (typeof window === 'undefined') return;
  const base = API_URL.replace(/\/api\/?$/, '');
  fetch(`${base}/api/health`, { method: 'GET', cache: 'no-store' }).catch(() => {});
}

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      clearSessionExpiry();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
