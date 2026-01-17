/**
 * Preferences Store
 * Zustand store for managing user preferences
 */

import { create } from 'zustand';
import { settingsService } from '../services/settings';
import logger from '@/utils/logger';

interface UserPreferences {
  notifications_toast: boolean;
  notifications_sound: boolean;
  notifications_email: boolean;
  language: 'fr' | 'en';
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  results_per_page: 10 | 25 | 50 | 100;
  theme: 'dark' | 'light';
}

interface PreferencesStore {
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;

  loadPreferences: () => Promise<void>;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  preferences: null,
  loading: false,
  error: null,

  loadPreferences: async () => {
    set({ loading: true, error: null });
    try {
      logger.debug('🔍 preferencesStore: Loading user preferences');
      const response = await settingsService.getPreferences();

      logger.debug('✅ preferencesStore: Preferences loaded', {
        data: response.data,
        keys: Object.keys(response.data)
      });

      set({ preferences: response.data, loading: false });
    } catch (error: any) {
      logger.error('❌ preferencesStore.loadPreferences: Failed to load preferences', {
        error,
        message: error.message,
        response: error.response,
        status: error.response?.status
      });
      set({ error: 'Failed to load preferences', loading: false });
    }
  },

  updatePreference: async (key, value) => {
    const current = get().preferences;
    if (!current) {
      logger.error('❌ preferencesStore.updatePreference: No preferences loaded');
      return;
    }

    // Optimistic update
    const optimisticPrefs = { ...current, [key]: value };
    set({ preferences: optimisticPrefs });

    try {
      logger.debug(`✏️ preferencesStore: Updating preference ${String(key)}`, { value });

      const response = await settingsService.updatePreferences({ [key]: value });

      logger.debug('✅ preferencesStore: Preference updated', {
        key,
        value,
        response: response.data
      });

      // Update with server response
      set({ preferences: response.data });
    } catch (error: any) {
      // Rollback on error
      logger.error('❌ preferencesStore.updatePreference: Update failed', {
        error,
        message: error.message,
        response: error.response,
        key,
        value
      });
      set({ preferences: current, error: 'Failed to update preference' });
      throw error;
    }
  },

  updatePreferences: async (updates) => {
    const current = get().preferences;
    if (!current) {
      logger.error('❌ preferencesStore.updatePreferences: No preferences loaded');
      return;
    }

    // Optimistic update
    const optimisticPrefs = { ...current, ...updates };
    set({ preferences: optimisticPrefs });

    try {
      logger.debug('✏️ preferencesStore: Updating multiple preferences', { updates });

      const response = await settingsService.updatePreferences(updates);

      logger.debug('✅ preferencesStore: Preferences updated', {
        updates,
        response: response.data
      });

      // Update with server response
      set({ preferences: response.data });
    } catch (error: any) {
      // Rollback on error
      logger.error('❌ preferencesStore.updatePreferences: Update failed', {
        error,
        message: error.message,
        response: error.response,
        updates
      });
      set({ preferences: current, error: 'Failed to update preferences' });
      throw error;
    }
  }
}));
