/**
 * Service pour les opérations admin sur les utilisateurs
 * @file adminUserService.ts
 */

import api from './api';
import { User, Client } from '@/types';

interface UserFilters {
  limit?: number;
  role?: string;
  client_role?: string;
  status?: string;
  search?: string;
}

interface ClientFilters {
  limit?: number;
  status?: string;
  plan?: string;
  search?: string;
}

interface CreateUserData {
  email: string;
  password: string;
  role: string;
  client_id?: string;
}

interface UpdateUserData {
  email?: string;
  role?: string;
  status?: string;
}

export const adminUserService = {
  /**
   * Récupère la liste de tous les utilisateurs avec leurs informations de client
   * @param {number} page - Numéro de page
   * @param {Object} filters - Filtres (role, client_role, status, search, limit)
   * @returns {Promise} Liste des users avec pagination
   */
  getUsers: async (page: number = 1, filters: UserFilters = {}): Promise<any> => {
    const params: Record<string, string | number> = {
      page,
      limit: filters.limit || 50,
      ...(filters.role && { role: filters.role }),
      ...(filters.client_role && { client_role: filters.client_role }),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search })
    };

    console.log('📡 adminUserService.getUsers: Starting', { params });

    try {
      const response = await api.get('/v1/admin/users', { params });
      console.log('✅ adminUserService.getUsers: Response', {
        status: response.status,
        data: response.data,
        users: response.data?.data?.users,
        pagination: response.data?.data?.pagination
      });
      return response;
    } catch (error: any) {
      console.error('❌ adminUserService.getUsers: Error', {
        error,
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  /**
   * Récupère la liste de tous les clients avec leurs informations
   * @param {number} page - Numéro de page
   * @param {Object} filters - Filtres (status, plan, search, limit)
   * @returns {Promise} Liste des clients avec pagination
   */
  getClients: async (page: number = 1, filters: ClientFilters = {}): Promise<any> => {
    const params: Record<string, string | number> = {
      page,
      limit: filters.limit || 50,
      ...(filters.status && { status: filters.status }),
      ...(filters.plan && { plan: filters.plan }),
      ...(filters.search && { search: filters.search })
    };

    console.log('📡 adminUserService.getClients: Starting', { params });

    try {
      const response = await api.get('/v1/admin/clients', { params });
      console.log('✅ adminUserService.getClients: Response', {
        status: response.status,
        data: response.data,
        clients: response.data?.data?.clients,
        clientsCount: response.data?.data?.clients?.length,
        pagination: response.data?.data?.pagination
      });
      return response;
    } catch (error: any) {
      console.error('❌ adminUserService.getClients: Error', {
        error,
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  /**
   * Récupère les détails d'un utilisateur/client
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise} Détails du client
   */
  getUserDetails: async (userId: string): Promise<any> => {
    // Note: api.get already returns response.data due to interceptor
    return api.get(`/v1/admin/clients/${userId}`);
  },

  /**
   * Crée un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise} Utilisateur créé
   */
  createUser: async (userData: CreateUserData): Promise<any> => {
    // Note: api.post already returns response.data due to interceptor
    return api.post('/v1/admin/users', userData);
  },

  /**
   * Met à jour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise} Utilisateur mis à jour
   */
  updateUser: async (userId: string, updateData: UpdateUserData): Promise<any> => {
    // Note: api.put already returns response.data due to interceptor
    return api.put(`/v1/admin/clients/${userId}`, updateData);
  },

  /**
   * Supprime un utilisateur (soft delete)
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise} Résultat de la suppression
   */
  deleteUser: async (userId: string): Promise<any> => {
    // Note: api.delete already returns response.data due to interceptor
    return api.delete(`/v1/admin/clients/${userId}`);
  },

  /**
   * Bloque un utilisateur (suspend)
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise} Utilisateur suspendu
   */
  blockUser: async (userId: string): Promise<any> => {
    return await adminUserService.updateUser(userId, { status: 'suspended' });
  },

  /**
   * Débloque un utilisateur (active)
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise} Utilisateur activé
   */
  unblockUser: async (userId: string): Promise<any> => {
    return await adminUserService.updateUser(userId, { status: 'active' });
  }
};
