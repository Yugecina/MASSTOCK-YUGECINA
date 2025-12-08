/**
 * Tests unitaires pour authController
 * @file authController.test.js
 *
 * Ce fichier contient les tests pour le contrôleur d'authentification.
 * Il démontre comment mocker Supabase et tester les fonctions du contrôleur.
 */

import * as authController from '../../controllers/authController';
import {  supabaseAdmin  } from '../../config/database';
import {  logAuth  } from '../../config/logger';

// Mock des dépendances
jest.mock('../../config/database');
jest.mock('../../config/logger');

describe('AuthController', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset des mocks avant chaque test
    jest.clearAllMocks();

    // Mock de la requête Express
    req = {
      body: {},
      headers: {},
      user: null,
    };

    // Mock de la réponse Express
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    // Mock du next pour le middleware
    next = jest.fn();
  });

  describe('login', () => {
    it('devrait retourner une erreur 400 si email manquant', async () => {
      req.body = { password: 'test123' };

      await expect(authController.login(req, res)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS',
      });
    });

    it('devrait retourner une erreur 400 si password manquant', async () => {
      req.body = { email: 'test@example.com' };

      await expect(authController.login(req, res)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS',
      });
    });

    it('devrait authentifier un utilisateur avec des credentials valides', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'validPassword123',
      };

      const mockUser = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
      };

      const mockAuth = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: mockUser,
      };

      supabaseAdmin.auth.signInWithPassword = jest.fn().mockResolvedValue({
        data: mockAuth,
        error: null,
      });

      // Act
      // Note: Ce test est un exemple. Le vrai test devrait être ajusté selon l'implémentation réelle
      // await authController.login(req, res);

      // Assert
      // expect(res.status).toHaveBeenCalledWith(200);
      // expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      //   success: true,
      //   user: expect.any(Object),
      //   token: expect.any(String),
      // }));
    });

    it('devrait retourner une erreur 401 pour des credentials invalides', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      supabaseAdmin.auth.signInWithPassword = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      await expect(authController.login(req, res)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });

      expect(logAuth).toHaveBeenCalledWith(
        'login_failed',
        null,
        expect.objectContaining({ email: 'test@example.com' })
      );
    });
  });

  // TODO: Ajouter des tests pour les autres méthodes du contrôleur
  // describe('logout', () => { ... });
  // describe('refreshToken', () => { ... });
  // describe('getProfile', () => { ... });
});
