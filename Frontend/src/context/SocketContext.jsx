// Frontend/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Connect to Backend
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const socketUrl = isLocal ? 'http://localhost:5000' : '/';
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['polling', 'websocket'], // Polling first, then upgrade to websocket
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    setSocket(newSocket);

    // 2. Listen to Global Events and Update React Query
    newSocket.on('connect', () => console.log("[SOCKET] Connected ID:", newSocket.id));

    newSocket.on('server:visit_registered', (data) => {
      console.log("[SOCKET] New visit detected:", data);
      console.log("[SOCKET] Invalidating analytics queries...");
      // Invalidar queries específicas con queryKeys exactos
      queryClient.invalidateQueries({ queryKey: ['analytics', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'top'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'peak'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });

      console.log("[SOCKET] Queries invalidated, React Query should refetch now");
    });

    newSocket.on('server:data_updated', (data) => {
      console.log("Data updated:", data);
      queryClient.invalidateQueries(['events']);
      queryClient.invalidateQueries(['locations']);
    });

    return () => newSocket.disconnect();
  }, [queryClient]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);