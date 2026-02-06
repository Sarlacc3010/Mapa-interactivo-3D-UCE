import { io } from 'socket.io-client';

// Socket client configuration
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
// In production (AWS) use relative path '/' for Nginx proxying
// Locally use direct port 5000
const SOCKET_URL = isLocal ? 'http://localhost:5000' : '/';

// Create socket instance
export const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
});

// Connection log (development only)
if (import.meta.env.DEV) {
    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });
}
