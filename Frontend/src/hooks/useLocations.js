import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export function useLocations() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['locations'], 
    queryFn: async () => {
      const { data } = await api.get('/locations');
      return data;
    },
    staleTime: Infinity, // Solo se actualiza si el socket lo ordena
  });

  return { locations: data || [], loading: isLoading, error };
}