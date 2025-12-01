/**
 * Supabase mock factory for consistent test mocking
 */

const createMockSupabaseResponse = (data, error = null) => ({
  data,
  error,
});

const createMockSupabaseChain = (finalResponse) => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(finalResponse),
  maybeSingle: jest.fn().mockResolvedValue(finalResponse),
});

const createMockRequest = (overrides = {}) => ({
  body: {},
  query: {},
  params: {},
  user: {
    id: 'test-user-id',
    email: 'test@masstock.com',
    role: 'user',
  },
  client: null,
  ip: '127.0.0.1',
  get: jest.fn().mockReturnValue('Mozilla/5.0'),
  ...overrides,
});

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

const createMockLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
});

module.exports = {
  createMockSupabaseResponse,
  createMockSupabaseChain,
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockLogger,
};
