/**
 * Tests for Login page with role-based redirect
 * @file Login.test.jsx
 *
 * Tests for the Login component ensuring role-based redirection
 * (admin users redirect to /admin/dashboard, client users to /dashboard)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../../pages/Login';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth hook
const mockLogin = vi.fn();
let mockAuthState = {
  login: mockLogin,
  loading: false,
  isAuthenticated: false,
  user: null,
};

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

describe('Login - Role-based Redirection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      login: mockLogin,
      loading: false,
      isAuthenticated: false,
      user: null,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to /admin/dashboard if user.role === "admin" after login', async () => {
    // Arrange
    const adminUser = {
      id: 'admin-1',
      email: 'admin@masstock.com',
      role: 'admin',
      name: 'Admin User',
    };

    mockLogin.mockImplementation((email, password) => {
      return Promise.resolve({
        data: { user: adminUser, access_token: 'token123' },
      });
    });

    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Act - Fill in the form and submit
    const emailInputs = screen.getAllByPlaceholderText('your@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('Your password');

    const emailInput = emailInputs[0];
    const passwordInput = passwordInputs[0];

    await user.clear(emailInput);
    await user.type(emailInput, 'admin@masstock.com');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123');

    // Get the button and click it
    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@masstock.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('should redirect to /dashboard if user.role === "user" after login', async () => {
    // Arrange
    const clientUser = {
      id: 'client-1',
      email: 'client@masstock.com',
      role: 'user',
      name: 'Client User',
    };

    mockLogin.mockImplementation((email, password) => {
      return Promise.resolve({
        data: { user: clientUser, access_token: 'token123' },
      });
    });

    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Act - Fill in the form and submit
    const emailInputs = screen.getAllByPlaceholderText('your@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('Your password');

    const emailInput = emailInputs[0];
    const passwordInput = passwordInputs[0];

    await user.clear(emailInput);
    await user.type(emailInput, 'client@masstock.com');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123');

    // Get the button and click it
    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('client@masstock.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should not redirect if login fails', async () => {
    // Arrange
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Act
    const emailInputs = screen.getAllByPlaceholderText('your@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('Your password');

    const emailInput = emailInputs[0];
    const passwordInput = passwordInputs[0];

    await user.clear(emailInput);
    await user.type(emailInput, 'admin@masstock.com');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'wrongpassword');

    // Get the button and click it
    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    // Assert - Navigation should not be called on error
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('should handle network errors properly', async () => {
    // Arrange
    mockLogin.mockRejectedValue(new Error('Network error'));

    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // Act
    const emailInputs = screen.getAllByPlaceholderText('your@email.com');
    const passwordInputs = screen.getAllByPlaceholderText('Your password');

    const emailInput = emailInputs[0];
    const passwordInput = passwordInputs[0];

    await user.clear(emailInput);
    await user.type(emailInput, 'admin@masstock.com');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123');

    // Get the button and click it
    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
