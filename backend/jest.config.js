module.exports = {
  // Test environment
  testEnvironment: 'node',

  // TypeScript support
  preset: 'ts-jest',

  // Test file patterns (support both .js and .ts)
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.js',
    '**/__tests__/**/*.spec.ts',
  ],

  // Transform TypeScript files
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Coverage configuration (support both .js and .ts)
  collectCoverageFrom: [
    'src/**/*.js',
    'src/**/*.ts',
    '!src/server.js',
    '!src/server.ts',
    '!src/**/__tests__/**',
    '!src/**/index.js',
    '!src/**/index.ts',
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
