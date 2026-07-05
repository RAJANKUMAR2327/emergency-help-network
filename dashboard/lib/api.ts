import axios from 'axios';

// Falls back to your Cloudflare Worker proxy if NEXT_PUBLIC_API_URL isn't set.
// Set NEXT_PUBLIC_API_URL in Vercel → Project Settings → Environment Variables
// so this works correctly in Preview vs Production without code changes.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://ehn-api-proxy.rajankumar20030306.workers.dev/api';

const api = axios.create({ baseURL: API_URL, headers: { 'ngrok-skip-browser-warning': 'true' } });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

// Log the user out on the client if the backend rejects the token,
// same behavior as the mobile app's interceptor.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

interface LoginPayload {
  phone: string;
  password: string;
}

interface EmergencyQueryParams {
  status?: string;
  type?: string;
  [key: string]: string | number | boolean | undefined;
}

export const authAPI = {
  login: (data: LoginPayload) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const emergencyAPI = {
  getActive: (params?: EmergencyQueryParams) => api.get('/emergency/active', { params }),
  getOne: (id: string) => api.get('/emergency/' + id),
  resolve: (id: string) => api.put('/emergency/' + id + '/resolve'),
  cancel: (id: string) => api.put('/emergency/' + id + '/cancel'),
  accept: (id: string) => api.post('/emergency/' + id + '/accept'),
};

export default api;
