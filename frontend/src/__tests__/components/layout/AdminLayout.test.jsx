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

    // Assert - Le sidebar devrait avoir le logo MasStock
    expect(screen.getByText('MasStock')).toBeInTheDocument()
  })

  it('devrait inclure la navigation admin du sidebar', () => {
    // Arrange & Act
    renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - Les éléments du sidebar admin devraient être visibles
    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument()
    expect(screen.getByText('Utilisateurs')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
  })

  it('devrait avoir la structure HTML correcte', () => {
    // Arrange & Act
    const { container } = renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - Structure du layout
    const layoutDiv = container.querySelector('.flex.h-screen')
    expect(layoutDiv).toBeInTheDocument()

    // Le layout devrait avoir un sidebar et un contenu principal
    const sidebar = container.querySelector('aside')
    expect(sidebar).toBeInTheDocument()
  })

  it('devrait avoir une classe ml-70 pour le décalage du contenu', () => {
    // Arrange & Act
    const { container } = renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - Le contenu principal devrait être décalé par le sidebar
    const mainWrapper = container.querySelector('.ml-70')
    expect(mainWrapper).toBeInTheDocument()
  })

  it('devrait afficher un header', () => {
    // Arrange & Act
    const { container } = renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - Le layout devrait avoir un header
    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
  })

  it('devrait avoir la même structure que ClientLayout', () => {
    // Arrange & Act
    const { container } = renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - Structure identique à ClientLayout
    // - Flex container
    const flexContainer = container.querySelector('.flex.h-screen.bg-neutral-50')
    expect(flexContainer).toBeInTheDocument()

    // - Sidebar aside
    const sidebar = container.querySelector('aside.fixed.left-0.top-0.bottom-0')
    expect(sidebar).toBeInTheDocument()

    // - Main content area avec ml-70
    const mainContent = container.querySelector('.ml-70.flex.flex-col')
    expect(mainContent).toBeInTheDocument()

    // - Header
    const header = container.querySelector('header.bg-white')
    expect(header).toBeInTheDocument()

    // - Main element
    const main = container.querySelector('main.flex-1')
    expect(main).toBeInTheDocument()
  })

  it('devrait utiliser les mêmes classes CSS que ClientLayout', () => {
    // Arrange & Act
    const { container } = renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert - Les classes CSS doivent être identiques
    const layout = container.querySelector('.flex')
    expect(layout).toHaveClass('h-screen')
    expect(layout).toHaveClass('bg-neutral-50')

    const header = container.querySelector('header')
    expect(header).toHaveClass('bg-white')
    expect(header).toHaveClass('border-b')
    expect(header).toHaveClass('border-neutral-200')
  })

  it('devrait avoir un main avec padding et overflow auto', () => {
    // Arrange & Act
    const { container } = renderWithRouter(
      <AdminLayout>
        <div>Test Content</div>
      </AdminLayout>
    )

    // Assert
    const main = container.querySelector('main')
    expect(main).toHaveClass('flex-1')
    expect(main).toHaveClass('overflow-auto')
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

    // Assert - Le contenu devrait être dans un wrapper avec padding et max-width
    const contentWrapper = container.querySelector('main > div')
    expect(contentWrapper).toHaveClass('p-8', 'max-w-7xl', 'mx-auto')
  })
})
