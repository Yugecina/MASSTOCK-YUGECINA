/**
 * AdminSettings Page - TypeScript
 * Settings and configuration management
 * PURE CSS ONLY - No Tailwind
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/ui/Spinner';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminDashboardService } from '../../services/adminDashboardService';
import logger from '@/utils/logger';

interface SystemSettings {
  appName?: string;
  appVersion?: string;
  maintenanceMode?: boolean;
  allowRegistration?: boolean;
}

interface EmailSettings {
  smtpHost?: string;
  fromEmail?: string;
}

interface Settings {
  system?: SystemSettings;
  email?: EmailSettings;
}

interface Tab {
  id: string;
  label: string;
  icon: string;
}

/**
 * AdminSettings Component
 * Dark Premium Style - Platform settings and configurations
 */
export function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const tabs: Tab[] = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'api', label: 'API Keys', icon: '🔑' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' },
    { id: 'billing', label: 'Billing', icon: '💳' },
  ];

  useEffect(() => {
    async function loadSettings() {
      try {
        logger.debug('⚙️ AdminSettings: Loading settings...');
        const response = await adminDashboardService.getSettings();
        logger.debug('✅ AdminSettings: Settings loaded:', response);
        setSettings(response.data);
      } catch (error: any) {
        logger.error('❌ AdminSettings: Failed to load settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      logger.debug('💾 AdminSettings: Saving settings...');
      await adminDashboardService.updateSettings(settings);
      logger.debug('✅ AdminSettings: Settings saved successfully');
      toast.success('Settings saved successfully');
    } catch (error: any) {
      logger.error('❌ AdminSettings: Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSystemSetting = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      system: { ...prev?.system, [key]: value }
    }));
  };

  const updateEmailSetting = <K extends keyof EmailSettings>(
    key: K,
    value: EmailSettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      email: { ...prev?.email, [key]: value }
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page admin-loading">
          <Spinner size="lg" />
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
            <h1 className="admin-title">Settings & Configuration</h1>
            <p className="admin-subtitle">Manage platform settings and configurations</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`admin-tab ${activeTab === tab.id ? 'admin-tab--active' : ''}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <div className="admin-settings-content">
            {/* System Settings */}
            <div className="admin-card">
              <h2 className="admin-card-title">System Settings</h2>

              <div className="admin-settings-fields">
                <div className="admin-settings-field">
                  <label className="admin-settings-label">Application Name</label>
                  <input
                    type="text"
                    value={settings?.system?.appName || ''}
                    onChange={(e) => updateSystemSetting('appName', e.target.value)}
                    className="admin-settings-input"
                  />
                </div>

                <div className="admin-settings-field">
                  <label className="admin-settings-label">Version</label>
                  <input
                    type="text"
                    value={settings?.system?.appVersion || ''}
                    onChange={(e) => updateSystemSetting('appVersion', e.target.value)}
                    className="admin-settings-input"
                  />
                </div>

                {/* Toggles */}
                <div className="admin-settings-toggle">
                  <div className="admin-settings-toggle-info">
                    <span className="admin-settings-toggle-title">Maintenance Mode</span>
                    <span className="admin-settings-toggle-desc">Put system in maintenance mode</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings?.system?.maintenanceMode || false}
                    onChange={(e) => updateSystemSetting('maintenanceMode', e.target.checked)}
                    className="admin-settings-checkbox"
                  />
                </div>

                <div className="admin-settings-toggle">
                  <div className="admin-settings-toggle-info">
                    <span className="admin-settings-toggle-title">Allow Registration</span>
                    <span className="admin-settings-toggle-desc">Enable new user registration</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings?.system?.allowRegistration || false}
                    onChange={(e) => updateSystemSetting('allowRegistration', e.target.checked)}
                    className="admin-settings-checkbox"
                  />
                </div>
              </div>
            </div>

            {/* Email Configuration */}
            <div className="admin-card">
              <h2 className="admin-card-title">Email Configuration</h2>

              <div className="admin-settings-fields">
                <div className="admin-settings-field">
                  <label className="admin-settings-label">SMTP Host</label>
                  <input
                    type="text"
                    value={settings?.email?.smtpHost || ''}
                    onChange={(e) => updateEmailSetting('smtpHost', e.target.value)}
                    className="admin-settings-input"
                  />
                </div>

                <div className="admin-settings-field">
                  <label className="admin-settings-label">From Email</label>
                  <input
                    type="email"
                    value={settings?.email?.fromEmail || ''}
                    onChange={(e) => updateEmailSetting('fromEmail', e.target.value)}
                    className="admin-settings-input"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="admin-card">
            <div className="admin-empty">
              <div className="admin-empty-icon">🔑</div>
              <h3 className="admin-empty-title">API Keys Management</h3>
              <p className="admin-empty-text">Feature coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="admin-card">
            <div className="admin-empty">
              <div className="admin-empty-icon">🔗</div>
              <h3 className="admin-empty-title">Third-party Integrations</h3>
              <p className="admin-empty-text">Feature coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="admin-card">
            <div className="admin-empty">
              <div className="admin-empty-icon">💳</div>
              <h3 className="admin-empty-title">Billing & Payments</h3>
              <p className="admin-empty-text">Feature coming soon</p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="admin-settings-actions">
          <button className="btn btn-secondary" onClick={() => toast('Reset feature coming soon', { icon: 'ℹ️' })}>
            Reset to Defaults
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
