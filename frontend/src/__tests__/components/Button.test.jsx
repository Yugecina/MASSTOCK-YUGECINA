/**
 * Tests unitaires pour le composant Button
 * @file Button.test.jsx
 *
 * Exemple de test pour un composant React simple.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// NOTE: Ce fichier est un exemple de structure de test pour un composant Button.
// Ajustez l'import selon votre composant réel.

// Composant Button exemple (à remplacer par votre vrai composant)
function Button({ children, onClick, disabled = false, variant = 'primary' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
      data-testid="button"
    >
      {children}
    </button>
  );
}

describe('Button Component', () => {
  it('devrait afficher le texte du bouton', () => {
    // Arrange & Act
    render(<Button>Click me</Button>);

    // Assert
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('devrait appeler onClick quand on clique', async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={handleClick}>Click me</Button>);

    // Act
    await user.click(screen.getByTestId('button'));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('devrait être désactivé quand disabled=true', () => {
    // Arrange & Act
    render(<Button disabled>Click me</Button>);

    // Assert
    const button = screen.getByTestId('button');
    expect(button).toBeDisabled();
  });

  it('devrait ne pas appeler onClick quand désactivé', async () => {
    // Arrange
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    );

    // Act
    await user.click(screen.getByTestId('button'));

    // Assert
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('devrait appliquer la classe variant correcte', () => {
    // Arrange & Act
    render(<Button variant="secondary">Click me</Button>);

    // Assert
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('btn-secondary');
  });

  it('devrait avoir la variante primary par défaut', () => {
    // Arrange & Act
    render(<Button>Click me</Button>);

    // Assert
    const button = screen.getByTestId('button');
    expect(button).toHaveClass('btn-primary');
  });
});

/**
 * BONNES PRATIQUES POUR LES TESTS DE COMPOSANTS
 *
 * 1. Utiliser screen.getByRole quand possible (meilleur pour l'accessibilité)
 *    screen.getByRole('button', { name: 'Submit' })
 *
 * 2. Utiliser data-testid pour les éléments sans rôle sémantique
 *    <div data-testid="card">...</div>
 *    screen.getByTestId('card')
 *
 * 3. Utiliser userEvent au lieu de fireEvent
 *    userEvent simule mieux les vraies interactions utilisateur
 *
 * 4. Nettoyer les timers et mocks
 *    beforeEach(() => { vi.clearAllMocks(); })
 *
 * 5. Tester le comportement, pas l'implémentation
 *    Testez ce que l'utilisateur voit et fait, pas les détails internes
 */
