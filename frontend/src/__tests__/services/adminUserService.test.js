/**
 * Tests unitaires pour adminUserService
 * @file adminUserService.test.js
 *
 * Tests pour les appels API du module admin users
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { adminUserService } from '../../services/adminUserService';

// Mock du module api
vi.mock('../../services/api');

describe('adminUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('devrait appeler le bon endpoint avec pagination par défaut', async () => {
      // Arrange
      const mockResponse = {
        data: { clients: [], pagination: { page: 1, limit: 10, total: 0 } }
      };
      api.get.mockResolvedValue(mockResponse);

      // Act
      await adminUserService.getUsers();

      // Assert
      expect(api.get).toHaveBeenCalledWith('/admin/clients', {
        params: { page: 1, limit: 10 }
      });
    });

    it('devrait appeler avec les paramètres de pagination fournis', async () => {
      // Arrange
      const mockResponse = {
        data: { clients: [], pagination: { page: 2, limit: 20, total: 0 } }
      };
      api.get.mockResolvedValue(mockResponse);

      // Act
      await adminUserService.getUsers(2, { limit: 20 });

      // Assert
      expect(api.get).toHaveBeenCalledWith('/admin/clients', {
        params: { page: 2, limit: 20 }
      });
    });

    it('devrait appeler avec les filtres fournis', async () => {
      // Arrange
      const mockResponse = {
        data: { clients: [], pagination: { page: 1, limit: 10, total: 0 } }
      };
      api.get.mockResolvedValue(mockResponse);
      const filters = { status: 'active', plan: 'pro', search: 'test@example.com' };

      // Act
      await adminUserService.getUsers(1, filters);

      // Assert
      expect(api.get).toHaveBeenCalledWith('/admin/clients', {
        params: { page: 1, limit: 10, status: 'active', plan: 'pro', search: 'test@example.com' }
      });
    });

    it('devrait retourner les données de la réponse', async () => {
      // Arrange
      const mockData = {
        clients: [
          { id: '1', email: 'test@example.com', company_name: 'Test Inc' }
        ],
        pagination: { page: 1, limit: 10, total: 1 }
      };
      api.get.mockResolvedValue({ data: mockData });

      // Act
      const result = await adminUserService.getUsers();

      // Assert
      expect(result).toEqual(mockData);
    });

    it('devrait gérer les erreurs', async () => {
      // Arrange
      const error = new Error('Network error');
      api.get.mockRejectedValue(error);

      // Act & Assert
      await expect(adminUserService.getUsers()).rejects.toThrow('Network error');
    });
  });

  describe('getUserDetails', () => {
    it('devrait appeler le bon endpoint avec l\'ID utilisateur', async () => {
      // Arrange
      const mockResponse = {
        data: { client: { id: '123', email: 'test@example.com' } }
      };
      api.get.mockResolvedValue(mockResponse);

      // Act
      await adminUserService.getUserDetails('123');

      // Assert
      expect(api.get).toHaveBeenCalledWith('/admin/clients/123');
    });

    it('devrait retourner les détails de l\'utilisateur', async () => {
      // Arrange
      const mockData = {
        client: { id: '123', email: 'test@example.com', company_name: 'Test Inc' }
      };
      api.get.mockResolvedValue({ data: mockData });

      // Act
      const result = await adminUserService.getUserDetails('123');

      // Assert
      expect(result).toEqual(mockData);
    });
  });

  describe('createUser', () => {
    it('devrait appeler POST /admin/users avec les données utilisateur', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        full_name: 'New User',
        company_name: 'New Company',
        subscription_plan: 'pro'
      };
      const mockResponse = {
        data: { user: { id: '456', ...userData } }
      };
      api.post.mockResolvedValue(mockResponse);

      // Act
      await adminUserService.createUser(userData);

      // Assert
      expect(api.post).toHaveBeenCalledWith('/admin/users', userData);
    });

    it('devrait retourner l\'utilisateur créé', async () => {
      // Arrange
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        full_name: 'New User',
        company_name: 'New Company'
      };
      const mockData = {
        user: { id: '456', ...userData }
      };
      api.post.mockResolvedValue({ data: mockData });

      // Act
      const result = await adminUserService.createUser(userData);

      // Assert
      expect(result).toEqual(mockData);
    });

    it('devrait gérer les erreurs de validation', async () => {
      // Arrange
      const error = new Error('Email already exists');
      api.post.mockRejectedValue(error);

      // Act & Assert
      await expect(adminUserService.createUser({})).rejects.toThrow('Email already exists');
    });
  });

  describe('updateUser', () => {
    it('devrait appeler PUT /admin/clients/:id avec les données', async () => {
      // Arrange
      const userId = '123';
      const updateData = {
        full_name: 'Updated Name',
        subscription_plan: 'premium_custom'
      };
      const mockResponse = {
        data: { client: { id: userId, ...updateData } }
      };
      api.put.mockResolvedValue(mockResponse);

      // Act
      await adminUserService.updateUser(userId, updateData);

      // Assert
      expect(api.put).toHaveBeenCalledWith(`/admin/clients/${userId}`, updateData);
    });

    it('devrait retourner l\'utilisateur mis à jour', async () => {
      // Arrange
      const userId = '123';
      const mockData = {
        client: { id: userId, full_name: 'Updated Name' }
      };
      api.put.mockResolvedValue({ data: mockData });

      // Act
      const result = await adminUserService.updateUser(userId, {});

      // Assert
      expect(result).toEqual(mockData);
    });
  });

  describe('deleteUser', () => {
    it('devrait appeler DELETE /admin/clients/:id', async () => {
      // Arrange
      const userId = '123';
      const mockResponse = {
        data: { message: 'User deleted' }
      };
      api.delete.mockResolvedValue(mockResponse);

      // Act
      await adminUserService.deleteUser(userId);

      // Assert
      expect(api.delete).toHaveBeenCalledWith(`/admin/clients/${userId}`);
    });

    it('devrait retourner la réponse de suppression', async () => {
      // Arrange
      const userId = '123';
      const mockData = { message: 'User deleted' };
      api.delete.mockResolvedValue({ data: mockData });

      // Act
      const result = await adminUserService.deleteUser(userId);

      // Assert
      expect(result).toEqual(mockData);
    });
  });

  describe('blockUser', () => {
    it('devrait appeler updateUser avec status suspended', async () => {
      // Arrange
      const userId = '123';
      const mockResponse = {
        data: { client: { id: userId, status: 'suspended' } }
      };
      api.put.mockResolvedValue(mockResponse);

      // Act
      await adminUserService.blockUser(userId);

      // Assert
      expect(api.put).toHaveBeenCalledWith(`/admin/clients/${userId}`, {
        status: 'suspended'
      });
    });
  });

  describe('unblockUser', () => {
    it('devrait appeler updateUser avec status active', async () => {
      // Arrange
      const userId = '123';
      const mockResponse = {
        data: { client: { id: userId, status: 'active' } }
      };
      api.put.mockResolvedValue(mockResponse);

      // Act
      await adminUserService.unblockUser(userId);

      // Assert
      expect(api.put).toHaveBeenCalledWith(`/admin/clients/${userId}`, {
        status: 'active'
      });
    });
  });
});
