/**
 * AdminUsers Page - TypeScript
 * Complete redesign with premium "Trusted Magician" design
 * Stats dashboard, advanced filters, premium table, detail panel
 * PURE CSS ONLY - No Tailwind
 *
 * Refactored: Extracted icons, modals, and logic to separate files
 */

import { Spinner } from '../../components/ui/Spinner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { UserDetailPanel } from '../../components/admin/UserDetailPanel';
import { CreateEditUserModal } from '../../components/admin/CreateEditUserModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { useAdminUsers } from '../../hooks/useAdminUsers';
import {
  UsersIcon,
  UserCheckIcon,
  UserXIcon,
  CreditCardIcon,
  SearchIcon,
  PlusIcon,
  RefreshCwIcon,
  EditIcon,
  BanIcon,
  CheckIcon,
  TrashIcon,
} from '../../components/icons/AdminIcons';
import {
  formatDate,
  formatRelativeTime,
  getUserInitials,
  getStatusBadge,
  getPlanBadge,
  getRoleBadge,
} from '../../utils/adminHelpers';
import './AdminUsers.css';

/**
 * AdminUsers Component
 * Premium design with stats, filters, table, and detail panel
 */
export function AdminUsers() {
  const {
    // Data
    users,
    loading,
    error,
    stats,
    pagination,
    currentPage,

    // Filters
    filters,
    activeStatFilter,
    handleStatusFilter,
    handlePlanFilter,
    handleSearch,
    handleClearFilters,
    handleStatClick,

    // User CRUD
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    handleToggleBlock,

    // Modals
    showCreateModal,
    setShowCreateModal,
    editingUser,
    setEditingUser,
    deletingUserId,
    setDeletingUserId,

    // Detail panel
    selectedUser,
    showDetailPanel,
    handleRowClick,
    handleCloseDetailPanel,
    handleDetailPanelEdit,
    handleDetailPanelBlock,
    handleDetailPanelDelete,

    // Pagination
    handlePreviousPage,
    handleNextPage,

    // Actions
    loadUsers,
  } = useAdminUsers();

  // Render loading state
  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <div className="admin-users-page">
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
            }}
          >
            <Spinner size="lg" data-testid="loading-spinner" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Render error state
  if (error && users.length === 0) {
    return (
      <AdminLayout>
        <div className="admin-users-page">
          <div className="admin-users-empty">
            <div className="admin-users-empty-icon">⚠️</div>
            <h3 className="admin-users-empty-title">Erreur de chargement</h3>
            <p className="admin-users-empty-text">{error}</p>
            <button className="btn btn-primary" onClick={loadUsers}>
              Réessayer
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-users-page">
        {/* Hero Header */}
        <header className="admin-users-hero">
          <div className="admin-users-hero-content">
            <h1 className="admin-users-title">Gestion des Utilisateurs</h1>
            <p className="admin-users-subtitle">
              Gérez les comptes utilisateurs, leurs rôles et permissions
            </p>
          </div>
          <div className="admin-users-actions">
            <button className="btn btn-secondary" onClick={loadUsers}>
              <RefreshCwIcon />
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              data-testid="create-user-button"
            >
              <PlusIcon />
              Nouvel Utilisateur
            </button>
          </div>
        </header>

        {/* Stats Dashboard */}
        <div className="admin-users-stats">
          <button
            className={`admin-users-stat ${
              activeStatFilter === null ? 'active' : ''
            }`}
            onClick={() => handleStatClick('total')}
          >
            <div className="admin-users-stat-icon">
              <UsersIcon />
            </div>
            <div className="admin-users-stat-content">
              <span className="admin-users-stat-value">{stats.total}</span>
              <span className="admin-users-stat-label">Total</span>
            </div>
          </button>

          <button
            className={`admin-users-stat ${
              activeStatFilter === 'status-active' ? 'active' : ''
            }`}
            onClick={() => handleStatClick('status-active')}
          >
            <div className="admin-users-stat-icon">
              <UserCheckIcon />
            </div>
            <div className="admin-users-stat-content">
              <span className="admin-users-stat-value">{stats.active}</span>
              <span className="admin-users-stat-label">Actifs</span>
            </div>
          </button>

          <button
            className={`admin-users-stat ${
              activeStatFilter === 'status-suspended' ? 'active' : ''
            }`}
            onClick={() => handleStatClick('status-suspended')}
          >
            <div className="admin-users-stat-icon">
              <UserXIcon />
            </div>
            <div className="admin-users-stat-content">
              <span className="admin-users-stat-value">{stats.suspended}</span>
              <span className="admin-users-stat-label">Suspendus</span>
            </div>
          </button>

          <button
            className={`admin-users-stat ${
              activeStatFilter === 'plan-starter' ? 'active' : ''
            }`}
            onClick={() => handleStatClick('plan-starter')}
          >
            <div className="admin-users-stat-icon">
              <CreditCardIcon />
            </div>
            <div className="admin-users-stat-content">
              <span className="admin-users-stat-value">
                {stats.byPlan.starter}
              </span>
              <span className="admin-users-stat-label">Starter</span>
            </div>
          </button>

          <button
            className={`admin-users-stat ${
              activeStatFilter === 'plan-pro' ? 'active' : ''
            }`}
            onClick={() => handleStatClick('plan-pro')}
          >
            <div className="admin-users-stat-icon">
              <CreditCardIcon />
            </div>
            <div className="admin-users-stat-content">
              <span className="admin-users-stat-value">
                {stats.byPlan.pro}
              </span>
              <span className="admin-users-stat-label">Pro</span>
            </div>
          </button>

          <button
            className={`admin-users-stat ${
              activeStatFilter === 'plan-enterprise' ? 'active' : ''
            }`}
            onClick={() => handleStatClick('plan-enterprise')}
          >
            <div className="admin-users-stat-icon">
              <CreditCardIcon />
            </div>
            <div className="admin-users-stat-content">
              <span className="admin-users-stat-value">
                {stats.byPlan.enterprise}
              </span>
              <span className="admin-users-stat-label">Enterprise</span>
            </div>
          </button>
        </div>

        {/* Advanced Filters */}
        <div className="admin-users-filters">
          <div className="admin-users-filters-row">
            <div className="admin-users-search">
              <span className="admin-users-search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Rechercher par email ou nom..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <div className="admin-users-filter-group">
              <label className="admin-users-filter-label">Statut</label>
              <select
                value={filters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="admin-users-filter-select"
                aria-label="Status"
              >
                <option value="all">Tous</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
                <option value="pending">En attente</option>
              </select>
            </div>

            <div className="admin-users-filter-group">
              <label className="admin-users-filter-label">Plan</label>
              <select
                value={filters.plan}
                onChange={(e) => handlePlanFilter(e.target.value)}
                className="admin-users-filter-select"
                aria-label="Plan"
              >
                <option value="all">Tous</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <button
              className="admin-users-filter-clear"
              onClick={handleClearFilters}
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Premium Table */}
        {users.length === 0 ? (
          <div className="admin-users-empty">
            <div className="admin-users-empty-icon">
              <UsersIcon />
            </div>
            <h3 className="admin-users-empty-title">Aucun utilisateur</h3>
            <p className="admin-users-empty-text">
              Commencez par créer votre premier utilisateur
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <PlusIcon />
              Créer un utilisateur
            </button>
          </div>
        ) : (
          <>
            <div className="admin-users-table-wrapper">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Rôle</th>
                    <th>Client</th>
                    <th>Plan</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    <th>Dernière co</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const statusBadge = getStatusBadge(user.status);
                    const planBadge = getPlanBadge(
                      user.subscription_plan || user.plan
                    );
                    const roleBadge = getRoleBadge(user.role);

                    return (
                      <tr key={user.id} onClick={() => handleRowClick(user)}>
                        <td>
                          <div className="admin-users-user-cell">
                            <div className="admin-users-user-avatar">
                              {getUserInitials(user.name, user.email)}
                            </div>
                            <div className="admin-users-user-info">
                              <span className="admin-users-user-name">
                                {user.name || user.email.split('@')[0]}
                              </span>
                              <span className="admin-users-user-email">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`admin-users-badge ${roleBadge.class}`}
                          >
                            {roleBadge.label}
                          </span>
                        </td>
                        <td>{user.company_name || '-'}</td>
                        <td>
                          <span
                            className={`admin-users-badge ${planBadge.class}`}
                          >
                            {planBadge.label}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`admin-users-badge ${statusBadge.class}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                        <td>{formatDate(user.created_at)}</td>
                        <td>
                          {user.last_login
                            ? formatRelativeTime(user.last_login)
                            : 'Jamais'}
                        </td>
                        <td
                          className="admin-users-table-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleDetailPanelEdit(user)}
                            title="Modifier"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleToggleBlock(user)}
                            disabled={user._isBlocking}
                            title={
                              user.status === 'active'
                                ? 'Suspendre'
                                : 'Activer'
                            }
                          >
                            {user.status === 'active' ? (
                              <BanIcon />
                            ) : (
                              <CheckIcon />
                            )}
                          </button>
                          <button
                            className="danger"
                            onClick={() => setDeletingUserId(user.id)}
                            title="Supprimer"
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="admin-users-pagination">
              <div className="admin-users-pagination-info">
                Page {pagination.page} sur {pagination.total_pages} (
                {pagination.total} utilisateurs)
              </div>
              <div className="admin-users-pagination-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  aria-label="Previous"
                >
                  Précédent
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleNextPage}
                  disabled={currentPage === pagination.total_pages}
                  aria-label="Next"
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}

        {/* Create/Edit User Modal */}
        <CreateEditUserModal
          user={editingUser}
          isOpen={showCreateModal || !!editingUser}
          onClose={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}
          onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
        />

        {/* Delete Confirmation Modal */}
        {deletingUserId && (
          <ConfirmDialog
            type="danger"
            title="Confirmer la suppression"
            message="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
            confirmLabel="Supprimer"
            cancelLabel="Annuler"
            onConfirm={handleDeleteUser}
            onCancel={() => setDeletingUserId(null)}
          />
        )}

        {/* User Detail Panel */}
        <UserDetailPanel
          user={selectedUser}
          isOpen={showDetailPanel}
          onClose={handleCloseDetailPanel}
          onEdit={handleDetailPanelEdit}
          onBlock={handleDetailPanelBlock}
          onDelete={handleDetailPanelDelete}
        />
      </div>
    </AdminLayout>
  );
}
