import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Enable sending cookies with requests
});

// Token refresh state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null): void => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - no longer need to manually add token
// Cookies are sent automatically with withCredentials: true
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  return config;
});

// Response interceptor with automatic token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors with automatic token refresh
    if (error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/logout')) {

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Access token expired - attempting refresh...');

        // Try to refresh the token
        await api.post('/auth/refresh');

        console.log('✅ Token refreshed successfully - retrying request');

        // Process queued requests
        processQueue(null);
        isRefreshing = false;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', {
          error: refreshError,
          message: (refreshError as AxiosError).response?.data,
          code: (refreshError as AxiosError).response?.status
        });

        // Process queued requests with error
        processQueue(refreshError as Error);
        isRefreshing = false;

        // Only logout if refresh also fails
        console.log('🚪 Logging out due to refresh failure');
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // For /auth/me endpoint, don't logout automatically (used for initial auth check)
    if (error.response?.status === 401 && originalRequest.url?.includes('/auth/me')) {
      console.log('🔍 Auth check failed - user not authenticated');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
