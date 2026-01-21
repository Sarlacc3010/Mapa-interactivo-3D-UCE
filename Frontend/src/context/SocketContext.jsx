// Frontend/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Conectar al Backend
    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // 2. Escuchar Eventos Globales y Actualizar React Query
    newSocket.on('connect', () => console.log("🟢 [SOCKET] Conectado ID:", newSocket.id));
    
    newSocket.on('server:visit_registered', (data) => {
      console.log("📈 Nueva visita detectada:", data);
      // 🔥 ESTO ES LA MAGIA: Obliga a recargar las gráficas automáticamente
      queryClient.invalidateQueries(['analytics']); 
      queryClient.invalidateQueries(['locations']);
    });

    newSocket.on('server:data_updated', (data) => {
      console.log("🔄 Datos actualizados:", data);
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