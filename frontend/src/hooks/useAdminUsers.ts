/**
 * useAdminUsers Hook
 * Manages state and logic for AdminUsers page
 */

import { useState, useCallback, useMemo, useEffect, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { adminResourceService } from '@/services/adminResourceService';
import logger from '@/utils/logger';
import type {
  AdminUser,
  ExtendedUserFilters,
  UserStats,
  Pagination,
} from '@/types/admin';
import type { UserFormData } from '@/components/admin/CreateEditUserModal';

export function useAdminUsers() {
  // State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    total_pages: 1,
  });

  // Filters
  const [filters, setFilters] = useState<ExtendedUserFilters>({
    status: 'all',
    plan: 'all',
    search: '',
    clientId: '',
    createdFrom: null,
    createdTo: null,
    lastLoginFrom: null,
    lastLoginTo: null,
  });

  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Detail Panel state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Compute stats from users data
  const stats = useMemo<UserStats>(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'active').length;
    const suspended = users.filter((u) => u.status === 'suspended').length;
    const pending = users.filter((u) => u.status === 'pending').length;
    const starter = users.filter(
      (u) =>
        (!u.subscription_plan && !u.plan) ||
        u.subscription_plan === 'starter' ||
        u.plan === 'starter'
    ).length;
    const pro = users.filter(
      (u) => u.subscription_plan === 'pro' || u.plan === 'pro'
    ).length;
    const enterprise = users.filter(
      (u) => u.subscription_plan === 'enterprise' || u.plan === 'enterprise'
    ).length;

    return {
      total,
      active,
      suspended,
      pending,
      byPlan: { starter, pro, enterprise },
    };
  }, [users]);

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      logger.debug('👥 useAdminUsers: Loading users...', {
        currentPage,
        filters,
      });

      const apiFilters: Record<string, any> = {};
      if (filters.status && filters.status !== 'all')
        apiFilters.status = filters.status;
      if (filters.plan && filters.plan !== 'all') apiFilters.plan = filters.plan;
      if (filters.search) apiFilters.search = filters.search;
      if (filters.clientId) apiFilters.client_id = filters.clientId;

      const response = await adminResourceService.getUsers(currentPage, apiFilters);

      logger.debug('✅ useAdminUsers: Data loaded:', {
        response,
        usersCount: response.data?.users?.length,
        pagination: response.data?.pagination,
      });

      setUsers(response.data?.users || []);
      setPagination(
        response.data?.pagination || {
          page: currentPage,
          limit: 50,
          total: 0,
          total_pages: 1,
        }
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load users';
      logger.error('❌ useAdminUsers: Failed to load users:', {
        error: err,
        message: err.message,
        response: err.response,
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

  // Filter handlers
  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setActiveStatFilter(null);
    setCurrentPage(1);
  };

  const handlePlanFilter = (value: string) => {
    setFilters((prev) => ({ ...prev, plan: value }));
    setActiveStatFilter(null);
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setActiveStatFilter(null);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      plan: 'all',
      search: '',
      clientId: '',
      createdFrom: null,
      createdTo: null,
      lastLoginFrom: null,
      lastLoginTo: null,
    });
    setActiveStatFilter(null);
    setCurrentPage(1);
  };

  // Stat card click handlers
  const handleStatClick = (filterType: string) => {
    if (activeStatFilter === filterType) {
      // Unselect
      setActiveStatFilter(null);
      setFilters((prev) => ({ ...prev, status: 'all', plan: 'all' }));
    } else {
      // Select
      setActiveStatFilter(filterType);
      if (filterType === 'status-active') {
        setFilters((prev) => ({ ...prev, status: 'active', plan: 'all' }));
      } else if (filterType === 'status-suspended') {
        setFilters((prev) => ({ ...prev, status: 'suspended', plan: 'all' }));
      } else if (filterType.startsWith('plan-')) {
        const plan = filterType.replace('plan-', '');
        setFilters((prev) => ({ ...prev, status: 'all', plan }));
      }
    }
    setCurrentPage(1);
  };

  // User CRUD handlers
  const handleCreateUser = async (formData: UserFormData) => {
    logger.debug('➕ useAdminUsers: Creating user...', { formData });

    await adminResourceService.createUser({
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });

    logger.debug('✅ useAdminUsers: User created successfully');
    toast.success('Utilisateur créé avec succès');

    setShowCreateModal(false);
    loadUsers();
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setShowDetailPanel(false);
  };

  const handleUpdateUser = async (formData: UserFormData) => {
    if (!editingUser) return;

    logger.debug('✏️ useAdminUsers: Updating user...', {
      userId: editingUser.id,
      formData,
    });

    await adminResourceService.updateUser(editingUser.id, {
      email: formData.email,
      role: formData.role,
      status: editingUser.status,
    });

    logger.debug('✅ useAdminUsers: User updated successfully');
    toast.success('Utilisateur modifié avec succès');

    setEditingUser(null);
    loadUsers();
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;

    try {
      logger.debug('🗑️ useAdminUsers: Deleting user...', {
        userId: deletingUserId,
      });

      await adminResourceService.deleteUser(deletingUserId);

      logger.debug('✅ useAdminUsers: User deleted successfully');
      toast.success('Utilisateur supprimé avec succès');

      setDeletingUserId(null);
      setShowDetailPanel(false);
      loadUsers();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to delete user';
      logger.error('❌ useAdminUsers: Failed to delete user:', {
        error: err,
        message: err.message,
        response: err.response,
      });
      toast.error(errorMessage);
    }
  };

  const handleToggleBlock = async (user: AdminUser) => {
    try {
      // Optimistic UI update
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === user.id ? { ...u, _isBlocking: true } : u))
      );

      if (user.status === 'active') {
        logger.debug('🚫 useAdminUsers: Blocking user...', { userId: user.id });
        await adminResourceService.blockUser(user.id);
        toast.success('Utilisateur suspendu');
      } else {
        logger.debug('✅ useAdminUsers: Unblocking user...', {
          userId: user.id,
        });
        await adminResourceService.unblockUser(user.id);
        toast.success('Utilisateur activé');
      }

      loadUsers();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to update user status';
      logger.error('❌ useAdminUsers: Failed to toggle block:', {
        error: err,
        message: err.message,
        response: err.response,
      });
      toast.error(errorMessage);

      // Revert optimistic update
      loadUsers();
    }
  };

  // Row click handler
  const handleRowClick = (user: AdminUser) => {
    setSelectedUser(user);
    setShowDetailPanel(true);
  };

  // Detail panel handlers
  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedUser(null);
  };

  const handleDetailPanelEdit = (user: AdminUser) => {
    handleEditUser(user);
  };

  const handleDetailPanelBlock = (user: AdminUser) => {
    handleToggleBlock(user);
    setShowDetailPanel(false);
  };

  const handleDetailPanelDelete = (userId: string) => {
    setDeletingUserId(userId);
    setShowDetailPanel(false);
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pagination.total_pages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return {
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
    handleEditUser,
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
  };
}
