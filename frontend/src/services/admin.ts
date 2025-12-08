import api from './api';
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
};

interface DashboardData {
  [key: string]: any;
}

interface ClientData {
  [key: string]: any;
}

interface WorkflowData {
  [key: string]: any;
}

interface ErrorData {
  [key: string]: any;
}

interface TicketData {
  [key: string]: any;
}

interface FinanceData {
  [key: string]: any;
}

interface SettingsData {
  system: {
    appName: string;
    appVersion: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
    defaultUserRole: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    fromEmail: string;
    fromName: string;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
    notifyAdminOnNewClient: boolean;
    notifyAdminOnError: boolean;
  };
  security: {
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
}

export const adminService = {
  getDashboard: (): Promise<DashboardData> => api.get('/v1/admin/dashboard'),
  getClients: (): Promise<ClientData[]> => api.get('/v1/admin/clients'),
  getWorkflows: (): Promise<WorkflowData[]> => api.get('/v1/admin/workflows'),
  getErrors: (): Promise<ErrorData[]> => api.get('/v1/admin/errors'),
  getTickets: (): Promise<TicketData[]> => api.get('/v1/admin/tickets'),
  getFinances: (): Promise<FinanceData> => api.get('/v1/admin/finances'),

  // Mock settings endpoints
  getSettings: async (): Promise<{ success: boolean; data: SettingsData }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, data: mockSettings };
  },

  updateSettings: async (settings: Partial<SettingsData>): Promise<{ success: boolean; data: SettingsData }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    logger.debug('Mock: Settings updated', settings);
    return { success: true, data: { ...mockSettings, ...settings } };
  },

  replyTicket: (id: string, message: string): Promise<any> =>
    api.post(`/v1/admin/tickets/${id}/reply`, { message }),
};
