/**
 * Supabase Mock Factory
 * Provides typed mocks for Supabase client compatible with TypeScript
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface MockSupabaseResponse<T = any> {
  data: T | null;
  error: any | null;
}

export interface MockQueryBuilder {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  neq: jest.Mock;
  gt: jest.Mock;
  gte: jest.Mock;
  lt: jest.Mock;
  lte: jest.Mock;
  like: jest.Mock;
  ilike: jest.Mock;
  is: jest.Mock;
  in: jest.Mock;
  contains: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  range: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
}

/**
 * Create a mock Supabase query builder with chainable methods
 */
export function createMockQueryBuilder(response?: MockSupabaseResponse): MockQueryBuilder {
  const defaultResponse: MockSupabaseResponse = response || { data: null, error: null };

  const queryBuilder: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(defaultResponse),
    maybeSingle: jest.fn().mockResolvedValue(defaultResponse),
  };

  return queryBuilder;
}

/**
 * Create a mock Supabase client with common methods
 */
export function createMockSupabase(): Partial<SupabaseClient> {
  return {
    from: jest.fn((table: string) => createMockQueryBuilder()) as any,
    auth: {
      signInWithPassword: jest.fn() as any,
      signUp: jest.fn() as any,
      signOut: jest.fn() as any,
      getUser: jest.fn() as any,
      getSession: jest.fn() as any,
      refreshSession: jest.fn() as any,
      updateUser: jest.fn() as any,
      resetPasswordForEmail: jest.fn() as any,
    } as any,
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
      })) as any,
    } as any,
  };
}

/**
 * Mock successful auth response
 */
export function mockAuthSuccess(user: any = {}) {
  return {
    data: {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        ...user,
      },
      session: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
      },
    },
    error: null,
  };
}

/**
 * Mock auth error response
 */
export function mockAuthError(message: string = 'Invalid credentials') {
  return {
    data: null,
    error: {
      message,
      status: 401,
    },
  };
}

/**
 * Mock database query success
 */
export function mockQuerySuccess<T>(data: T) {
  return {
    data,
    error: null,
  };
}

/**
 * Mock database query error
 */
export function mockQueryError(message: string = 'Database error') {
  return {
    data: null,
    error: {
      message,
      code: 'PGRST116',
      details: null,
      hint: null,
    },
  };
}
