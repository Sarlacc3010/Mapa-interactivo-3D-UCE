import { useState, useEffect } from 'react';

// Fíjate que dice "export const", NO "export default" ni solo "const"
export const useLocations = () => { 
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Asegúrate de que este puerto (5000) coincida con tu backend
    const fetchLocations = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/locations');
        if (!response.ok) throw new Error('Error al cargar ubicaciones');
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