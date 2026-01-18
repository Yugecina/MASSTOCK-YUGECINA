/**
 * Admin Dashboard Service
 * API calls for admin dashboard, analytics, errors, tickets
 */

import api from './api';
import logger from '@/utils/logger';

interface DashboardData {
  uptime_percent: number;
  errors_24h: number;
  total_executions_24h: number;
  total_revenue_month: number;
  active_clients: number;
  recent_activity: Array<{
    id: string;
    action: string;
    created_at: string;
    user?: { id: string; email: string; name?: string };
    client?: { id: string; name: string };
  }>;
}

interface ErrorData {
  id: string;
  severity: 'critical' | 'error' | 'warning';
  message: string;
  count: number;
  stack_trace?: string;
}

interface TicketData {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
}

interface FinanceData {
  monthly_revenue: number;
  yearly_revenue: number;
  net_profit: number;
  operating_costs: number;
  profit_margin: number;
  revenue_breakdown: Array<{
    source: string;
    amount: number;
  }>;
}

export const adminDashboardService = {
  /**
   * Get admin dashboard stats
   * Returns: uptime, errors, executions, revenue, active clients, recent activity
   */
  getDashboard: async (): Promise<DashboardData> => {
    logger.debug('📊 adminDashboardService.getDashboard: Loading');
    try {
      const response = await api.get('/admin/dashboard');
      logger.debug('✅ adminDashboardService.getDashboard: Success', response?.data);
      return response?.data || {};
    } catch (error: any) {
      logger.error('❌ adminDashboardService.getDashboard: Error', {
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Get error logs
   * Returns: list of system errors with severity
   */
  getErrors: async (): Promise<ErrorData[]> => {
    logger.debug('🐛 adminDashboardService.getErrors: Loading');
    try {
      const response = await api.get('/admin/errors');
      logger.debug('✅ adminDashboardService.getErrors: Success');
      return response?.data?.errors || [];
    } catch (error: any) {
      logger.error('❌ adminDashboardService.getErrors: Error', {
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Get support tickets
   * Returns: list of support tickets
   */
  getTickets: async (): Promise<TicketData[]> => {
    logger.debug('🎫 adminDashboardService.getTickets: Loading');
    try {
      const response = await api.get('/admin/tickets');
      logger.debug('✅ adminDashboardService.getTickets: Success');
      return response?.data?.tickets || [];
    } catch (error: any) {
      logger.error('❌ adminDashboardService.getTickets: Error', {
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Reply to a support ticket
   */
  replyTicket: async (id: string, message: string): Promise<void> => {
    logger.debug('💬 adminDashboardService.replyTicket: Sending', { id });
    try {
      await api.post(`/admin/tickets/${id}/reply`, { message });
      logger.debug('✅ adminDashboardService.replyTicket: Success');
    } catch (error: any) {
      logger.error('❌ adminDashboardService.replyTicket: Error', {
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Get financial dashboard data
   * Returns: revenue, profit, costs, margins
   */
  getFinances: async (): Promise<FinanceData> => {
    logger.debug('💰 adminDashboardService.getFinances: Loading');
    try {
      const response = await api.get('/admin/finances');
      logger.debug('✅ adminDashboardService.getFinances: Success');
      return response?.data || {};
    } catch (error: any) {
      logger.error('❌ adminDashboardService.getFinances: Error', {
        error: error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },
};
