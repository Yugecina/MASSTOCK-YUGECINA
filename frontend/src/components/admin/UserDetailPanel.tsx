/**
 * UserDetailPanel Component
 * Sliding side panel displaying complete user details
 * PURE CSS ONLY - No Tailwind
 */

import { UserDetailPanelProps } from '@/types/admin';
import './UserDetailPanel.css';

// SVG Icons
const Icons = {
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Mail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    </svg>
  ),
  Building: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/>
      <path d="M16 6h.01"/>
      <path d="M12 6h.01"/>
      <path d="M12 10h.01"/>
      <path d="M12 14h.01"/>
      <path d="M16 10h.01"/>
      <path d="M16 14h.01"/>
      <path d="M8 10h.01"/>
      <path d="M8 14h.01"/>
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
      <line x1="16" x2="16" y1="2" y2="6"/>
      <line x1="8" x2="8" y1="2" y2="6"/>
      <line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  CreditCard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2"/>
      <line x1="2" x2="22" y1="10" y2="10"/>
    </svg>
  ),
  Edit: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      <path d="m15 5 4 4"/>
    </svg>
  ),
  Ban: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="m4.9 4.9 14.2 14.2"/>
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  ),
  Trash: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/>
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  ),
};

export function UserDetailPanel({
  user,
  isOpen,
  onClose,
  onEdit,
  onBlock,
  onDelete,
}: UserDetailPanelProps) {
  if (!user) return null;

  const getInitials = (user: typeof user) => {
    if (user.name) {
      return user.name.split(' ').map(n => n[0]).join('').slice(0, 2);
    }
    return user.email.slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Aujourd'hui";
    if (diffInDays === 1) return 'Hier';
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaines`;
    if (diffInDays < 365) return `Il y a ${Math.floor(diffInDays / 30)} mois`;
    return `Il y a ${Math.floor(diffInDays / 365)} ans`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'admin-users-badge--active';
      case 'suspended':
        return 'admin-users-badge--suspended';
      case 'pending':
        return 'admin-users-badge--pending';
      default:
        return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'suspended':
        return 'Suspendu';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    return role === 'admin' ? 'admin-users-badge--admin' : 'admin-users-badge--user';
  };

  const getRoleLabel = (role: string) => {
    return role === 'admin' ? 'Administrateur' : 'Utilisateur';
  };

  const getPlanBadgeClass = (plan?: string) => {
    switch (plan) {
      case 'pro':
        return 'admin-users-badge--pro';
      case 'enterprise':
        return 'admin-users-badge--enterprise';
      default:
        return 'admin-users-badge--starter';
    }
  };

  const getPlanLabel = (plan?: string) => {
    switch (plan) {
      case 'pro':
        return 'Pro';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Starter';
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="admin-users-panel-overlay" onClick={onClose} />
      )}

      {/* Panel */}
      <div className={`admin-users-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="admin-users-panel-header">
          <button
            className="admin-users-panel-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <Icons.X />
          </button>
        </div>

        {/* User Avatar & Name */}
        <div className="admin-users-panel-user">
          <div className="admin-users-panel-avatar">
            {getInitials(user)}
          </div>
          <div className="admin-users-panel-user-info">
            <h2 className="admin-users-panel-user-name">
              {user.name || user.email}
            </h2>
            <p className="admin-users-panel-user-email">{user.email}</p>
          </div>
          <div className="admin-users-panel-badges">
            <span className={`admin-users-badge ${getStatusBadgeClass(user.status)}`}>
              {getStatusLabel(user.status)}
            </span>
            <span className={`admin-users-badge ${getRoleBadgeClass(user.role)}`}>
              {getRoleLabel(user.role)}
            </span>
          </div>
        </div>

        {/* Info Sections */}
        <div className="admin-users-panel-sections">
          {/* Profile Section */}
          <div className="admin-users-panel-section">
            <h3 className="admin-users-panel-section-title">
              <Icons.User />
              Informations du profil
            </h3>
            <div className="admin-users-panel-info-grid">
              <div className="admin-users-panel-info-item">
                <div className="admin-users-panel-info-icon">
                  <Icons.Mail />
                </div>
                <div className="admin-users-panel-info-content">
                  <span className="admin-users-panel-info-label">Email</span>
                  <span className="admin-users-panel-info-value">{user.email}</span>
                </div>
              </div>

              <div className="admin-users-panel-info-item">
                <div className="admin-users-panel-info-icon">
                  <Icons.Shield />
                </div>
                <div className="admin-users-panel-info-content">
                  <span className="admin-users-panel-info-label">Rôle</span>
                  <span className="admin-users-panel-info-value">{getRoleLabel(user.role)}</span>
                </div>
              </div>

              <div className="admin-users-panel-info-item">
                <div className="admin-users-panel-info-icon">
                  <Icons.Calendar />
                </div>
                <div className="admin-users-panel-info-content">
                  <span className="admin-users-panel-info-label">Créé le</span>
                  <span className="admin-users-panel-info-value">{formatDate(user.created_at)}</span>
                </div>
              </div>

              <div className="admin-users-panel-info-item">
                <div className="admin-users-panel-info-icon">
                  <Icons.Clock />
                </div>
                <div className="admin-users-panel-info-content">
                  <span className="admin-users-panel-info-label">Dernière connexion</span>
                  <span className="admin-users-panel-info-value">
                    {user.last_login ? formatRelativeTime(user.last_login) : 'Jamais'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Client Section (if applicable) */}
          {user.company_name && (
            <div className="admin-users-panel-section">
              <h3 className="admin-users-panel-section-title">
                <Icons.Building />
                Informations client
              </h3>
              <div className="admin-users-panel-info-grid">
                <div className="admin-users-panel-info-item">
                  <div className="admin-users-panel-info-icon">
                    <Icons.Building />
                  </div>
                  <div className="admin-users-panel-info-content">
                    <span className="admin-users-panel-info-label">Entreprise</span>
                    <span className="admin-users-panel-info-value">{user.company_name}</span>
                  </div>
                </div>

                <div className="admin-users-panel-info-item">
                  <div className="admin-users-panel-info-icon">
                    <Icons.CreditCard />
                  </div>
                  <div className="admin-users-panel-info-content">
                    <span className="admin-users-panel-info-label">Plan</span>
                    <span className={`admin-users-badge ${getPlanBadgeClass(user.subscription_plan || user.plan)}`}>
                      {getPlanLabel(user.subscription_plan || user.plan)}
                    </span>
                  </div>
                </div>

                {user.subscription_amount && (
                  <div className="admin-users-panel-info-item">
                    <div className="admin-users-panel-info-icon">
                      <Icons.CreditCard />
                    </div>
                    <div className="admin-users-panel-info-content">
                      <span className="admin-users-panel-info-label">Abonnement</span>
                      <span className="admin-users-panel-info-value">
                        {typeof user.subscription_amount === 'number'
                          ? `${user.subscription_amount}€/mois`
                          : user.subscription_amount}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="admin-users-panel-actions">
          <button
            className="btn btn-secondary"
            onClick={() => onEdit(user)}
          >
            <Icons.Edit />
            Modifier
          </button>
          <button
            className={`btn ${user.status === 'active' ? 'btn-warning' : 'btn-success'}`}
            onClick={() => onBlock(user)}
          >
            {user.status === 'active' ? <Icons.Ban /> : <Icons.Check />}
            {user.status === 'active' ? 'Suspendre' : 'Activer'}
          </button>
          <button
            className="btn btn-danger"
            onClick={() => onDelete(user.id)}
          >
            <Icons.Trash />
            Supprimer
          </button>
        </div>
      </div>
    </>
  );
}
