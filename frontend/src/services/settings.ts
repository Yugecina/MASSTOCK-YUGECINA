/**
 * Settings Service
 * API calls for user settings, profile, and collaborator management
 */

import api from './api';
import logger from '@/utils/logger';

interface UpdateProfileData {
  email?: string;
  password?: string;
  name?: string;
}

interface InviteCollaboratorData {
  email: string;
  role: 'owner' | 'collaborator';
}

export const settingsService = {
  /**
   * Get current user profile with client information
   * @returns {Promise} Profile data with user and client info
   */
  getProfile: async (): Promise<any> => {
    logger.debug('📋 settingsService.getProfile: Fetching profile');
    try {
      const response = await api.get('/v1/settings/profile');
      logger.debug('✅ settingsService.getProfile: Success:', response);
      return response;
    } catch (error: any) {
      logger.error('❌ settingsService.getProfile: Failed:', {
        error,
        message: error.message,
        response: error.response
      });
      throw error;
    }
  },

  /**
   * Update user profile
   * @param {Object} data - Profile update data
   * @returns {Promise} Updated profile
   */
  updateProfile: async (data: UpdateProfileData): Promise<any> => {
    logger.debug('💾 settingsService.updateProfile: Updating profile with:', data);
    try {
      const response = await api.put('/v1/settings/profile', data);
      logger.debug('✅ settingsService.updateProfile: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ settingsService.updateProfile: Failed:', {
        error,
        message: error.message,
        response: error.response
      });
      throw error;
    }
  },

  /**
   * Get all collaborators for the user's client
   * @returns {Promise} List of collaborators
   */
  getCollaborators: async (): Promise<any> => {
    logger.debug('👥 settingsService.getCollaborators: Fetching collaborators');
    try {
      const response = await api.get('/v1/settings/collaborators');
      logger.debug('✅ settingsService.getCollaborators: Success:', response);
      return response;
    } catch (error: any) {
      logger.error('❌ settingsService.getCollaborators: Failed:', {
        error,
        message: error.message,
        response: error.response
      });
      throw error;
    }
  },

  /**
   * Invite a new collaborator (owner only)
   * @param {Object} data - Invitation data {email, role}
   * @returns {Promise} Invited user data
   */
  inviteCollaborator: async (data: InviteCollaboratorData): Promise<any> => {
    logger.debug('✉️ settingsService.inviteCollaborator: Inviting:', data.email);
    try {
      const response = await api.post('/v1/settings/collaborators/invite', data);
      logger.debug('✅ settingsService.inviteCollaborator: Success:', response);
      return response;
    } catch (error: any) {
      logger.error('❌ settingsService.inviteCollaborator: Failed:', {
        error,
        message: error.message,
        response: error.response
      });
      throw error;
    }
  },

  /**
   * Remove a collaborator (owner only)
   * @param {string} collaboratorId - ID of collaborator to remove
   * @returns {Promise} Success message
   */
  removeCollaborator: async (collaboratorId: string): Promise<any> => {
    logger.debug('🗑️ settingsService.removeCollaborator: Removing:', collaboratorId);
    try {
      const response = await api.delete(`/v1/settings/collaborators/${collaboratorId}`);
      logger.debug('✅ settingsService.removeCollaborator: Success');
      return response;
    } catch (error: any) {
      logger.error('❌ settingsService.removeCollaborator: Failed:', {
        error,
        message: error.message,
        response: error.response
      });
      throw error;
    }
  }
};
