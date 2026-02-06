import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export function useAnalytics() {
  // 1. Summary
  const summaryQuery = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => (await api.get('/analytics/summary')).data,
    staleTime: 0, // Always refetch when invalidated
    refetchOnMount: true
  });

  // 2. Top Locations
  const topLocationsQuery = useQuery({
    queryKey: ['analytics', 'top'],
    queryFn: async () => (await api.get('/analytics/top-locations')).data,
    staleTime: 0,
    refetchOnMount: true
  });

  // 3. Peak Hours
  const peakHoursQuery = useQuery({
    queryKey: ['analytics', 'peak'],
    queryFn: async () => (await api.get('/analytics/peak-hours')).data,
    staleTime: 0,
    refetchOnMount: true
  });

  return {
    summary: summaryQuery.data || { totalVisits: 0, totalUsers: 0, totalEvents: 0 },
    topLocations: topLocationsQuery.data || [],
    peakHours: peakHoursQuery.data || [],
    loading: summaryQuery.isLoading || topLocationsQuery.isLoading
  };
}