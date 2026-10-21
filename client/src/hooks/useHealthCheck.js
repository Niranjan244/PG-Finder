import { useQuery } from '@tanstack/react-query';
import { fetchSystemHealth } from '../services/healthService.js';

export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['systemHealth'],
    queryFn: fetchSystemHealth,
    refetchInterval: 30000,
    retry: 1,
  });
};
