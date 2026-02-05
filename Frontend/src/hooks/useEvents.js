import { useState, useEffect, useCallback } from "react";
import api from "../api/client";

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await api.get("/events");
      setEvents(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error cargando eventos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
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