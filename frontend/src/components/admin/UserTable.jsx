/**
 * Composant UserTable - Tableau d'affichage des utilisateurs
 * @file UserTable.jsx
 */

import { formatDistance } from 'date-fns';

/**
 * Formate la date en format relatif (e.g., "2 days ago")
 */
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Extrait les 8 premiers caractères d'un UUID
 */
const shortId = (id) => {
  return id ? id.substring(0, 8) : '';
};

/**
 * Retourne la classe CSS pour le badge de statut
 */
const getStatusBadgeClass = (status) => {
  const statusMap = {
    active: 'badge-success',
    suspended: 'badge-warning',
    deleted: 'badge-error'
  };
  return statusMap[status] || 'badge-neutral';
};

export function UserTable({ users = [], loading = false, onEdit, onDelete, onBlock }) {
  // État de chargement
  if (loading) {
    return (
      <div className="card">
        <div className="flex justify-center items-center p-8">
          <div className="spinner w-10 h-10" data-testid="loading-spinner">
            <svg className="w-full h-full" viewBox="0 0 24 24">
              <circle
                style={{ opacity: 0.25 }}
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                style={{ opacity: 0.75 }}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <span className="ml-2 text-neutral-600">Loading...</span>
        </div>
      </div>
    );
  }

  // État vide
  if (!users || users.length === 0) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <svg
            className="w-16 h-16 text-neutral-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-h3 text-neutral-900 mb-2">No users found</h3>
          <p className="text-body-sm text-neutral-600">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-3 px-4 text-label text-neutral-600 font-semibold">
                ID
              </th>
              <th className="text-left py-3 px-4 text-label text-neutral-600 font-semibold">
                Email
              </th>
              <th className="text-left py-3 px-4 text-label text-neutral-600 font-semibold">
                Company
              </th>
              <th className="text-left py-3 px-4 text-label text-neutral-600 font-semibold">
                Plan
              </th>
              <th className="text-left py-3 px-4 text-label text-neutral-600 font-semibold">
                Status
              </th>
              <th className="text-left py-3 px-4 text-label text-neutral-600 font-semibold">
                Created
              </th>
              <th className="text-left py-3 px-4 text-label text-neutral-600 font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isBlocking = user._isBlocking || false;

              return (
                <tr
                  key={user.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                >
                  <td className="py-3 px-4 text-body-sm text-neutral-900 font-medium">
                    {shortId(user.id)}
                  </td>
                  <td className="py-3 px-4 text-body-sm text-neutral-900">
                    {user.email}
                  </td>
                  <td className="py-3 px-4 text-body-sm text-neutral-900">
                    {user.company_name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="badge badge-neutral">{user.subscription_plan}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`badge ${getStatusBadgeClass(user.status)}`}
                      data-testid={`status-badge-${user.id}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-body-sm text-neutral-600">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(user)}
                        className="btn btn-sm btn-secondary"
                        data-testid={`edit-button-${user.id}`}
                        disabled={isBlocking}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onBlock(user)}
                        className={`btn btn-sm ${
                          user.status === 'active' ? 'btn-secondary' : 'btn-primary'
                        }`}
                        data-testid={`block-button-${user.id}`}
                        disabled={isBlocking}
                      >
                        {user.status === 'active' ? 'Block' : 'Unblock'}
                      </button>
                      <button
                        onClick={() => onDelete(user)}
                        className="btn btn-sm btn-danger"
                        data-testid={`delete-button-${user.id}`}
                        disabled={isBlocking}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
