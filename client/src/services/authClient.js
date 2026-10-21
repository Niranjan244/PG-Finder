import apiClient from './apiClient.js';

export const registerApi = async (userData) => {
  return await apiClient.post('/auth/register', userData);
};

export const loginApi = async (credentials) => {
  return await apiClient.post('/auth/login', credentials);
};

export const logoutApi = async () => {
  return await apiClient.post('/auth/logout');
};

export const getMeApi = async () => {
  return await apiClient.get('/auth/me');
};

export const forgotPasswordApi = async (email) => {
  return await apiClient.post('/auth/forgot-password', { email });
};

export const resetPasswordApi = async ({ token, password }) => {
  return await apiClient.post('/auth/reset-password', { token, password });
};
