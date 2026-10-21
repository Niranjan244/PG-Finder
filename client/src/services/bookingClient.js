import apiClient from './apiClient.js';

export const createBookingApi = async (bookingData) => {
  return await apiClient.post('/bookings', bookingData);
};

export const getMyBookingsApi = async () => {
  return await apiClient.get('/bookings/my');
};

export const getOwnerBookingsApi = async (params = {}) => {
  return await apiClient.get('/bookings/owner', { params });
};

export const approveBookingApi = async (bookingId) => {
  return await apiClient.patch(`/bookings/${bookingId}/approve`);
};

export const rejectBookingApi = async (bookingId, reason = '') => {
  return await apiClient.patch(`/bookings/${bookingId}/reject`, { reason });
};

export const cancelBookingApi = async (bookingId, reason = '') => {
  return await apiClient.patch(`/bookings/${bookingId}/cancel`, { reason });
};
