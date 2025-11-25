import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminUserService } from '../../services/adminUserService'
import { UserModal } from '../../components/admin/UserModal'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import logger from '@/utils/logger'

// SVG Icons
const Icons = {
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  UserCheck: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  ),
  UserX: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="17" y1="8" x2="22" y2="13" />
      <line x1="22" y1="8" x2="17" y2="13" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
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
  Ban: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
  Crown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  ),
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  ),
  RefreshCw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  )
}

/**
 * AdminUsers - Premium Dark Design with Enhanced UX
 */
export function AdminUsers() {
  // State
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [clientRoleFilter, setClientRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedUser, setSelectedUser] = useState(null)

  // Confirm dialog state
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmUser, setConfirmUser] = useState(null)

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true)
      logger.debug('AdminUsers: Loading users...', { page, searchQuery, roleFilter, statusFilter })

      const response = await adminUserService.getUsers(page, {
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
        client_role: clientRoleFilter,
        limit: 20
      })

      logger.debug('AdminUsers: Response received:', response)
      const data = response.data?.data || response.data || {}
      setUsers(data.users || [])
      setPagination(data.pagination || { total: 0, pages: 1 })
    } catch (error) {
      logger.error('AdminUsers: Failed to load users:', error)
      toast.error('Impossible de charger les utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [page, roleFilter, statusFilter, clientRoleFilter])

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (page === 1) {
        loadUsers()
      } else {
        setPage(1)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  // Stats computation
  const stats = useMemo(() => {
    const total = pagination.total || users.length
    const active = users.filter(u => u.status === 'active').length
    const suspended = users.filter(u => u.status === 'suspended').length
    const admins = users.filter(u => u.role === 'admin').length
    return { total, active, suspended, admins }
  }, [users, pagination.total])

  // Helpers
  const getInitials = (email, name) => {
    if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    if (!email) return '?'
    return email.split('@')[0].slice(0, 2).toUpperCase()
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Actions
  const handleCreateUser = () => {
    setModalMode('create')
    setSelectedUser(null)
    setShowModal(true)
  }

  const handleEditUser = (user) => {
    setModalMode('edit')
    setSelectedUser(user)
    setShowModal(true)
  }

  const handleDeleteUser = (user) => {
    setConfirmUser(user)
    setConfirmAction('delete')
    setShowConfirm(true)
  }

  const handleBlockUser = (user) => {
    setConfirmUser(user)
    setConfirmAction(user.status === 'active' ? 'block' : 'unblock')
    setShowConfirm(true)
  }

  const handleModalSubmit = async (data) => {
    try {
      if (modalMode === 'create') {
        await adminUserService.createUser(data)
        toast.success('Utilisateur créé avec succès')
      } else {
        await adminUserService.updateUser(selectedUser.id, data)
        toast.success('Utilisateur mis à jour')
      }
      setShowModal(false)
      loadUsers()
    } catch (error) {
      logger.error('AdminUsers: Modal submit failed:', error)
      toast.error(error.response?.data?.message || 'Une erreur est survenue')
      throw error
    }
  }

  const handleConfirmAction = async () => {
    try {
      if (confirmAction === 'delete') {
        await adminUserService.deleteUser(confirmUser.id)
        toast.success('Utilisateur supprimé')
      } else if (confirmAction === 'block') {
        await adminUserService.blockUser(confirmUser.id)
        toast.success('Utilisateur suspendu')
      } else if (confirmAction === 'unblock') {
        await adminUserService.unblockUser(confirmUser.id)
        toast.success('Utilisateur réactivé')
      }
      setShowConfirm(false)
      loadUsers()
    } catch (error) {
      logger.error('AdminUsers: Confirm action failed:', error)
      toast.error('Une erreur est survenue')
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setRoleFilter('')
    setStatusFilter('')
    setClientRoleFilter('')
    setPage(1)
  }

  const hasFilters = searchQuery || roleFilter || statusFilter || clientRoleFilter

  return (
    <AdminLayout>
      <div className="admin-users-page">
        {/* Header */}
        <header className="admin-users-header">
          <div className="admin-users-header-content">
            <h1 className="admin-users-title">Gestion des utilisateurs</h1>
            <p className="admin-users-subtitle">
              Gérez les comptes utilisateurs, les rôles et les permissions
            </p>
          </div>
          <div className="admin-users-actions">
            <button
              className="btn btn-secondary"
              onClick={loadUsers}
              disabled={loading}
            >
              <Icons.RefreshCw />
            </button>
            <button className="btn btn-primary" onClick={handleCreateUser}>
              <Icons.Plus />
              <span>Nouvel utilisateur</span>
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="admin-users-stats">
          <div
            className={`admin-users-stat ${!statusFilter && !roleFilter ? 'active' : ''}`}
            onClick={clearFilters}
          >
            <div className="admin-users-stat-icon">
              <Icons.Users />
            </div>
            <div className="admin-users-stat-content">
              <span className="admin-users-stat-value">{stats.total}</span>
              <span className="admin-users-stat-label">Total</span>
            </div>
          </div>

          <div
            className={`admin-users-stat ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'active' ? '' : 'active')}
          >
            <div className="admin-users-stat-icon">
              <Icons.UserCheck />
            </div>
            <div className="admin-users-stat-content">
              <span className="admin-users-stat-value">{stats.active}</span>
              <span className="admin-users-stat-label">Actifs</span>
            </div>
          </div>

          <div
            className={`admin-users-stat ${statusFilter === 'suspended' ? 'active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'suspended' ? '' : 'suspended')}
          >
            <div className="admin-users-stat-icon">
              <Icons.UserX />
            </div>
            <div className="admin-users-stat-content">
              <span className="admin-users-stat-value">{stats.suspended}</span>
              <span className="admin-users-stat-label">Suspendus</span>
            </div>
          </div>

          <div
            className={`admin-users-stat ${roleFilter === 'admin' ? 'active' : ''}`}
            onClick={() => setRoleFilter(roleFilter === 'admin' ? '' : 'admin')}
          >
            <div className="admin-users-stat-icon">
              <Icons.Shield />
            </div>
            <div className="admin-users-stat-content">
              <span className="admin-users-stat-value">{stats.admins}</span>
              <span className="admin-users-stat-label">Admins</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-users-filters">
          <div className="admin-users-filters-row">
            <div className="admin-users-search">
              <span className="admin-users-search-icon">
                <Icons.Search />
              </span>
              <input
                type="text"
                placeholder="Rechercher par email, nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="admin-users-filter-group">
              <label className="admin-users-filter-label">Rôle système</label>
              <select
                className="admin-users-filter-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">Tous les rôles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="admin-users-filter-group">
              <label className="admin-users-filter-label">Rôle client</label>
              <select
                className="admin-users-filter-select"
                value={clientRoleFilter}
                onChange={(e) => setClientRoleFilter(e.target.value)}
              >
                <option value="">Tous</option>
                <option value="owner">Owner</option>
                <option value="member">Member</option>
              </select>
            </div>

            <div className="admin-users-filter-group">
              <label className="admin-users-filter-label">Statut</label>
              <select
                className="admin-users-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
                <option value="pending">En attente</option>
              </select>
            </div>

            {hasFilters && (
              <button
                className="admin-users-filter-clear"
                onClick={clearFilters}
              >
                Effacer les filtres
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="admin-loading">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="admin-users-empty">
            <div className="admin-users-empty-icon">
              <Icons.Users />
            </div>
            <h3 className="admin-users-empty-title">
              {hasFilters ? 'Aucun résultat' : 'Aucun utilisateur'}
            </h3>
            <p className="admin-users-empty-text">
              {hasFilters
                ? 'Aucun utilisateur ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre premier utilisateur.'}
            </p>
            {hasFilters ? (
              <button className="admin-users-empty-btn" onClick={clearFilters}>
                Effacer les filtres
              </button>
            ) : (
              <button className="admin-users-empty-btn" onClick={handleCreateUser}>
                <Icons.Plus />
                <span>Créer un utilisateur</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="admin-users-list">
              {users.map((user) => (
                <div key={user.id} className="admin-user-row">
                  {/* Avatar */}
                  <div className={`admin-user-avatar ${user.role === 'admin' ? 'admin-user-avatar--admin' : 'admin-user-avatar--user'}`}>
                    {getInitials(user.email, user.name)}
                  </div>

                  {/* User Info */}
                  <div className="admin-user-info">
                    <span className="admin-user-name">{user.name || user.email?.split('@')[0]}</span>
                    <span className="admin-user-email">{user.email}</span>
                  </div>

                  {/* Client Info */}
                  <div className="admin-user-cell admin-user-cell--client">
                    <span className="admin-user-cell-primary">
                      {user.client?.company_name || '-'}
                    </span>
                    <span className="admin-user-cell-secondary">
                      {user.client?.plan || '-'}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="admin-user-badges">
                    <span className={`admin-user-badge admin-user-badge--${user.role}`}>
                      {user.role === 'admin' && <Icons.Shield />}
                      {user.role}
                    </span>

                    {user.client_role && (
                      <span className={`admin-user-badge admin-user-badge--${user.client_role}`}>
                        {user.client_role === 'owner' && <Icons.Crown />}
                        {user.client_role}
                      </span>
                    )}

                    <span className={`admin-user-badge admin-user-badge--${user.status}`}>
                      {user.status}
                    </span>
                  </div>

                  {/* Date */}
                  <span className="admin-user-date">
                    {formatDate(user.created_at)}
                  </span>

                  {/* Actions */}
                  <div className="admin-user-actions">
                    <button
                      className="admin-user-action-btn"
                      onClick={(e) => { e.stopPropagation(); handleEditUser(user); }}
                      title="Modifier"
                    >
                      <Icons.Edit />
                    </button>
                    <button
                      className="admin-user-action-btn"
                      onClick={(e) => { e.stopPropagation(); handleBlockUser(user); }}
                      title={user.status === 'active' ? 'Suspendre' : 'Réactiver'}
                    >
                      {user.status === 'active' ? <Icons.Ban /> : <Icons.Check />}
                    </button>
                    <button
                      className="admin-user-action-btn admin-user-action-btn--danger"
                      onClick={(e) => { e.stopPropagation(); handleDeleteUser(user); }}
                      title="Supprimer"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="admin-users-pagination">
                <span className="admin-users-pagination-info">
                  Page <strong>{page}</strong> sur <strong>{pagination.pages}</strong>
                  {' '} ({pagination.total} utilisateurs)
                </span>
                <div className="admin-users-pagination-controls">
                  <button
                    className="admin-users-pagination-btn"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <Icons.ChevronLeft />
                  </button>
                  <button
                    className="admin-users-pagination-btn"
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                  >
                    <Icons.ChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Modal */}
      {showModal && (
        <UserModal
          mode={modalMode}
          user={selectedUser}
          onClose={() => setShowModal(false)}
          onSubmit={handleModalSubmit}
        />
      )}

      {/* Confirm Dialog */}
      {showConfirm && (
        <ConfirmDialog
          type={confirmAction === 'delete' ? 'danger' : 'warning'}
          title={
            confirmAction === 'delete' ? 'Supprimer l\'utilisateur' :
            confirmAction === 'block' ? 'Suspendre l\'utilisateur' : 'Réactiver l\'utilisateur'
          }
          message={
            confirmAction === 'delete'
              ? `Êtes-vous sûr de vouloir supprimer ${confirmUser?.email} ? Cette action est irréversible.`
              : confirmAction === 'block'
              ? `Êtes-vous sûr de vouloir suspendre ${confirmUser?.email} ? L'utilisateur ne pourra plus se connecter.`
              : `Êtes-vous sûr de vouloir réactiver ${confirmUser?.email} ?`
          }
          confirmLabel={
            confirmAction === 'delete' ? 'Supprimer' :
            confirmAction === 'block' ? 'Suspendre' : 'Réactiver'
          }
          onConfirm={handleConfirmAction}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </AdminLayout>
  )
}
