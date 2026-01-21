import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export function useAnalytics() {
  // 1. Resumen
  const summaryQuery = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => (await api.get('/analytics/summary')).data
  });

  // 2. Top Lugares
  const topLocationsQuery = useQuery({
    queryKey: ['analytics', 'top'],
    queryFn: async () => (await api.get('/analytics/top-locations')).data
  });

  // 3. Horas Pico
  const peakHoursQuery = useQuery({
    queryKey: ['analytics', 'peak'],
    queryFn: async () => (await api.get('/analytics/peak-hours')).data
  });

  return {
    summary: summaryQuery.data || { totalVisits: 0, totalUsers: 0, totalEvents: 0 },
    topLocations: topLocationsQuery.data || [],
    peakHours: peakHoursQuery.data || [],
    loading: summaryQuery.isLoading || topLocationsQuery.isLoading
  };
}