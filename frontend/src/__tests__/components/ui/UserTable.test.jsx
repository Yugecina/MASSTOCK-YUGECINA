/**
 * Tests unitaires pour le composant UserTable
 * @file UserTable.test.jsx
 *
 * Tests pour le tableau d'affichage des utilisateurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserTable } from '../../../components/admin/UserTable';

describe('UserTable Component', () => {
  const mockUsers = [
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
  ];

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onBlock: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher le tableau avec les données utilisateur', () => {
    // Arrange & Act
    render(<UserTable users={mockUsers} {...mockHandlers} />);

    // Assert
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('Company One')).toBeInTheDocument();
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    expect(screen.getByText('Company Two')).toBeInTheDocument();
  });

  it('devrait afficher les badges de statut avec les bonnes classes', () => {
    // Arrange & Act
    render(<UserTable users={mockUsers} {...mockHandlers} />);

    // Assert
    const badges = screen.getAllByTestId(/status-badge/);
    expect(badges[0]).toHaveClass('badge-success'); // active
    expect(badges[1]).toHaveClass('badge-warning'); // suspended
  });

  it('devrait afficher les badges de plan', () => {
    // Arrange & Act
    render(<UserTable users={mockUsers} {...mockHandlers} />);

    // Assert
    expect(screen.getByText('pro')).toBeInTheDocument();
    expect(screen.getByText('starter')).toBeInTheDocument();
  });

  it('devrait afficher les IDs courts (8 premiers caractères)', () => {
    // Arrange & Act
    render(<UserTable users={mockUsers} {...mockHandlers} />);

    // Assert
    expect(screen.getByText('123e4567')).toBeInTheDocument();
    expect(screen.getByText('223e4567')).toBeInTheDocument();
  });

  it('devrait afficher les dates formatées', () => {
    // Arrange & Act
    render(<UserTable users={mockUsers} {...mockHandlers} />);

    // Assert
    // Les dates doivent être formatées (pas le format ISO brut)
    expect(screen.queryByText('2024-01-15T10:00:00Z')).not.toBeInTheDocument();
  });

  it('devrait appeler onEdit quand on clique sur Edit', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<UserTable users={mockUsers} {...mockHandlers} />);

    // Act
    const editButtons = screen.getAllByTestId(/edit-button/);
    await user.click(editButtons[0]);

    // Assert
    expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('devrait appeler onDelete quand on clique sur Delete', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<UserTable users={mockUsers} {...mockHandlers} />);

    // Act
    const deleteButtons = screen.getAllByTestId(/delete-button/);
    await user.click(deleteButtons[0]);

    // Assert
    expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('devrait appeler onBlock quand on clique sur Block/Unblock', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<UserTable users={mockUsers} {...mockHandlers} />);

    // Act
    const blockButtons = screen.getAllByTestId(/block-button/);
    await user.click(blockButtons[0]);

    // Assert
    expect(mockHandlers.onBlock).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onBlock).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('devrait afficher "Block" pour utilisateur actif', () => {
    // Arrange & Act
    render(<UserTable users={[mockUsers[0]]} {...mockHandlers} />);

    // Assert
    expect(screen.getByText('Block')).toBeInTheDocument();
  });

  it('devrait afficher "Unblock" pour utilisateur suspendu', () => {
    // Arrange & Act
    render(<UserTable users={[mockUsers[1]]} {...mockHandlers} />);

    // Assert
    expect(screen.getByText('Unblock')).toBeInTheDocument();
  });

  it('devrait afficher un message quand il n\'y a pas de données', () => {
    // Arrange & Act
    render(<UserTable users={[]} {...mockHandlers} />);

    // Assert
    expect(screen.getByText(/no users found/i)).toBeInTheDocument();
  });

  it('devrait afficher un état de chargement', () => {
    // Arrange & Act
    render(<UserTable users={[]} loading={true} {...mockHandlers} />);

    // Assert
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('devrait afficher les en-têtes de colonnes', () => {
    // Arrange & Act
    render(<UserTable users={mockUsers} {...mockHandlers} />);

    // Assert
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
