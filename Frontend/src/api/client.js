// Frontend/src/api/client.js
import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const api = axios.create({
  baseURL: isLocal ? 'http://localhost:5000/api' : '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to suppress 401 errors on /profile (expected when no session)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Suppress 401 error log on /profile (expected when no session)
    if (error.config?.url === '/profile' && error.response?.status === 401) {
      // Silently reject without logging
      return Promise.reject(error);
    }
    // For other errors, let them show normally
    return Promise.reject(error);
  }
);

export default api;