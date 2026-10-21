import apiClient from './apiClient.js';

export const fetchWishlistApi = async (params = {}) => {
  return await apiClient.get('/wishlist', { params });
};

export const fetchWishlistIdsApi = async () => {
  return await apiClient.get('/wishlist/ids');
};

export const toggleWishlistApi = async (pgId) => {
  return await apiClient.post(`/wishlist/${pgId}/toggle`);
};
