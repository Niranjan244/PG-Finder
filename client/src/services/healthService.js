import apiClient from './apiClient.js';

export const fetchSystemHealth = async () => {
  return await apiClient.get('/health');
};
