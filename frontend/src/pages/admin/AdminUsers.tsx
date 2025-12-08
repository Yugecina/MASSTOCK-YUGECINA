/**
 * AdminUsers Page - TypeScript
 * User management page with search, filters, and CRUD operations
 * PURE CSS ONLY - No Tailwind
 */

import { useState, useEffect, useCallback, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/ui/Spinner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminUserService } from '../../services/adminUserService';
import logger from '@/utils/logger';
import type { AdminUser } from '@/types/admin';

interface UserFilters {
  status?: string;
  plan?: string;
  search?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UserFormData {
  email: string;
  password: string;
  name: string;
  company_name: string;
  role: 'user' | 'admin';
}

/**
 * AdminUsers Component
 * Displays users with filtering, searching, and management capabilities
 */
export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1
  });

  // Filters
  const [filters, setFilters] = useState<UserFilters>({
    status: 'all',
    plan: 'all',
    search: ''
  });

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    company_name: '',
    role: 'user'
  });

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      logger.debug('👥 AdminUsers: Loading users...', { currentPage, filters });

      const apiFilters: Record<string, any> = {};
      if (filters.status && filters.status !== 'all') {
        apiFilters.status = filters.status;
      }
      if (filters.plan && filters.plan !== 'all') {
        apiFilters.plan = filters.plan;
      }
      if (filters.search) {
        apiFilters.search = filters.search;
      }

      const response = await adminUserService.getUsers(currentPage, apiFilters);

      logger.debug('✅ AdminUsers: Data loaded:', {
        response,
        usersCount: response.data?.clients?.length,
        pagination: response.data?.pagination
      });

      setUsers(response.data?.clients || []);
      setPagination(response.data?.pagination || {
        page: currentPage,
        limit: 50,
        total: 0,
        totalPages: 1
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load users';
      logger.error('❌ AdminUsers: Failed to load users:', {
        error: err,
        message: err.message,
        response: err.response
      });
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle filter changes
  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, status: e.target.value }));
    setCurrentPage(1);
  };

  const handlePlanFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, plan: e.target.value }));
    setCurrentPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setCurrentPage(1);
  };

  // Handle user creation
  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();

    try {
      logger.debug('➕ AdminUsers: Creating user...', { formData });

      await adminUserService.createUser({
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      logger.debug('✅ AdminUsers: User created successfully');
      toast.success('User created successfully');

      setShowCreateModal(false);
      setFormData({
        email: '',
        password: '',
        name: '',
        company_name: '',
        role: 'user'
      });

      loadUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create user';
      logger.error('❌ AdminUsers: Failed to create user:', {
        error: err,
        message: err.message,
        response: err.response
      });
      toast.error(errorMessage);
    }
  };

  // Handle user edit
  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      name: user.name || '',
      company_name: user.company_name || '',
      role: user.role === 'admin' ? 'admin' : 'user'
    });
  };

  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    try {
      logger.debug('✏️ AdminUsers: Updating user...', { userId: editingUser.id, formData });

      await adminUserService.updateUser(editingUser.id, {
        email: formData.email,
        role: formData.role,
        status: editingUser.status
      });

      logger.debug('✅ AdminUsers: User updated successfully');
      toast.success('User updated successfully');

      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        company_name: '',
        role: 'user'
      });

      loadUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update user';
      logger.error('❌ AdminUsers: Failed to update user:', {
        error: err,
        message: err.message,
        response: err.response
      });
      toast.error(errorMessage);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!deletingUserId) return;

    try {
      logger.debug('🗑️ AdminUsers: Deleting user...', { userId: deletingUserId });

      await adminUserService.deleteUser(deletingUserId);

      logger.debug('✅ AdminUsers: User deleted successfully');
      toast.success('User deleted successfully');

      setDeletingUserId(null);
      loadUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete user';
      logger.error('❌ AdminUsers: Failed to delete user:', {
        error: err,
        message: err.message,
        response: err.response
      });
      toast.error(errorMessage);
    }
  };

  // Handle block/unblock
  const handleToggleBlock = async (user: AdminUser) => {
    try {
      // Optimistic UI update
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id ? { ...u, _isBlocking: true } : u
        )
      );

      if (user.status === 'active') {
        logger.debug('🚫 AdminUsers: Blocking user...', { userId: user.id });
        await adminUserService.blockUser(user.id);
        toast.success('User suspended');
      } else {
        logger.debug('✅ AdminUsers: Unblocking user...', { userId: user.id });
        await adminUserService.unblockUser(user.id);
        toast.success('User activated');
      }

      loadUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update user status';
      logger.error('❌ AdminUsers: Failed to toggle block:', {
        error: err,
        message: err.message,
        response: err.response
      });
      toast.error(errorMessage);

      // Revert optimistic update
      loadUsers();
    }
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Render loading state
  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <div className="admin-page admin-loading">
          <Spinner size="lg" data-testid="loading-spinner" />
        </div>
      </AdminLayout>
    );
  }

  // Render error state
  if (error && users.length === 0) {
    return (
      <AdminLayout>
        <div className="admin-page">
          <div className="admin-card">
            <div className="admin-empty">
              <div className="admin-empty-icon">⚠️</div>
              <h3 className="admin-empty-title">Failed to load users</h3>
              <p className="admin-empty-text">{error}</p>
              <button className="btn btn-primary" onClick={loadUsers}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        {/* Header */}
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Users</h1>
            <p className="admin-subtitle">Manage user accounts and permissions</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            data-testid="create-user-button"
          >
            + Create User
          </button>
        </header>

        {/* Filters */}
        <div className="admin-filters">
          <input
            type="text"
            placeholder="Search by email or company..."
            value={filters.search}
            onChange={handleSearch}
            className="admin-search-input"
          />

          <select
            value={filters.status}
            onChange={handleStatusFilter}
            className="admin-filter-select"
            aria-label="Status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={filters.plan}
            onChange={handlePlanFilter}
            className="admin-filter-select"
            aria-label="Plan"
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Company</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.company_name || '-'}</td>
                  <td>
                    <span className={`badge badge-${user.subscription_plan === 'pro' ? 'primary' : 'neutral'}`}>
                      {user.subscription_plan || 'starter'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${user.status === 'active' ? 'success' : 'warning'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEditUser(user)}
                        data-testid={`edit-button-${user.id}`}
                      >
                        Edit
                      </button>
                      <button
                        className={`btn btn-sm ${user.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleToggleBlock(user)}
                        disabled={user._isBlocking}
                        data-testid={`block-button-${user.id}`}
                      >
                        {user._isBlocking ? 'Processing...' : user.status === 'active' ? 'Block' : 'Unblock'}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => setDeletingUserId(user.id)}
                        data-testid={`delete-button-${user.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="admin-pagination">
          <div className="admin-pagination-info">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total users)
          </div>
          <div className="admin-pagination-buttons">
            <button
              className="btn btn-secondary"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              aria-label="Previous"
            >
              Previous
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleNextPage}
              disabled={currentPage === pagination.totalPages}
              aria-label="Next"
            >
              Next
            </button>
          </div>
        </div>

        {/* Create/Edit User Modal */}
        {(showCreateModal || editingUser) && (
          <div className="modal-overlay" onClick={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">{editingUser ? 'Edit User' : 'Create User'}</h2>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingUser(null);
                  }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="company" className="form-label">Company</label>
                    <input
                      id="company"
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      className="form-input"
                      required
                    />
                  </div>

                  {!editingUser && (
                    <div className="form-group">
                      <label htmlFor="password" className="form-label">Password</label>
                      <input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="form-input"
                        required
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="role" className="form-label">Role</label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                      className="form-select"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingUser(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingUserId && (
          <div className="modal-overlay" onClick={() => setDeletingUserId(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Confirm Delete</h2>
                <button className="modal-close" onClick={() => setDeletingUserId(null)}>
                  ×
                </button>
              </div>

              <div className="modal-body">
                <p>Are you sure you want to delete this user? This action cannot be undone.</p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeletingUserId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteUser}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
