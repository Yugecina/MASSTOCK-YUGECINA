/**
 * Tests unitaires pour la page AdminUsers
 * @file AdminUsers.test.jsx
 *
 * Tests pour la page principale de gestion des utilisateurs admin
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminUsers } from '../../pages/admin/AdminUsers';
import { adminResourceService } from '../../services/adminResourceService';

// Mock du service
vi.mock('../../services/adminResourceService');

// Mock du composant toast (react-hot-toast)
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('AdminUsers Page', () => {
  const mockUsersData = {
    clients: [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user1@example.com',
        company_name: 'Company One',
        subscription_plan: 'pro',
        status: 'active',
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        email: 'user2@example.com',
        company_name: 'Company Two',
        subscription_plan: 'starter',
        status: 'suspended',
        created_at: '2024-01-10T10:00:00Z'
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    adminResourceService.getUsers.mockResolvedValue(mockUsersData);
  });

  it('devrait afficher la page sans crash', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument();
    });
  });

  it('devrait charger et afficher la liste des utilisateurs', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });
  });

  it('devrait afficher le bouton "Create User"', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByTestId('create-user-button')).toBeInTheDocument();
    });
  });

  it('devrait ouvrir le modal UserForm au clic sur "Create User"', async () => {
    const user = userEvent.setup();
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByTestId('create-user-button')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('create-user-button'));

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  describe('Recherche et filtres', () => {
    it('devrait afficher une barre de recherche', async () => {
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });
    });

    it('devrait rechercher par email/company', async () => {
      const user = userEvent.setup();
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });
      await user.type(screen.getByPlaceholderText(/search/i), 'user1');

      await waitFor(() => {
        expect(adminResourceService.getUsers).toHaveBeenCalledWith(
          1,
          expect.objectContaining({ search: 'user1' })
        );
      });
    });

    it('devrait avoir un filtre de statut', async () => {
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      });
    });

    it('devrait filtrer par statut', async () => {
      const user = userEvent.setup();
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      });
      await user.selectOptions(screen.getByLabelText(/status/i), 'active');

      await waitFor(() => {
        expect(adminResourceService.getUsers).toHaveBeenCalledWith(
          1,
          expect.objectContaining({ status: 'active' })
        );
      });
    });

    it('devrait avoir un filtre de plan', async () => {
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plan/i)).toBeInTheDocument();
      });
    });

    it('devrait filtrer par plan', async () => {
      const user = userEvent.setup();
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plan/i)).toBeInTheDocument();
      });
      await user.selectOptions(screen.getByLabelText(/plan/i), 'pro');

      await waitFor(() => {
        expect(adminResourceService.getUsers).toHaveBeenCalledWith(
          1,
          expect.objectContaining({ plan: 'pro' })
        );
      });
    });
  });

  describe('Actions utilisateur', () => {
    it('devrait ouvrir le modal d\'édition au clic sur Edit', async () => {
      const user = userEvent.setup();
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getAllByTestId(/edit-button/)[0]).toBeInTheDocument();
      });
      await user.click(screen.getAllByTestId(/edit-button/)[0]);

      expect(screen.getByLabelText(/email/i)).toHaveValue('user1@example.com');
    });

    it('devrait afficher le modal de confirmation au clic sur Delete', async () => {
      const user = userEvent.setup();
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getAllByTestId(/delete-button/)[0]).toBeInTheDocument();
      });
      await user.click(screen.getAllByTestId(/delete-button/)[0]);

      expect(screen.getByText(/confirm delete/i)).toBeInTheDocument();
    });

    it('devrait bloquer un utilisateur au clic sur Block', async () => {
      const user = userEvent.setup();
      adminResourceService.blockUser.mockResolvedValue({});
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getAllByTestId(/block-button/)[0]).toBeInTheDocument();
      });
      await user.click(screen.getAllByTestId(/block-button/)[0]);

      await waitFor(() => {
        expect(adminResourceService.blockUser).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      });
    });

    it('devrait débloquer un utilisateur au clic sur Unblock', async () => {
      const user = userEvent.setup();
      adminResourceService.unblockUser.mockResolvedValue({});
      render(<AdminUsers />);

      await waitFor(() => {
        const unblockButton = screen.getAllByTestId(/block-button/)[1];
        expect(unblockButton).toBeInTheDocument();
      });
      await user.click(screen.getAllByTestId(/block-button/)[1]);

      await waitFor(() => {
        expect(adminResourceService.unblockUser).toHaveBeenCalledWith('223e4567-e89b-12d3-a456-426614174001');
      });
    });
  });

  describe('Pagination', () => {
    it('devrait afficher les informations de pagination', async () => {
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
      });
    });

    it('devrait avoir des boutons Previous et Next', async () => {
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });

    it('devrait désactiver Previous sur la première page', async () => {
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
      });
    });

    it('devrait charger la page suivante au clic sur Next', async () => {
      const user = userEvent.setup();
      const multiPageData = {
        ...mockUsersData,
        pagination: { page: 1, limit: 10, total: 20, totalPages: 2 }
      };
      adminResourceService.getUsers.mockResolvedValue(multiPageData);
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
      });
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(adminResourceService.getUsers).toHaveBeenCalledWith(2, expect.any(Object));
      });
    });
  });

  describe('États de chargement et d\'erreur', () => {
    it('devrait afficher un spinner pendant le chargement', () => {
      adminResourceService.getUsers.mockImplementation(() => new Promise(() => {}));

      render(<AdminUsers />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('devrait afficher un message d\'erreur si le chargement échoue', async () => {
      adminResourceService.getUsers.mockRejectedValue(new Error('Failed to load users'));

      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      });
    });

    it('devrait désactiver les boutons pendant les opérations', async () => {
      const user = userEvent.setup();
      adminResourceService.blockUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getAllByTestId(/block-button/)[0]).toBeInTheDocument();
      });
      await user.click(screen.getAllByTestId(/block-button/)[0]);

      expect(screen.getAllByTestId(/block-button/)[0]).toBeDisabled();
    });
  });

  describe('Création d\'utilisateur', () => {
    it('devrait créer un utilisateur et rafraîchir la liste', async () => {
      const user = userEvent.setup();
      adminResourceService.createUser.mockResolvedValue({
        user: { id: '999', email: 'new@example.com' }
      });
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByTestId('create-user-button')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('create-user-button'));

      await user.type(screen.getByLabelText(/email/i), 'new@example.com');
      await user.type(screen.getByLabelText(/name/i), 'New User');
      await user.type(screen.getByLabelText(/company/i), 'New Company');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      const form = screen.getByLabelText(/email/i).closest('form');
      const submitButton = within(form).getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(adminResourceService.createUser).toHaveBeenCalled();
        expect(adminResourceService.getUsers.mock.calls.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('devrait fermer le modal après création réussie', async () => {
      const user = userEvent.setup();
      adminResourceService.createUser.mockResolvedValue({
        user: { id: '999', email: 'new@example.com' }
      });
      render(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByTestId('create-user-button')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('create-user-button'));

      await user.type(screen.getByLabelText(/email/i), 'new@example.com');
      await user.type(screen.getByLabelText(/name/i), 'New User');
      await user.type(screen.getByLabelText(/company/i), 'New Company');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      const form = screen.getByLabelText(/email/i).closest('form');
      const submitButton = within(form).getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      });
    });
  });
});
