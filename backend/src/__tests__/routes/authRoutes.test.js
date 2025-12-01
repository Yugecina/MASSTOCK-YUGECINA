/**
 * Tests for Auth Routes
 * Testing route configuration and middleware chain
 */

const express = require('express');
const request = require('supertest');
const authRoutes = require('../../routes/authRoutes');
const authController = require('../../controllers/authController');
const { authenticate, requireAdmin } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimit');

// Mock dependencies
jest.mock('../../controllers/authController');
jest.mock('../../middleware/auth');
jest.mock('../../middleware/rateLimit', () => ({
  authLimiter: (req, res, next) => next(),
  apiLimiter: (req, res, next) => next()
}));
jest.mock('../../config/logger', () => ({
  logAuth: jest.fn(),
  logError: jest.fn(),
  logAudit: jest.fn(),
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }
}));

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    // Add error handler to prevent hanging
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({ error: err.message });
    });

    // Setup middleware mocks
    authenticate.mockImplementation((req, res, next) => {
      req.user = { id: 'user-id', role: 'user' };
      next();
    });

    requireAdmin.mockImplementation((req, res, next) => {
      if (req.user?.role === 'admin') {
        next();
      } else {
        res.status(403).json({ error: 'Forbidden' });
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it('should call login controller', async () => {
      authController.login.mockImplementation((req, res) => {
        res.json({ success: true, token: 'test-token' });
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(authController.login).toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid-email', password: 'password123' });

      expect(response.status).toBe(400);
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: '12345' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
    });

    it('should call logout controller when authenticated', async () => {
      authController.logout.mockImplementation((req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(authController.logout).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should call refreshToken controller', async () => {
      authController.refreshToken.mockImplementation((req, res) => {
        res.json({ success: true, token: 'new-token' });
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'refresh-token' });

      expect(response.status).toBe(200);
      expect(authController.refreshToken).toHaveBeenCalled();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should call getMe controller when authenticated', async () => {
      authController.getMe.mockImplementation((req, res) => {
        res.json({ success: true, user: req.user });
      });

      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(authController.getMe).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/register', () => {
    it('should require authentication', async () => {
      authenticate.mockImplementation((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@example.com', password: 'password123' });

      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      authenticate.mockImplementation((req, res, next) => {
        req.user = { id: 'user-id', role: 'user' };
        next();
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@example.com', password: 'password123' });

      expect(response.status).toBe(403);
    });

    it('should call register controller when admin authenticated', async () => {
      authenticate.mockImplementation((req, res, next) => {
        req.user = { id: 'admin-id', role: 'admin' };
        next();
      });

      authController.register.mockImplementation((req, res) => {
        res.status(201).json({ success: true });
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ 
          email: 'new@example.com', 
          password: 'password12345',
          name: 'New User'
        });

      expect(response.status).toBe(201);
      expect(authController.register).toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      authenticate.mockImplementation((req, res, next) => {
        req.user = { id: 'admin-id', role: 'admin' };
        next();
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email', password: 'password12345' });

      expect(response.status).toBe(400);
    });

    it('should validate password length (min 8)', async () => {
      authenticate.mockImplementation((req, res, next) => {
        req.user = { id: 'admin-id', role: 'admin' };
        next();
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@example.com', password: '1234567' });

      expect(response.status).toBe(400);
    });
  });
});
