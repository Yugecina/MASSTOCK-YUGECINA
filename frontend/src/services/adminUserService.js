/**
 * Service pour les opérations admin sur les utilisateurs
 * @file adminUserService.js
 */

import api from './api';
import logger from '@/utils/logger';


export const adminUserService = {
  /**
   * Récupère la liste de tous les utilisateurs avec leurs informations de client
   * @param {number} page - Numéro de page
   * @param {Object} filters - Filtres (role, client_role, status, search, limit)
   * @returns {Promise} Liste des users avec pagination
   */
  getUsers: async (page = 1, filters = {}) => {
    const params = {
      page,
      limit: filters.limit || 50,
      ...(filters.role && { role: filters.role }),
      ...(filters.client_role && { client_role: filters.client_role }),
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search })
    };

    logger.debug('👥 adminUserService.getUsers: Fetching users with params:', params);

    try {
      const response = await api.get('/v1/admin/users', { params });
      logger.debug('✅ adminUserService.getUsers: Success:', response);
      return response;
    } catch (error) {
      logger.error('❌ adminUserService.getUsers: Failed:', {
        error,
        message: error.message,
        response: error.response
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
  getClients: async (page = 1, filters = {}) => {
    const params = {
      page,
      limit: filters.limit || 50,
      ...(filters.status && { status: filters.status }),
      ...(filters.plan && { plan: filters.plan }),
      ...(filters.search && { search: filters.search })
    };

    logger.debug('🏢 adminUserService.getClients: Fetching clients with params:', params);

    try {
      const response = await api.get('/v1/admin/clients', { params });
      logger.debug('✅ adminUserService.getClients: Success:', response);
      return response;
    } catch (error) {
      logger.error('❌ adminUserService.getClients: Failed:', {
        error,
        message: error.message,
        response: error.response
      });
      throw error;
    }
  },

  /**
   * Récupère les détails d'un utilisateur/client
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise} Détails du client
   */
  getUserDetails: async (userId) => {
    // Note: api.get already returns response.data due to interceptor
    return api.get(`/v1/admin/clients/${userId}`);
  },

  /**
   * Crée un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise} Utilisateur créé
   */
  createUser: async (userData) => {
    // Note: api.post already returns response.data due to interceptor
    return api.post('/v1/admin/users', userData);
  },

  /**
   * Met à jour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise} Utilisateur mis à jour
   */
  updateUser: async (userId, updateData) => {
    // Note: api.put already returns response.data due to interceptor
    return api.put(`/v1/admin/clients/${userId}`, updateData);
  },

  /**
   * Supprime un utilisateur (soft delete)
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise} Résultat de la suppression
   */
  deleteUser: async (userId) => {
    // Note: api.delete already returns response.data due to interceptor
    return api.delete(`/v1/admin/clients/${userId}`);
  },

  /**
   * Bloque un utilisateur (suspend)
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise} Utilisateur suspendu
   */
  blockUser: async (userId) => {
    return await adminUserService.updateUser(userId, { status: 'suspended' });
  },

  /**
   * Débloque un utilisateur (active)
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise} Utilisateur activé
   */
  unblockUser: async (userId) => {
    return await adminUserService.updateUser(userId, { status: 'active' });
  }
};
