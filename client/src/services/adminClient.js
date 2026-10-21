import apiClient from './apiClient.js';

export const fetchAdminStats = async () => {
  return await apiClient.get('/admin/stats');
};

export const fetchAdminPGs = async (params = {}) => {
  return await apiClient.get('/admin/pgs', { params });
};

export const updatePGStatusApi = async (pgId, status, reason = '') => {
  return await apiClient.patch(`/admin/pgs/${pgId}/status`, { status, reason });
};

export const deletePGByAdminApi = async (pgId) => {
  return await apiClient.delete(`/admin/pgs/${pgId}`);
};

export const fetchAdminUsersApi = async (params = {}) => {
  return await apiClient.get('/admin/users', { params });
};

export const toggleBlockUserApi = async (userId) => {
  return await apiClient.patch(`/admin/users/${userId}/block`);
};
