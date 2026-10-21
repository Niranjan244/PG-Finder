import apiClient from './apiClient.js';

export const fetchNotificationsApi = async (params = {}) => {
  return await apiClient.get('/notifications', { params });
};

export const fetchUnreadNotificationCountApi = async () => {
  return await apiClient.get('/notifications/unread-count');
};

export const markNotificationReadApi = async (id) => {
  return await apiClient.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsReadApi = async () => {
  return await apiClient.patch('/notifications/read-all');
};
