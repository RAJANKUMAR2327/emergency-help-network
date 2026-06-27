import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// HTTP API goes through Cloudflare Worker proxy
export const API_URL = 'https://ehn-api-proxy.rajankumar20030306.workers.dev/api';

// Socket.io connects DIRECTLY to Railway backend (Workers don't support WebSocket upgrades)
export const SOCKET_URL = 'https://your-railway-backend.up.railway.app';

const client = axios.create({ baseURL: API_URL, timeout: 10000 });

// Attach JWT to every request
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

// Handle expired token globally — log out on 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // AuthContext listens to AsyncStorage via loadStoredAuth on mount;
      // for immediate UI update, the logout function from AuthContext is called
      // via the onUnauthorized callback set in App.js
      if (client._onUnauthorized) client._onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  getMe: () => client.get('/auth/me'),
  updateLocation: (data) => client.put('/auth/location', data),
  updateFCMToken: (data) => client.put('/auth/fcm-token', data),
  updateProfile: (data) => client.put('/auth/profile', data),
};

export const emergencyAPI = {
  trigger: (data) => client.post('/emergency/trigger', data),
  getActive: (params) => client.get('/emergency/active', { params }),
  getOne: (id) => client.get('/emergency/' + id),
  accept: (id) => client.post('/emergency/' + id + '/accept'),
  resolve: (id) => client.put('/emergency/' + id + '/resolve'),
  cancel: (id) => client.put('/emergency/' + id + '/cancel'),
  updateLocation: (id, data) => client.put('/emergency/' + id + '/location', data),
};

export const notificationAPI = {
  getContacts: () => client.get('/notifications/contacts'),
  addContact: (data) => client.post('/notifications/contacts', data),
  deleteContact: (id) => client.delete('/notifications/contacts/' + id),
  sendTest: (data) => client.post('/notifications/test', data),
};

export default client;
