import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { AddClientModal } from '../../components/admin/AddClientModal';
import { EditClientModal } from '../../components/admin/EditClientModal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { adminResourceService } from '../../services/adminResourceService';
import {
  BuildingIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DollarSignIcon,
  SearchIcon,
  PlusIcon,
  RefreshCwIcon,
  EyeIcon,
  EditIcon,
  CrownIcon
} from '../../components/icons/AdminIcons';
import { getUserInitials } from '../../utils/adminHelpers';
import '../AdminClients.css';

/**
 * Client Data Types
 */
interface ClientOwner {
  name?: string;
  email: string;
}

interface ClientData {
  id: string;
  company_name?: string;
  name?: string;
  email: string;
  status: 'active' | 'suspended' | 'pending';
  plan: 'starter' | 'pro' | 'premium_custom' | string;
  subscription_amount?: number;
  users_count?: number;
  workflows_count?: number;
  executions_count?: number;
  owner?: ClientOwner;
}

interface ClientStats {
  total: number;
  active: number;
  suspended: number;
  pending: number;
  totalRevenue: number;
}

// Plan configuration
const PLAN_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  starter: { label: 'Starter', badgeClass: 'admin-client-card-badge--starter' },
  pro: { label: 'Pro', badgeClass: 'admin-client-card-badge--pro' },
  premium_custom: { label: 'Premium', badgeClass: 'admin-client-card-badge--premium' }
};

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  active: { label: 'Actif', badgeClass: 'admin-client-card-badge--active' },
  suspended: { label: 'Suspendu', badgeClass: 'admin-client-card-badge--suspended' },
  pending: { label: 'En attente', badgeClass: 'admin-client-card-badge--pending' }
};

function getPlanLabel(plan: string): string {
  return PLAN_CONFIG[plan]?.label || plan || '-';
}

function getPlanBadgeClass(plan: string): string {
  return PLAN_CONFIG[plan]?.badgeClass || '';
}

function getStatusLabel(status: string): string {
  return STATUS_CONFIG[status]?.label || status;
}

function getStatusBadgeClass(status: string): string {
  return STATUS_CONFIG[status]?.badgeClass || '';
}

/**
 * Loading Spinner Component
 */
function LoadingSpinner(): JSX.Element {
  return (
    <div className="admin-users-loading">
      <div className="admin-users-loading-spinner" />
      <p>Chargement des clients...</p>
    </div>
  );
}

/**
 * AdminClients - Premium Client Management Page
 */
export function AdminClients(): JSX.Element {
  const navigate = useNavigate();

  // State
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [suspendingClient, setSuspendingClient] = useState<ClientData | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientData | null>(null);

  // Load clients
  const loadClients = useCallback(async () => {
    console.log('AdminClients: Loading clients...');
    try {
      const response = await adminResourceService.getClients();
      console.log('AdminClients: Response received', { count: response.data?.clients?.length });
      setClients(response.data?.clients || []);
    } catch (err) {
      const error = err as Error;
      console.error('AdminClients: Failed to fetch clients', { error: error.message });
      toast.error('Echec du chargement des clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Stats calculation
  const stats = useMemo<ClientStats>(() => {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'active').length;
    const suspended = clients.filter(c => c.status === 'suspended').length;
    const pending = clients.filter(c => c.status === 'pending').length;
    const totalRevenue = clients.reduce((sum, c) => sum + (c.subscription_amount || 0), 0);
    return { total, active, suspended, pending, totalRevenue };
  }, [clients]);

  // Filtered clients
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Apply stat filter
    if (activeStatFilter) {
      result = result.filter(c => c.status === activeStatFilter);
    }

    // Apply search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.company_name?.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }

    // Apply status filter
    if (statusFilter) {
      result = result.filter(c => c.status === statusFilter);
    }

    // Apply plan filter
    if (planFilter) {
      result = result.filter(c => c.plan === planFilter);
    }

    return result;
  }, [clients, searchQuery, statusFilter, planFilter, activeStatFilter]);

  // Handlers
  function handleStatClick(stat: string | null): void {
    setActiveStatFilter(activeStatFilter === stat ? null : stat);
  }

  function handleClearFilters(): void {
    setSearchQuery('');
    setStatusFilter('');
    setPlanFilter('');
    setActiveStatFilter(null);
  }

  async function handleSuspendConfirm(): Promise<void> {
    if (!suspendingClient) return;

    console.log('AdminClients: Suspending client', { clientId: suspendingClient.id });
    try {
      await adminResourceService.updateUser(suspendingClient.id, { status: 'suspended' });
      toast.success(`${suspendingClient.company_name || suspendingClient.name} a ete suspendu`);
      loadClients();
    } catch (err) {
      console.error('AdminClients: Suspend failed', err);
      toast.error('Echec de la suspension du client');
    } finally {
      setSuspendingClient(null);
    }
  }

  async function handleDeleteConfirm(): Promise<void> {
    if (!deletingClient) return;

    console.log('AdminClients: Deleting client', { clientId: deletingClient.id });
    try {
      await adminResourceService.deleteUser(deletingClient.id);
      toast.success(`${deletingClient.company_name || deletingClient.name} a ete supprime`);
      loadClients();
    } catch (err) {
      console.error('AdminClients: Delete failed', err);
      toast.error('Echec de la suppression du client');
    } finally {
      setDeletingClient(null);
    }
  }

  function handleAddSuccess(): void {
    console.log('AdminClients: Client added, refreshing');
    loadClients();
  }

  function handleEditSuccess(): void {
    console.log('AdminClients: Client updated, refreshing');
    loadClients();
  }

  const hasActiveFilters = searchQuery || statusFilter || planFilter || activeStatFilter;

  return (
    <AdminLayout>
      <div className="admin-clients-page">
        {/* Header */}
        <header className="admin-clients-header">
          <div className="admin-clients-header-content">
            <h1 className="admin-clients-title">Gestion des Clients</h1>
            <p className="admin-clients-subtitle">
              Gerez les comptes clients, leurs abonnements et acces
            </p>
          </div>
          <div className="admin-clients-actions">
            <button
              className="btn btn-secondary"
              onClick={loadClients}
              disabled={loading}
              title="Rafraichir"
            >
              <RefreshCwIcon />
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <PlusIcon />
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
            <div className="admin-clients-stat-icon"><BuildingIcon /></div>
            <div className="admin-clients-stat-content">
              <span className="admin-clients-stat-value">{stats.total}</span>
              <span className="admin-clients-stat-label">Total</span>
            </div>
          </button>

          <button
            className={`admin-clients-stat ${activeStatFilter === 'active' ? 'active' : ''}`}
            onClick={() => handleStatClick('active')}
          >
            <div className="admin-clients-stat-icon"><CheckCircleIcon /></div>
            <div className="admin-clients-stat-content">
              <span className="admin-clients-stat-value">{stats.active}</span>
              <span className="admin-clients-stat-label">Actifs</span>
            </div>
          </button>

          <button
            className={`admin-clients-stat ${activeStatFilter === 'suspended' ? 'active' : ''}`}
            onClick={() => handleStatClick('suspended')}
          >
            <div className="admin-clients-stat-icon"><XCircleIcon /></div>
            <div className="admin-clients-stat-content">
              <span className="admin-clients-stat-value">{stats.suspended}</span>
              <span className="admin-clients-stat-label">Suspendus</span>
            </div>
          </button>

          <button
            className={`admin-clients-stat ${activeStatFilter === 'pending' ? 'active' : ''}`}
            onClick={() => handleStatClick('pending')}
          >
            <div className="admin-clients-stat-icon"><ClockIcon /></div>
            <div className="admin-clients-stat-content">
              <span className="admin-clients-stat-value">{stats.pending}</span>
              <span className="admin-clients-stat-label">En attente</span>
            </div>
          </button>

          <div className="admin-clients-stat">
            <div className="admin-clients-stat-icon"><DollarSignIcon /></div>
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
              <span className="admin-clients-search-icon"><SearchIcon /></span>
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
              <button className="admin-clients-filter-clear" onClick={handleClearFilters}>
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
            <div className="admin-clients-empty-icon"><BuildingIcon /></div>
            <h3 className="admin-clients-empty-title">
              {hasActiveFilters ? 'Aucun resultat' : 'Aucun client'}
            </h3>
            <p className="admin-clients-empty-text">
              {hasActiveFilters
                ? 'Aucun client ne correspond a vos filtres. Essayez de modifier vos criteres de recherche.'
                : 'Ajoutez votre premier client pour commencer a gerer vos comptes.'}
            </p>
            {!hasActiveFilters && (
              <button className="admin-clients-empty-btn" onClick={() => setShowAddModal(true)}>
                <PlusIcon />
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
                      <CrownIcon />
                      {getPlanLabel(client.plan)}
                    </span>
                  </div>
                </div>

                {/* Plan & Subscription */}
                {client.subscription_amount && client.subscription_amount > 0 && (
                  <div className="admin-client-card-plan">
                    <div className="admin-client-card-plan-icon"><DollarSignIcon /></div>
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
                    <span className="admin-client-card-stat-value">{client.users_count || 0}</span>
                    <span className="admin-client-card-stat-label">Membres</span>
                  </div>
                  <div className="admin-client-card-stat">
                    <span className="admin-client-card-stat-value">{client.workflows_count || 0}</span>
                    <span className="admin-client-card-stat-label">Workflows</span>
                  </div>
                  <div className="admin-client-card-stat">
                    <span className="admin-client-card-stat-value">{client.executions_count || 0}</span>
                    <span className="admin-client-card-stat-label">Executions</span>
                  </div>
                </div>

                {/* Owner */}
                {client.owner && (
                  <div className="admin-client-card-owner">
                    <div className="admin-client-card-owner-avatar">
                      {getUserInitials(client.owner.name, client.owner.email)}
                    </div>
                    <div className="admin-client-card-owner-info">
                      <p className="admin-client-card-owner-label">Proprietaire</p>
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
                    <EyeIcon />
                    Details
                  </button>
                  <button
                    className="admin-client-card-btn admin-client-card-btn--secondary"
                    onClick={() => setEditingClient(client)}
                  >
                    <EditIcon />
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
          message={`Etes-vous sur de vouloir suspendre "${suspendingClient.company_name || suspendingClient.name}" ? Cette action desactivera temporairement leur acces.`}
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
          message={`Etes-vous sur de vouloir supprimer "${deletingClient.company_name || deletingClient.name}" ? Cette action est irreversible.`}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingClient(null)}
        />
      )}
    </AdminLayout>
  );
}
