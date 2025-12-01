import api from './api';

/**
 * Assets API Service
 */
class AssetsService {
  /**
   * Get all assets with pagination and filters
   * @param {Object} params - Query parameters
   * @param {string} params.cursor - Cursor for pagination
   * @param {number} params.limit - Items per page (default 50, max 100)
   * @param {string} params.asset_type - Filter by type: 'all', 'image', 'video', 'lipsync', 'upscaled'
   * @param {string} params.sort - Sort order: 'newest' or 'oldest'
   */
  async getAssets(params = {}) {
    try {
      const response = await api.get('/v1/assets', { params });
      console.log('✅ AssetsService.getAssets: Success', {
        count: response.data.assets.length,
        stats: response.data.stats
      });
      return response.data;
    } catch (error) {
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
