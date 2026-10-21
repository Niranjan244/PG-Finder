import apiClient from './apiClient.js';

export const fetchPGReviewsApi = async (pgId, params = {}) => {
  return await apiClient.get(`/reviews/pg/${pgId}`, { params });
};

export const fetchReviewEligibilityApi = async (pgId) => {
  return await apiClient.get(`/reviews/pg/${pgId}/eligibility`);
};

export const submitReviewApi = async (pgId, { rating, comment }) => {
  return await apiClient.post(`/reviews/pg/${pgId}`, { rating, comment });
};
