import { useQuery } from '@tanstack/react-query';

// 1. Función para obtener datos (fetcher)
const fetchLocations = async () => {
  // Ahora incluimos credenciales para que viajen las cookies si fueran necesarias
  const response = await fetch('http://localhost:5000/api/locations', {
    credentials: 'include' 
  });
  
  if (!response.ok) {
    throw new Error('Error al cargar la información del campus');
  }
  
  return response.json();
};

// 2. El Hook personalizado
export function useLocations() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['locations'], 
    queryFn: fetchLocations,
    staleTime: 1000 * 60 * 5, 
    retry: 1, 
  });

  return {
    locations: data || [], 
    loading: isLoading,
    error
  };
}