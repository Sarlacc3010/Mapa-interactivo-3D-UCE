import { io } from 'socket.io-client';

// Configuración del socket client
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// En producción (AWS) usamos la ruta relativa '/' para que pase por Nginx
// En local usamos el puerto 5000 directo
const SOCKET_URL = isLocal ? 'http://localhost:5000' : '/';

// Crear instancia de socket
export const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
});

// Log de conexión (solo en desarrollo)
if (import.meta.env.DEV) {
    socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
    });
}
