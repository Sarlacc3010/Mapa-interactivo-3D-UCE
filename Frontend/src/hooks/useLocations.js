import { useState, useEffect } from 'react';

// URL del backend (Asegúrate de que coincida con el puerto de tu backend)
const API_URL = 'http://localhost:5000/api/locations';

export const useLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Error en la respuesta del servidor');
        }
        const data = await response.json();
        setLocations(data);
      } catch (err) {
        console.error("Error cargando ubicaciones:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return { locations, loading, error };
};