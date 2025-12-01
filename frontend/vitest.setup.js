import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
const IntersectionObserverMock = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  takeRecords: vi.fn(),
  unobserve: vi.fn(),
}))
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)

// Mock ResizeObserver as a class constructor
class ResizeObserverMock {
  constructor() {
    this.disconnect = vi.fn()
    this.observe = vi.fn()
    this.unobserve = vi.fn()
  }
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock)

// Augmenter le timeout pour les tests asynchrones
vi.setConfig({ testTimeout: 10000 });

// Mock CSS imports
vi.mock('*.css', () => ({}));
