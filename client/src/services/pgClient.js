import apiClient from './apiClient.js';

export const fetchOwnerListings = async () => {
  return await apiClient.get('/owner/pgs');
};

export const fetchOwnerListingById = async (id) => {
  return await apiClient.get(`/owner/pgs/${id}`);
};

export const createListingApi = async (pgData) => {
  return await apiClient.post('/owner/pgs', pgData);
};

export const updateListingApi = async (id, pgData) => {
  return await apiClient.put(`/owner/pgs/${id}`, pgData);
};

export const deleteListingApi = async (id) => {
  return await apiClient.delete(`/owner/pgs/${id}`);
};

export const addRoomApi = async (pgId, roomData) => {
  return await apiClient.post(`/owner/pgs/${pgId}/rooms`, roomData);
};

export const updateRoomApi = async (pgId, roomId, roomData) => {
  return await apiClient.put(`/owner/pgs/${pgId}/rooms/${roomId}`, roomData);
};

export const deleteRoomApi = async (pgId, roomId) => {
  return await apiClient.delete(`/owner/pgs/${pgId}/rooms/${roomId}`);
};

export const uploadImagesApi = async (formData) => {
  return await apiClient.post('/owner/pgs/upload', formData, {
    headers: {
      'Content-Type': undefined,
    },
  });
};

export const fetchPublicPGApi = async (id) => {
  return await apiClient.get(`/pgs/${id}`);
};

export const searchPGsApi = async (params) => {
  return await apiClient.get('/pgs/search', { params });
};

export const geocodeLocationApi = async (query) => {
  return await apiClient.get('/pgs/geocode', { params: { q: query } });
};

export const reverseGeocodeLocationApi = async (lat, lng) => {
  return await apiClient.get('/pgs/reverse-geocode', { params: { lat, lng } });
};

