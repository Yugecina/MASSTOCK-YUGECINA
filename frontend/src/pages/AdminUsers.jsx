/**
 * Page AdminUsers - Gestion des utilisateurs/clients
 * @file AdminUsers.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import { UserTable } from '../components/admin/UserTable';
import { UserForm } from '../components/admin/UserForm';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { adminUserService } from '../services/adminUserService';
import toast from 'react-hot-toast';
import logger from '@/utils/logger';


export function AdminUsers() {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Action loading states
  const [blockingUserId, setBlockingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters = {};
      if (search) filters.search = search;
      if (statusFilter) filters.status = statusFilter;
      if (planFilter) filters.plan = planFilter;

      const data = await adminUserService.getUsers(pagination.page, filters);
      logger.debug('Admin users data:', data); // Debug log
      setUsers(data.clients || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      logger.error('Failed to load users:', err); // Debug log
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, statusFilter, planFilter]);

  // Initial load and when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Handle filter changes
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePlanFilterChange = (e) => {
    setPlanFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  // Create user
  const handleCreateUser = async (userData) => {
    await adminUserService.createUser(userData);
    toast.success('User created successfully');
    setIsCreateModalOpen(false);
    fetchUsers();
  };

  // Edit user
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (userData) => {
    await adminUserService.updateUser(selectedUser.id, userData);
    toast.success('User updated successfully');
    setIsEditModalOpen(false);
    setSelectedUser(null);
    fetchUsers();
  };

  // Delete user
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeletingUserId(selectedUser.id);
    try {
      await adminUserService.deleteUser(selectedUser.id);
      toast.success('User deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  // Block/Unblock user
  const handleBlockClick = async (user) => {
    setBlockingUserId(user.id);
    try {
      if (user.status === 'active') {
        await adminUserService.blockUser(user.id);
        toast.success('User blocked successfully');
      } else {
        await adminUserService.unblockUser(user.id);
        toast.success('User unblocked successfully');
      }
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user status');
    } finally {
      setBlockingUserId(null);
    }
  };

  // Loading state
  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-error text-h3 mb-4">Error</div>
        <p className="text-neutral-600 mb-6">{error}</p>
        <button onClick={fetchUsers} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-h1 text-neutral-900">Users</h1>
          <p className="text-body-sm text-neutral-600 mt-2">
            Manage user accounts and permissions
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
          data-testid="create-user-button"
        >
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="input-group">
            <label htmlFor="search">Search</label>
            <input
              id="search"
              type="text"
              placeholder="Search by email or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="input-group">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div className="input-group">
            <label htmlFor="plan-filter">Plan</label>
            <select
              id="plan-filter"
              value={planFilter}
              onChange={handlePlanFilterChange}
            >
              <option value="">All Plans</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="premium_custom">Premium Custom</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <UserTable
        users={users.map(user => ({
          ...user,
          _isBlocking: blockingUserId === user.id
        }))}
        loading={loading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onBlock={handleBlockClick}
      />

      {/* Pagination - Always show */}
      <div className="flex justify-between items-center mt-6">
        <p className="text-body-sm text-neutral-600">
          Page {pagination.page} of {pagination.totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={pagination.page === 1}
            className="btn btn-sm btn-secondary"
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={pagination.page === pagination.totalPages}
            className="btn btn-sm btn-secondary"
          >
            Next
          </button>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
      >
        <UserForm
          mode="create"
          onSubmit={handleCreateUser}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        title="Edit User"
      >
        <UserForm
          mode="edit"
          user={selectedUser}
          onSubmit={handleUpdateUser}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-body text-neutral-700">
            Are you sure you want to delete this user?
          </p>
          {selectedUser && (
            <div className="bg-neutral-50 rounded p-4">
              <p className="text-body-sm">
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p className="text-body-sm">
                <strong>Company:</strong> {selectedUser.company_name}
              </p>
            </div>
          )}
          <p className="text-body-sm text-error">
            This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedUser(null);
              }}
              className="btn btn-secondary flex-1"
              disabled={deletingUserId === selectedUser?.id}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="btn btn-danger flex-1"
              disabled={deletingUserId === selectedUser?.id}
            >
              {deletingUserId === selectedUser?.id ? (
                <>
                  <Spinner size="sm" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
