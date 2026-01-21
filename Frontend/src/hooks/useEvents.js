import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export function useEvents() {
  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await api.get('/events');
      return data;
    }
  });

  return { events: data || [], loading: isLoading };
}