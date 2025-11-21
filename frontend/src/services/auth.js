import api from './api'

export const authService = {
  login: (email, password) => api.post('/v1/auth/login', { email, password }),
  logout: () => api.post('/v1/auth/logout'),
  refresh: (refreshToken) => api.post('/v1/auth/refresh', { refresh_token: refreshToken }),
}
