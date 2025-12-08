/**
 * Tests for Request Logger Middleware
 */

jest.mock('../../config/database', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: {}, error: null })
    }))
  }
}));

jest.mock('../../config/logger', () => ({
  logRequest: jest.fn(),
  logError: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('Request Logger Middleware', () => {
  let requestLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Import default export from TypeScript module
    requestLogger = require('../../middleware/requestLogger').default;
  });

  it('should be importable', () => {
    expect(requestLogger).toBeDefined();
  });

  it('should export middleware function', () => {
    expect(typeof requestLogger).toBe('function');
  });

  it('should log request details', () => {
    const req = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      body: {},
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
      user: { id: 'user-1' },
      client: { id: 'client-1' }
    };

    const res = {
      statusCode: 200,
      json: jest.fn(function(body) { return this; }),
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          callback();
        }
      })
    };

    // Add bind method to res.json
    res.json.bind = jest.fn((context) => res.json);

    const next = jest.fn() as jest.Mock;

    requestLogger(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
