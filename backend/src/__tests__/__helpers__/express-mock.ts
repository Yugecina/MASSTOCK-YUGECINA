/**
 * Express Mock Factory
 * Provides typed mocks for Express Request, Response, and NextFunction
 */

import { Request, Response, NextFunction } from 'express';

export interface MockRequest extends Partial<Request> {
  body: any;
  query: any;
  params: any;
  headers: any;
  user?: any;
  client?: any;
  cookies?: any;
  ip?: string;
  get: jest.Mock;
}

export interface MockResponse extends Partial<Response> {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
  cookie: jest.Mock;
  clearCookie: jest.Mock;
  redirect: jest.Mock;
  render: jest.Mock;
  locals: any;
}

/**
 * Create a mock Express Request object
 */
export function createMockRequest(overrides: Partial<MockRequest> = {}): MockRequest {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    cookies: {},
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('Mozilla/5.0'),
    ...overrides,
  };
}

/**
 * Create a mock Express Response object
 */
export function createMockResponse(): MockResponse {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    render: jest.fn().mockReturnThis(),
    locals: {},
  };

  return res;
}

/**
 * Create a mock Express NextFunction
 */
export function createMockNext(): jest.Mock {
  return jest.fn();
}

/**
 * Create a complete set of Express mocks (req, res, next)
 */
export function createExpressMocks(reqOverrides: Partial<MockRequest> = {}) {
  return {
    req: createMockRequest(reqOverrides),
    res: createMockResponse(),
    next: createMockNext(),
  };
}

/**
 * Mock authenticated user in request
 */
export function mockAuthenticatedUser(user: any = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user',
    client_id: 'client-123',
    ...user,
  };
}

/**
 * Mock admin user in request
 */
export function mockAdminUser(user: any = {}) {
  return {
    id: 'admin-123',
    email: 'admin@example.com',
    role: 'admin',
    ...user,
  };
}

/**
 * Create mock request with authenticated user
 */
export function createAuthenticatedRequest(user: any = {}, overrides: Partial<MockRequest> = {}): MockRequest {
  return createMockRequest({
    user: mockAuthenticatedUser(user),
    ...overrides,
  });
}

/**
 * Create mock request with admin user
 */
export function createAdminRequest(user: any = {}, overrides: Partial<MockRequest> = {}): MockRequest {
  return createMockRequest({
    user: mockAdminUser(user),
    ...overrides,
  });
}
