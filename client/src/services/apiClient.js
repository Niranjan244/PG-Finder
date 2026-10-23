import axios from 'axios';

const apiClient = axios.create({
  baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isAuthRoute =
      error.config?.url?.includes('/auth/me') ||
      error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register') ||
      error.config?.url?.includes('/auth/verify-2fa') ||
      error.config?.url?.includes('/auth/resend-2fa') ||
      error.config?.url?.includes('/auth/firebase') ||
      error.config?.url?.includes('/auth/forgot-password') ||
      error.config?.url?.includes('/auth/reset-password');

    if (error.response?.status === 401 && !isAuthRoute) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pg_auth_unauthorized'));
      }
    }

    const formattedError = {
      message: error.response?.data?.message || error.message || 'Network error occurred',
      status: error.response?.status,
      errors: error.response?.data?.errors,
    };
    return Promise.reject(formattedError);
  }
);

export { apiClient };
export default apiClient;
