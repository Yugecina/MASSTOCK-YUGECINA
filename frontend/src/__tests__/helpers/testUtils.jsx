import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

export const renderWithRouter = (ui, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
};

export const createMockAuthState = (overrides = {}) => ({
  user: null,
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  error: null,
  ...overrides,
});

export const createMockUser = (role = 'user', overrides = {}) => ({
  id: `${role}-test-id`,
  email: `${role}@masstock.com`,
  role,
  name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
  status: 'active',
  ...overrides,
});

export const createMockApiResponse = (data, status = 200) =>
  Promise.resolve({ data, status, statusText: 'OK' });

export const createMockApiError = (message, status = 400) =>
  Promise.reject({ response: { data: { message }, status } });

export const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));
