import apiClient from './apiClient.js';

export const createPaymentOrderApi = async (bookingId) => {
  return apiClient.post('/payments/create-order', { bookingId });
};

export const verifyPaymentApi = async (payload) => {
  return apiClient.post('/payments/verify', payload);
};

export const getMyPaymentsApi = async () => {
  return apiClient.get('/payments/my-payments');
};

export const getOwnerReceivedPaymentsApi = async () => {
  return apiClient.get('/payments/received');
};

export const getAdminPaymentsApi = async (params = {}) => {
  return apiClient.get('/payments/admin/all', { params });
};

export const getAdminRevenueReportApi = async (params = {}) => {
  return apiClient.get('/payments/admin/revenue', { params });
};

export const processRefundApi = async ({ bookingId, reason }) => {
  return apiClient.post('/payments/refund', { bookingId, reason });
};
