import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { AddClientModal } from '../../components/admin/AddClientModal'
import { EditClientModal } from '../../components/admin/EditClientModal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { adminUserService } from '../../services/adminUserService'
import '../AdminClients.css'

// SVG Icons
const Icons = {
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
  XCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Crown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  ),
  RefreshCw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
  Workflow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="8" x="3" y="3" rx="2" />
      <path d="M7 11v4a2 2 0 0 0 2 2h4" />
      <rect width="8" height="8" x="13" y="13" rx="2" />
    </svg>
  ),
  Play: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  DollarSign: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

// Loading Spinner
function LoadingSpinner() {
  return (
    <div className="admin-users-loading">
      <div className="admin-users-loading-spinner" />
      <p>Chargement des clients...</p>
    </div>
  )
}

/**
 * AdminClients - Premium Client Management Page
 * Dark Premium Design with Bleu Pétrole accent
 */
export function AdminClients() {
  const navigate = useNavigate()

  // State
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [activeStatFilter, setActiveStatFilter] = useState(null)

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [suspendingClient, setSuspendingClient] = useState(null)
  const [deletingClient, setDeletingClient] = useState(null)

  // Load clients
  const loadClients = useCallback(async () => {
    console.log('🏢 AdminClients: Loading clients...')
    try {
      const response = await adminUserService.getClients()
      console.log('✅ AdminClients: Response received', {
        data: response.data,
        count: response.data?.clients?.length
      })
      setClients(response.data?.clients || [])
    } catch (err) {
      console.error('❌ AdminClients: Failed to fetch clients', {
        error: err,
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      })
      toast.error('Échec du chargement des clients')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  // Stats calculation
  const stats = useMemo(() => {
    const total = clients.length
    const active = clients.filter(c => c.status === 'active').length
    const suspended = clients.filter(c => c.status === 'suspended').length
    const pending = clients.filter(c => c.status === 'pending').length
    const totalRevenue = clients.reduce((sum, c) => sum + (c.subscription_amount || 0), 0)
    return { total, active, suspended, pending, totalRevenue }
  }, [clients])

  // Filtered clients
  const filteredClients = useMemo(() => {
    let result = [...clients]

    // Apply stat filter
    if (activeStatFilter === 'active') {
      result = result.filter(c => c.status === 'active')
    } else if (activeStatFilter === 'suspended') {
      result = result.filter(c => c.status === 'suspended')
    } else if (activeStatFilter === 'pending') {
      result = result.filter(c => c.status === 'pending')
    }

    // Apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c =>
        c.company_name?.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      )
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter(c => c.status === statusFilter)
    }

    // Apply plan filter
    if (planFilter) {
      result = result.filter(c => c.plan === planFilter)
    }

    return result
  }, [clients, searchQuery, statusFilter, planFilter, activeStatFilter])

  // Handlers
  const handleStatClick = (stat) => {
    if (activeStatFilter === stat) {
      setActiveStatFilter(null)
    } else {
      setActiveStatFilter(stat)
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setPlanFilter('')
    setActiveStatFilter(null)
  }

  const handleSuspendConfirm = async () => {
    if (!suspendingClient) return

    console.log('🚫 AdminClients: Suspending client', { clientId: suspendingClient.id })
    try {
      await adminUserService.updateUser(suspendingClient.id, { status: 'suspended' })
      toast.success(`${suspendingClient.company_name || suspendingClient.name} a été suspendu`)
      loadClients()
    } catch (err) {
      console.error('❌ AdminClients: Suspend failed', err)
      toast.error('Échec de la suspension du client')
    } finally {
      setSuspendingClient(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingClient) return

    console.log('🗑️ AdminClients: Deleting client', { clientId: deletingClient.id })
    try {
      await adminUserService.deleteUser(deletingClient.id)
      toast.success(`${deletingClient.company_name || deletingClient.name} a été supprimé`)
      loadClients()
    } catch (err) {
      console.error('❌ AdminClients: Delete failed', err)
      toast.error('Échec de la suppression du client')
    } finally {
      setDeletingClient(null)
    }
  }

  const handleAddSuccess = () => {
    console.log('✅ AdminClients: Client added, refreshing')
    loadClients()
  }

  const handleEditSuccess = () => {
    console.log('✅ AdminClients: Client updated, refreshing')
    loadClients()
  }

  // Helper functions
  const getPlanLabel = (plan) => {
    switch (plan) {
      case 'starter': return 'Starter'
      case 'pro': return 'Pro'
      case 'premium_custom': return 'Premium'
      default: return plan || '-'
    }
  }

  const getPlanBadgeClass = (plan) => {
    switch (plan) {
      case 'starter': return 'admin-client-card-badge--starter'
      case 'pro': return 'admin-client-card-badge--pro'
      case 'premium_custom': return 'admin-client-card-badge--premium'
      default: return ''
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'admin-client-card-badge--active'
      case 'suspended': return 'admin-client-card-badge--suspended'
      case 'pending': return 'admin-client-card-badge--pending'
      default: return ''
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'suspended': return 'Suspendu'
      case 'pending': return 'En attente'
      default: return status
    }
  }

  const getInitials = (name, company) => {
    const str = company || name || 'C'
    return str.substring(0, 2).toUpperCase()
  }

  const hasActiveFilters = searchQuery || statusFilter || planFilter || activeStatFilter

  return (
    <AdminLayout>
      <div className="admin-clients-page">
        {/* Header */}
        <header className="admin-clients-header">
          <div className="admin-clients-header-content">
            <h1 className="admin-clients-title">Gestion des Clients</h1>
            <p className="admin-clients-subtitle">
              Gérez les comptes clients, leurs abonnements et accès
            </p>
          </div>
          <div className="admin-clients-actions">
            <button
              className="btn btn-secondary"
              onClick={loadClients}
              disabled={loading}
              title="Rafraîchir"
            >
              <Icons.RefreshCw />
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Icons.Plus />
              Nouveau Client
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <div className="admin-clients-stats">
          <button
            className={`admin-clients-stat ${activeStatFilter === null ? 'active' : ''}`}
            onClick={() => handleStatClick(null)}
          >
            <div className="admin-clients-stat-icon">
              <Icons.Building />
            </div>
            <div className="admin-clients-stat-content">
              <span className="admin-clients-stat-value">{stats.total}</span>
              <span className="admin-clients-stat-label">Total</span>
            </div>
          </button>

          <button
            className={`admin-clients-stat ${activeStatFilter === 'active' ? 'active' : ''}`}
            onClick={() => handleStatClick('active')}
          >
            <div className="admin-clients-stat-icon">
              <Icons.CheckCircle />
            </div>
            <div className="admin-clients-stat-content">
              <span className="admin-clients-stat-value">{stats.active}</span>
              <span className="admin-clients-stat-label">Actifs</span>
            </div>
          </button>

          <button
            className={`admin-clients-stat ${activeStatFilter === 'suspended' ? 'active' : ''}`}
            onClick={() => handleStatClick('suspended')}
          >
            <div className="admin-clients-stat-icon">
              <Icons.XCircle />
            </div>
            <div className="admin-clients-stat-content">
              <span className="admin-clients-stat-value">{stats.suspended}</span>
              <span className="admin-clients-stat-label">Suspendus</span>
            </div>
          </button>

          <button
            className={`admin-clients-stat ${activeStatFilter === 'pending' ? 'active' : ''}`}
            onClick={() => handleStatClick('pending')}
          >
            <div className="admin-clients-stat-icon">
              <Icons.Clock />
            </div>
            <div className="admin-clients-stat-content">
              <span className="admin-clients-stat-value">{stats.pending}</span>
              <span className="admin-clients-stat-label">En attente</span>
            </div>
          </button>

          <div className="admin-clients-stat">
            <div className="admin-clients-stat-icon">
              <Icons.DollarSign />
            </div>
            <div className="admin-clients-stat-content">
              <span className="admin-clients-stat-value">${stats.totalRevenue.toLocaleString()}</span>
              <span className="admin-clients-stat-label">Revenu mensuel</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-clients-filters">
          <div className="admin-clients-filters-row">
            <div className="admin-clients-search">
              <span className="admin-clients-search-icon">
                <Icons.Search />
              </span>
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="admin-clients-filter-group">
              <label className="admin-clients-filter-label">Statut</label>
              <select
                className="admin-clients-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="active">Actif</option>
                <option value="pending">En attente</option>
                <option value="suspended">Suspendu</option>
              </select>
            </div>

            <div className="admin-clients-filter-group">
              <label className="admin-clients-filter-label">Plan</label>
              <select
                className="admin-clients-filter-select"
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="premium_custom">Premium</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                className="admin-clients-filter-clear"
                onClick={handleClearFilters}
              >
                Effacer les filtres
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner />
        ) : filteredClients.length === 0 ? (
          <div className="admin-clients-empty">
            <div className="admin-clients-empty-icon">
              <Icons.Building />
            </div>
            <h3 className="admin-clients-empty-title">
              {hasActiveFilters ? 'Aucun résultat' : 'Aucun client'}
            </h3>
            <p className="admin-clients-empty-text">
              {hasActiveFilters
                ? 'Aucun client ne correspond à vos filtres. Essayez de modifier vos critères de recherche.'
                : 'Ajoutez votre premier client pour commencer à gérer vos comptes.'}
            </p>
            {!hasActiveFilters && (
              <button
                className="admin-clients-empty-btn"
                onClick={() => setShowAddModal(true)}
              >
                <Icons.Plus />
                Ajouter un client
              </button>
            )}
          </div>
        ) : (
          <div className="admin-clients-grid">
            {filteredClients.map((client) => (
              <article key={client.id} className="admin-client-card-premium">
                {/* Header */}
                <div className="admin-client-card-header">
                  <div className="admin-client-card-info">
                    <h3 className="admin-client-card-name">
                      {client.company_name || client.name}
                    </h3>
                    <p className="admin-client-card-email">{client.email}</p>
                  </div>
                  <div className="admin-client-card-badges">
                    <span className={`admin-client-card-badge ${getStatusBadgeClass(client.status)}`}>
                      {getStatusLabel(client.status)}
                    </span>
                    <span className={`admin-client-card-badge ${getPlanBadgeClass(client.plan)}`}>
                      <Icons.Crown />
                      {getPlanLabel(client.plan)}
                    </span>
                  </div>
                </div>

                {/* Plan & Subscription */}
                {client.subscription_amount > 0 && (
                  <div className="admin-client-card-plan">
                    <div className="admin-client-card-plan-icon">
                      <Icons.DollarSign />
                    </div>
                    <div className="admin-client-card-plan-info">
                      <p className="admin-client-card-plan-name">Abonnement mensuel</p>
                      <p className="admin-client-card-plan-price">
                        ${client.subscription_amount.toLocaleString()}/mois
                      </p>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="admin-client-card-stats">
                  <div className="admin-client-card-stat">
                    <span className="admin-client-card-stat-value">
                      {client.users_count || 0}
                    </span>
                    <span className="admin-client-card-stat-label">Membres</span>
                  </div>
                  <div className="admin-client-card-stat">
                    <span className="admin-client-card-stat-value">
                      {client.workflows_count || 0}
                    </span>
                    <span className="admin-client-card-stat-label">Workflows</span>
                  </div>
                  <div className="admin-client-card-stat">
                    <span className="admin-client-card-stat-value">
                      {client.executions_count || 0}
                    </span>
                    <span className="admin-client-card-stat-label">Exécutions</span>
                  </div>
                </div>

                {/* Owner */}
                {client.owner && (
                  <div className="admin-client-card-owner">
                    <div className="admin-client-card-owner-avatar">
                      {getInitials(client.owner.name, null)}
                    </div>
                    <div className="admin-client-card-owner-info">
                      <p className="admin-client-card-owner-label">Propriétaire</p>
                      <p className="admin-client-card-owner-email">{client.owner.email}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="admin-client-card-actions">
                  <button
                    className="admin-client-card-btn admin-client-card-btn--primary"
                    onClick={() => navigate(`/admin/clients/${client.id}`)}
                  >
                    <Icons.Eye />
                    Détails
                  </button>
                  <button
                    className="admin-client-card-btn admin-client-card-btn--secondary"
                    onClick={() => setEditingClient(client)}
                  >
                    <Icons.Edit />
                    Modifier
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Suspend Confirmation Dialog */}
      {suspendingClient && (
        <ConfirmDialog
          type="warning"
          title="Suspendre ce client ?"
          message={`Êtes-vous sûr de vouloir suspendre "${suspendingClient.company_name || suspendingClient.name}" ? Cette action désactivera temporairement leur accès.`}
          confirmLabel="Suspendre"
          cancelLabel="Annuler"
          onConfirm={handleSuspendConfirm}
          onCancel={() => setSuspendingClient(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingClient && (
        <ConfirmDialog
          type="danger"
          title="Supprimer ce client ?"
          message={`Êtes-vous sûr de vouloir supprimer "${deletingClient.company_name || deletingClient.name}" ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingClient(null)}
        />
      )}
    </AdminLayout>
  )
}
