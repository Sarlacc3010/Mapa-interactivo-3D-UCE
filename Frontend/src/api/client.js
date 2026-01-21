// Frontend/src/api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // ¡Vital para cookies y sesiones!
});

export default api;