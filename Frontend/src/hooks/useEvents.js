import { useState, useEffect, useCallback } from "react";
import api from "../api/client";
import { socket } from "../api/socket";

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      console.log('📋 [EVENTS] Fetching events from API...');
      const { data } = await api.get("/events");
      console.log('✅ [EVENTS] Loaded', data.length, 'events');
      setEvents(data);
      setError(null);
    } catch (err) {
      console.error('❌ [EVENTS] Error loading events:', err);
      setError("Error cargando eventos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();

    // 🔥 WebSocket: Escuchar nuevos eventos en tiempo real
    const handleNewData = (payload) => {
      console.log('🔔 [EVENTS] WebSocket event received:', payload);

      if (payload.type === 'EVENT_CREATED') {
        console.log('➕ [EVENTS] New event created, adding to list:', payload.data.title);
        setEvents((prev) => [...prev, payload.data]);
      } else if (payload.type === 'EVENT_UPDATED') {
        console.log('✏️ [EVENTS] Event updated:', payload.data.id);
        setEvents((prev) =>
          prev.map((e) => (e.id === payload.data.id ? payload.data : e))
        );
      } else if (payload.type === 'EVENT_DELETED') {
        console.log('🗑️ [EVENTS] Event deleted:', payload.data.id);
        setEvents((prev) => prev.filter((e) => e.id !== payload.data.id));
      }
    };

    socket.on('server:new_data', handleNewData);
    console.log('👂 [EVENTS] WebSocket listener registered for server:new_data');

    return () => {
      socket.off('server:new_data', handleNewData);
      console.log('👋 [EVENTS] WebSocket listener unregistered');
    };
  }, [fetchEvents]);

  // 🔥 CLAVE: Retornamos 'setEvents' y 'refreshEvents'
  return {
    events,
    setEvents,
    refreshEvents: fetchEvents,
    loading,
    error
  };
}