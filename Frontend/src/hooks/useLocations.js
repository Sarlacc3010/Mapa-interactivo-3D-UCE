import { useQuery } from '@tanstack/react-query';

// 1. Función para obtener datos (fetcher)
// Esta función debe estar FUERA del hook
const fetchLocations = async () => {
  // Asegúrate de que esta URL coincida con el puerto de tu backend
  const response = await fetch('http://localhost:5000/api/locations');
  
  if (!response.ok) {
    throw new Error('Error al cargar la información del campus');
  }
  
  return response.json();
}; // <--- ¡AQUÍ ESTABA EL ERROR! Faltaba cerrar esta llave y poner punto y coma.

// 2. El Hook personalizado
export function useLocations() {
  // Usamos React Query para manejar la petición, el estado de carga y el caché
  const { data, isLoading, error } = useQuery({
    queryKey: ['locations'], // Identificador único para el caché
    queryFn: fetchLocations,
    staleTime: 1000 * 60 * 5, // Los datos se consideran frescos por 5 minutos
    retry: 1, // Si falla, intenta 1 vez más automáticamente
  });

  return {
    locations: data || [], // Si data es undefined (cargando), devuelve array vacío
    loading: isLoading,
    error
  };
}