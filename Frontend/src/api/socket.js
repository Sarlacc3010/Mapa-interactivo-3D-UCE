import { io } from 'socket.io-client';

// Configuración del socket client
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
