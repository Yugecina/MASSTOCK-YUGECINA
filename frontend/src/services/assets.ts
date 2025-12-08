import api from './api';
import { Asset } from '@/types';

/**
 * Assets API Service
 */

interface AssetsParams {
  cursor?: string;
  limit?: number;
  asset_type?: 'all' | 'image' | 'video' | 'lipsync' | 'upscaled';
  sort?: 'newest' | 'oldest';
}

interface AssetsStats {
  total: number;
  by_type: {
    image: number;
    video: number;
    lipsync: number;
    upscaled: number;
  };
}

interface AssetsResponse {
  assets: Asset[];
  stats: AssetsStats;
  next_cursor?: string;
  has_more: boolean;
}

class AssetsService {
  /**
   * Get all assets with pagination and filters
   * @param {Object} params - Query parameters
   * @param {string} params.cursor - Cursor for pagination
   * @param {number} params.limit - Items per page (default 50, max 100)
   * @param {string} params.asset_type - Filter by type: 'all', 'image', 'video', 'lipsync', 'upscaled'
   * @param {string} params.sort - Sort order: 'newest' or 'oldest'
   */
  async getAssets(params: AssetsParams = {}): Promise<AssetsResponse> {
    try {
      const response = await api.get('/v1/assets', { params });
      console.log('✅ AssetsService.getAssets: Success', {
        count: response.data.assets.length,
        stats: response.data.stats
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ AssetsService.getAssets: Error', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }
}

export default new AssetsService();
