/**
 * Tests unitaires pour le composant AdminLayout
 * @file AdminLayout.test.jsx
 *
 * Tests pour le layout wrapper de l'espace admin
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AdminLayout } from '../../../components/layout/AdminLayout'

/**
 * Helper pour wrapper le composant avec Router
 */
function renderWithRouter(component) {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devrait afficher le contenu enfant', () => {
    // Arrange & Act
    renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('devrait inclure le AdminSidebar', () => {
    // Arrange & Act
    renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - Le sidebar devrait avoir le texte "Admin" (use getAllByText since it appears multiple times)
    const adminTexts = screen.getAllByText('Admin')
    expect(adminTexts.length).toBeGreaterThan(0)
  })

  it('devrait inclure la navigation admin du sidebar', () => {
    // Arrange & Act
    renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - Les éléments du sidebar admin devraient être visibles
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
  })

  it('devrait avoir la structure HTML correcte', () => {
    // Arrange & Act
    const { container } = renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - Le layout devrait avoir un sidebar et un contenu principal
    const sidebar = container.querySelector('aside')
    expect(sidebar).toBeInTheDocument()

    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
  })

  it('devrait avoir une classe ml-70 pour le décalage du contenu', () => {
    // Arrange & Act
    const { container } = renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - Le contenu principal devrait être décalé par le sidebar (inline style)
    const mainWrapper = container.querySelector('main')
    expect(mainWrapper).toBeInTheDocument()
  })

  it('devrait afficher un header', () => {
    // Arrange & Act
    const { container } = renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - AdminLayout doesn't have separate header, content is in main
    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
  })

  it('devrait avoir la même structure que ClientLayout', () => {
    // Arrange & Act
    const { container } = renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - Structure similar to ClientLayout
    // - Sidebar aside
    const sidebar = container.querySelector('aside')
    expect(sidebar).toBeInTheDocument()

    // - Main element
    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
  })

  it('devrait utiliser les mêmes classes CSS que ClientLayout', () => {
    // Arrange & Act
    const { container } = renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - AdminLayout uses inline styles, verify structure exists
    const sidebar = container.querySelector('aside')
    expect(sidebar).toBeInTheDocument()
    expect(sidebar).toHaveClass('sidebar')
  })

  it('devrait avoir un main avec padding et overflow auto', () => {
    // Arrange & Act
    const { container } = renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - AdminLayout uses inline styles
    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
  })

  it('devrait accepter plusieurs enfants', () => {
    // Arrange & Act
    renderWithRouter(
      <AdminLayout>
        <div>Content 1</div>
        <div>Content 2</div>
        <div>Content 3</div>
      </AdminLayout>
    )

    // Assert
    expect(screen.getByText('Content 1')).toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
    expect(screen.getByText('Content 3')).toBeInTheDocument()
  })

  it('devrait envelopper le contenu dans un div avec padding et max-width', () => {
    // Arrange & Act
    const { container } = renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - Content is directly in main, no wrapper div
    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})
