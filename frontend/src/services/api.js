import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Enable sending cookies with requests
})

// Request interceptor - no longer need to manually add token
// Cookies are sent automatically with withCredentials: true
api.interceptors.request.use((config) => {
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Only logout on 401 if it's not the login endpoint
    // Only logout on 401 if it's not the login endpoint or the initial auth check
    if (error.response?.status === 401 &&
      !error.config?.url?.includes('/v1/auth/login') &&
      !error.config?.url?.includes('/v1/auth/me')) {
      useAuthStore.getState().logout()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
