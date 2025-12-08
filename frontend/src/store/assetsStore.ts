/**
 * Assets Store
 * Zustand store for assets management
 */

import { create } from 'zustand';
import assetsService from '../services/assets';
import logger from '../utils/logger';
import { Asset } from '../types/index';

const CACHE_DURATION = 30000; // 30 seconds

interface AssetStats {
  total: number;
  by_type: {
    image: number;
    video: number;
    lipsync: number;
    upscaled: number;
  };
}

interface Pagination {
  next_cursor: string | null;
  has_more: boolean;
  limit: number;
}

interface Filters {
  asset_type: string;
  sort: string;
}

interface AssetGroup {
  execution_id: string;
  workflow_name: string;
  execution_created_at: string;
  assets: Asset[];
  asset_count: number;
}

interface FetchOptions {
  force?: boolean;
  append?: boolean;
  loadAll?: boolean;
}

interface AssetsState {
  assets: Asset[];
  loading: boolean;
  lastFetch: number | null;
  stats: AssetStats;
  pagination: Pagination;
  filters: Filters;
}

interface AssetsActions {
  setFilters: (newFilters: Partial<Filters>) => Promise<void>;
  fetchAssets: (params?: Record<string, any>, options?: FetchOptions) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
  getGroupedAssets: () => AssetGroup[];
}

type AssetsStore = AssetsState & AssetsActions;

export const useAssetsStore = create<AssetsStore>((set, get) => ({
  // State
  assets: [],
  loading: false,
  lastFetch: null,
  stats: { total: 0, by_type: { image: 0, video: 0, lipsync: 0, upscaled: 0 } },
  pagination: {
    next_cursor: null,
    has_more: false,
    limit: 50
  },

  // Filters
  filters: {
    asset_type: 'all',
    sort: 'newest'
  },

  // Actions
  setFilters: async (newFilters: Partial<Filters>) => {
    const oldFilters = get().filters;
    const updatedFilters = { ...oldFilters, ...newFilters };

    logger.debug('🔍 assetsStore.setFilters: Updating filters', {
      old: oldFilters,
      new: updatedFilters
    });

    set({ filters: updatedFilters });

    // Force refresh when filters change - load all assets at once
    await get().fetchAssets({}, { force: true, loadAll: true });
  },

  fetchAssets: async (params: Record<string, any> = {}, options: FetchOptions = {}) => {
    const { force = false, append = false, loadAll = false } = options;
    const { lastFetch, filters, assets, pagination } = get();
    const now = Date.now();

    // Use cache if available (skip cache in loadAll mode)
    if (!force && !append && !loadAll && assets.length > 0 && lastFetch && (now - lastFetch < CACHE_DURATION)) {
      logger.debug('✅ assetsStore.fetchAssets: Using cached data', {
        age: Math.round((now - lastFetch) / 1000) + 's',
        count: assets.length
      });
      return;
    }

    logger.debug('🔍 assetsStore.fetchAssets: Fetching from API', { params, append, loadAll });
    set({ loading: true });

    try {
      const queryParams: Record<string, any> = {
        ...filters,
        limit: pagination.limit,
        ...params
      };

      // Add load_all parameter if loadAll mode
      if (loadAll) {
        queryParams.load_all = true;
      }

      const response = await assetsService.getAssets(queryParams);
      const newAssets = response.assets;

      set({
        assets: append ? [...assets, ...newAssets] : newAssets,
        stats: response.stats,
        pagination: response.pagination,
        loading: false,
        lastFetch: Date.now()
      });

      logger.debug('✅ assetsStore.fetchAssets: Success', {
        count: newAssets.length,
        total: response.stats.total
      });
    } catch (error) {
      logger.error('❌ assetsStore.fetchAssets: Error', { error });
      set({ loading: false });
      throw error;
    }
  },

  loadMore: async () => {
    const { pagination } = get();

    if (!pagination.has_more || !pagination.next_cursor) {
      logger.debug('⚠️ assetsStore.loadMore: No more assets to load');
      return;
    }

    logger.debug('📄 assetsStore.loadMore: Loading next page', {
      cursor: pagination.next_cursor
    });

    await get().fetchAssets(
      { cursor: pagination.next_cursor },
      { append: true }
    );
  },

  refresh: async () => {
    logger.debug('♻️ assetsStore.refresh: Force refreshing');
    await get().fetchAssets({}, { force: true });
  },

  reset: () => {
    logger.debug('🔄 assetsStore.reset: Resetting store');
    set({
      assets: [],
      loading: false,
      lastFetch: null,
      stats: { total: 0, by_type: { image: 0, video: 0, lipsync: 0, upscaled: 0 } },
      pagination: {
        next_cursor: null,
        has_more: false,
        limit: 50
      },
      filters: {
        asset_type: 'all',
        sort: 'newest'
      }
    });
  },

  // Computed/Derived Values
  getGroupedAssets: (): AssetGroup[] => {
    const { assets } = get();

    if (!assets || assets.length === 0) {
      return [];
    }

    // Group assets by execution_id
    const groupsMap = new Map<string, AssetGroup>();

    assets.forEach(asset => {
      const executionId = asset.execution_id;

      if (!groupsMap.has(executionId)) {
        groupsMap.set(executionId, {
          execution_id: executionId,
          workflow_name: (asset as any).workflow_name,
          execution_created_at: (asset as any).execution_created_at || asset.created_at,
          assets: [],
          asset_count: 0
        });
      }

      const group = groupsMap.get(executionId)!;
      group.assets.push(asset);
    });

    // Convert to array and add asset_count
    const groups = Array.from(groupsMap.values()).map(group => ({
      ...group,
      asset_count: group.assets.length
    }));

    // Sort groups by execution date (newest first by default)
    groups.sort((a, b) => {
      const dateA = new Date(a.execution_created_at);
      const dateB = new Date(b.execution_created_at);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });

    logger.debug('📦 assetsStore.getGroupedAssets: Grouped assets', {
      totalAssets: assets.length,
      groupCount: groups.length,
      groups: groups.map(g => ({
        id: g.execution_id,
        count: g.asset_count,
        workflow: g.workflow_name
      }))
    });

    return groups;
  }
}));
