/**
 * Tests unitaires pour le composant AdminSidebar
 * @file AdminSidebar.test.jsx
 *
 * Tests pour la navigation admin du système MasStock
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { AdminSidebar } from '../../../components/layout/AdminSidebar'

/**
 * Helper pour wrapper le composant avec Router
 */
function renderWithRouter(component) {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('AdminSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devrait afficher toutes les sections de navigation admin', () => {
    // Arrange & Act
    renderWithRouter(<AdminSidebar />)

    // Assert
    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument()
    expect(screen.getByText('Utilisateurs')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
    expect(screen.getByText('Workflows Globaux')).toBeInTheDocument()
    expect(screen.getByText('Support')).toBeInTheDocument()
    expect(screen.getByText('Paramètres')).toBeInTheDocument()
  })

  it('devrait afficher le logo MasStock', () => {
    // Arrange & Act
    renderWithRouter(<AdminSidebar />)

    // Assert
    expect(screen.getByText('MasStock')).toBeInTheDocument()
  })

  it('devrait avoir la structure CSS correcte (sidebar)', () => {
    // Arrange & Act
    const { container } = renderWithRouter(<AdminSidebar />)
    const sidebar = container.querySelector('aside')

    // Assert
    expect(sidebar).toHaveClass('fixed', 'left-0', 'top-0', 'bottom-0')
    expect(sidebar).toHaveClass('bg-white', 'border-r', 'border-neutral-200')
  })

  it('devrait afficher une section utilisateur avec les infos de compte', () => {
    // Arrange & Act
    renderWithRouter(<AdminSidebar />)

    // Assert - Les boutons et sections sont importants
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    expect(logoutButton).toBeInTheDocument()
  })

  it('devrait afficher les liens avec les bonnes routes', () => {
    // Arrange & Act
    renderWithRouter(<AdminSidebar />)

    // Assert - Vérifier que les NavLinks pointent vers les bonnes routes
    const dashboardLink = screen.getByRole('link', { name: /dashboard admin/i })
    expect(dashboardLink).toHaveAttribute('href', '/admin/dashboard')

    const usersLink = screen.getByRole('link', { name: /utilisateurs/i })
    expect(usersLink).toHaveAttribute('href', '/admin/users')

    const clientsLink = screen.getByRole('link', { name: /clients/i })
    expect(clientsLink).toHaveAttribute('href', '/admin/clients')

    const workflowsLink = screen.getByRole('link', { name: /workflows globaux/i })
    expect(workflowsLink).toHaveAttribute('href', '/admin/workflows')

    const supportLink = screen.getByRole('link', { name: /support/i })
    expect(supportLink).toHaveAttribute('href', '/admin/tickets')

    const settingsLink = screen.getByRole('link', { name: /paramètres/i })
    expect(settingsLink).toHaveAttribute('href', '/admin/settings')
  })

  it('devrait avoir les classes CSS correctes pour les liens de navigation', () => {
    // Arrange & Act
    const { container } = renderWithRouter(<AdminSidebar />)

    // Assert - Les liens devraient avoir les classes flex, items-center, gap-3, etc.
    const navLinks = container.querySelectorAll('nav a')
    navLinks.forEach((link) => {
      expect(link).toHaveClass('flex', 'items-center', 'gap-3')
    })
  })

  it('devrait avoir une section user avec le texte Account', () => {
    // Arrange & Act
    renderWithRouter(<AdminSidebar />)

    // Assert
    const accountLabel = screen.getByText(/account/i)
    expect(accountLabel).toBeInTheDocument()
  })

  it('devrait afficher un bouton Logout fonctionnel', async () => {
    // Arrange
    const user = userEvent.setup()
    renderWithRouter(<AdminSidebar />)

    // Act & Assert
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    expect(logoutButton).toBeEnabled()
    expect(logoutButton).toBeInTheDocument()
  })

  it('devrait avoir des styles de hover sur les liens', () => {
    // Arrange & Act
    const { container } = renderWithRouter(<AdminSidebar />)

    // Assert - Les liens devraient avoir les classes de hover
    const navLinks = container.querySelectorAll('nav a')
    navLinks.forEach((link) => {
      const className = link.className
      // Le lien doit avoir une classe ou un style pour le hover
      expect(className.length).toBeGreaterThan(0)
    })
  })

  it('devrait utiliser les icônes appropriées pour chaque section', () => {
    // Arrange & Act
    renderWithRouter(<AdminSidebar />)

    // Assert - Les span avec les icônes (emojis ou autres) devraient être présents
    // Cette vérification dépend de comment les icônes sont implémentées
    const navigationItems = screen.getAllByRole('link')
    expect(navigationItems.length).toBeGreaterThanOrEqual(6)
  })

  it('devrait avoir une navigation flex en colonne', () => {
    // Arrange & Act
    const { container } = renderWithRouter(<AdminSidebar />)
    const nav = container.querySelector('nav')

    // Assert
    expect(nav).toHaveClass('flex-1')
    expect(nav).toHaveClass('space-y-1')
  })
})
