import api from './api'
import logger from '@/utils/logger';


// Mock data for development
const mockSettings = {
  system: {
    appName: 'MasStock',
    appVersion: '1.0.0',
    maintenanceMode: false,
    allowRegistration: true,
    defaultUserRole: 'user',
  },
  email: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@masstock.com',
    fromEmail: 'noreply@masstock.com',
    fromName: 'MasStock Support',
  },
  notifications: {
    enableEmailNotifications: true,
    enablePushNotifications: false,
    notifyAdminOnNewClient: true,
    notifyAdminOnError: true,
  },
  security: {
    jwtExpiresIn: '15m',
    refreshTokenExpiresIn: '7d',
    maxLoginAttempts: 5,
    lockoutDuration: 30,
  },
}

export const adminService = {
  getDashboard: () => api.get('/v1/admin/dashboard'),
  getClients: () => api.get('/v1/admin/clients'),
  getWorkflows: () => api.get('/v1/admin/workflows'),
  getErrors: () => api.get('/v1/admin/errors'),
  getTickets: () => api.get('/v1/admin/tickets'),
  getFinances: () => api.get('/v1/admin/finances'),

  // Mock settings endpoints
  getSettings: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return { success: true, data: mockSettings }
  },

  updateSettings: async (settings) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    logger.debug('Mock: Settings updated', settings)
    return { success: true, data: settings }
  },

  replyTicket: (id, message) => api.post(`/v1/admin/tickets/${id}/reply`, { message }),
}
