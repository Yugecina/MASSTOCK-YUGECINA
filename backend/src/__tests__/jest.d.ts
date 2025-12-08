/**
 * Jest Type Definitions for TypeScript Tests
 * Makes Jest globals available without explicit imports
 */

import '@jest/globals';

// Extend global namespace with Jest types
declare global {
  const describe: jest.Describe;
  const it: jest.It;
  const test: jest.It;
  const expect: jest.Expect;
  const beforeAll: jest.Lifecycle;
  const afterAll: jest.Lifecycle;
  const beforeEach: jest.Lifecycle;
  const afterEach: jest.Lifecycle;
  const jest: typeof import('@jest/globals')['jest'];
}

export {};
