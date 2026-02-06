import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export function useLocations() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data } = await api.get('/locations');
      return data;
    },
    staleTime: Infinity, // Only updates if socket commands it
  });

  return { locations: data || [], loading: isLoading, error };
}