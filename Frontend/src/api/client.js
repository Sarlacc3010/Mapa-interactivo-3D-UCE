// Frontend/src/api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para suprimir errores 401 en /profile (esperados cuando no hay sesión)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Suprimir log de error 401 en /profile (es esperado cuando no hay sesión)
    if (error.config?.url === '/profile' && error.response?.status === 401) {
      // Silenciosamente rechazar sin loguear
      return Promise.reject(error);
    }
    // Para otros errores, dejar que se muestren normalmente
    return Promise.reject(error);
  }
);

export default api;