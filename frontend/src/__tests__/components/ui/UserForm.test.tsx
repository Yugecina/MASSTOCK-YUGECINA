/**
 * Tests unitaires pour le composant UserForm
 * @file UserForm.test.jsx
 *
 * Tests pour le formulaire de création/édition d'utilisateur
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserForm } from '../../../components/admin/UserForm';

describe('UserForm Component', () => {
  const mockHandlers = {
    onSubmit: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mode création', () => {
    it('devrait afficher un formulaire vide', () => {
      render(<UserForm mode="create" {...mockHandlers} />);

      expect(screen.getByLabelText(/email/i)).toHaveValue('');
      expect(screen.getByLabelText(/name/i)).toHaveValue('');
      expect(screen.getByLabelText(/company/i)).toHaveValue('');
      expect(screen.getByLabelText(/password/i)).toHaveValue('');
    });

    it('devrait afficher le bouton "Create User"', () => {
      render(<UserForm mode="create" {...mockHandlers} />);

      expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
    });

    it('devrait valider l\'email', async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" {...mockHandlers} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it('devrait valider le mot de passe minimum 8 caractères', async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" {...mockHandlers} />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'short');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('devrait valider les champs requis', async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" {...mockHandlers} />);

      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
      expect(mockHandlers.onSubmit).not.toHaveBeenCalled();
    });

    it('devrait soumettre avec les données correctes', async () => {
      const user = userEvent.setup();
      mockHandlers.onSubmit.mockResolvedValue({});
      render(<UserForm mode="create" {...mockHandlers} />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/name/i), 'Test User');
      await user.type(screen.getByLabelText(/company/i), 'Test Company');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.selectOptions(screen.getByLabelText(/plan/i), 'pro');

      await user.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            name: 'Test User',
            company_name: 'Test Company',
            password: 'password123',
            plan: 'pro'
          })
        );
      });
    });
  });

  describe('Mode édition', () => {
    const existingUser = {
      id: '123',
      email: 'existing@example.com',
      name: 'Existing User',
      company_name: 'Existing Company',
      plan: 'pro',
      status: 'active'
    };

    it('devrait afficher les données existantes', () => {
      render(<UserForm mode="edit" user={existingUser} {...mockHandlers} />);

      expect(screen.getByLabelText(/email/i)).toHaveValue('existing@example.com');
      expect(screen.getByLabelText(/name/i)).toHaveValue('Existing User');
      expect(screen.getByLabelText(/company/i)).toHaveValue('Existing Company');
      expect(screen.getByLabelText(/plan/i)).toHaveValue('pro');
      expect(screen.getByLabelText(/status/i)).toHaveValue('active');
    });

    it('devrait afficher le bouton "Update User"', () => {
      render(<UserForm mode="edit" user={existingUser} {...mockHandlers} />);

      expect(screen.getByRole('button', { name: /update user/i })).toBeInTheDocument();
    });

    it('devrait rendre le mot de passe optionnel en mode édition', async () => {
      const user = userEvent.setup();
      mockHandlers.onSubmit.mockResolvedValue({});
      render(<UserForm mode="edit" user={existingUser} {...mockHandlers} />);

      await user.type(screen.getByLabelText(/name/i), ' Updated');
      await user.click(screen.getByRole('button', { name: /update user/i }));

      await waitFor(() => {
        expect(mockHandlers.onSubmit).toHaveBeenCalled();
      });
    });

    it('devrait afficher le champ status en mode édition', () => {
      render(<UserForm mode="edit" user={existingUser} {...mockHandlers} />);

      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('ne devrait pas afficher le champ status en mode création', () => {
      render(<UserForm mode="create" {...mockHandlers} />);

      expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('devrait appeler onCancel quand on clique sur Cancel', async () => {
      const user = userEvent.setup();
      render(<UserForm mode="create" {...mockHandlers} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(mockHandlers.onCancel).toHaveBeenCalledTimes(1);
    });

    it('devrait afficher un spinner pendant la soumission', async () => {
      const user = userEvent.setup();
      mockHandlers.onSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<UserForm mode="create" {...mockHandlers} />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/name/i), 'Test User');
      await user.type(screen.getByLabelText(/company/i), 'Test Company');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create user/i }));

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('devrait désactiver les boutons pendant la soumission', async () => {
      const user = userEvent.setup();
      mockHandlers.onSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<UserForm mode="create" {...mockHandlers} />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/name/i), 'Test User');
      await user.type(screen.getByLabelText(/company/i), 'Test Company');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create user/i }));

      expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
    });

    it('devrait afficher les erreurs API', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Email already exists';
      mockHandlers.onSubmit.mockRejectedValue(new Error(errorMessage));
      render(<UserForm mode="create" {...mockHandlers} />);

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/name/i), 'Test User');
      await user.type(screen.getByLabelText(/company/i), 'Test Company');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create user/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Champs du formulaire', () => {
    it('devrait avoir tous les champs requis', () => {
      render(<UserForm mode="create" {...mockHandlers} />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/plan/i)).toBeInTheDocument();
    });

    it('devrait avoir les options de plan correctes', () => {
      render(<UserForm mode="create" {...mockHandlers} />);

      const planSelect = screen.getByLabelText(/plan/i);
      const options = planSelect.querySelectorAll('option');
      const values = Array.from(options).map(opt => opt.value);

      expect(values).toContain('starter');
      expect(values).toContain('pro');
      expect(values).toContain('premium_custom');
    });

    it('devrait avoir les options de statut correctes en mode édition', () => {
      render(<UserForm mode="edit" user={{ status: 'active' }} {...mockHandlers} />);

      const statusSelect = screen.getByLabelText(/status/i);
      const options = statusSelect.querySelectorAll('option');
      const values = Array.from(options).map(opt => opt.value);

      expect(values).toContain('active');
      expect(values).toContain('suspended');
    });
  });
});
