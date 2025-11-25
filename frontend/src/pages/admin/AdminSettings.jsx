import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminService } from '../../services/admin'
import logger from '@/utils/logger'

/**
 * AdminSettings - Dark Premium Style
 */
export function AdminSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'api', label: 'API Keys', icon: '🔑' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' },
    { id: 'billing', label: 'Billing', icon: '💳' },
  ]

  useEffect(() => {
    async function loadSettings() {
      try {
        logger.debug('⚙️ AdminSettings: Loading settings...')
        const response = await adminService.getSettings()
        logger.debug('✅ AdminSettings: Settings loaded:', response)
        setSettings(response.data)
      } catch (error) {
        logger.error('❌ AdminSettings: Failed to load settings:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      logger.debug('💾 AdminSettings: Saving settings...')
      await adminService.updateSettings(settings)
      logger.debug('✅ AdminSettings: Settings saved successfully')
      toast.success('Settings saved successfully')
    } catch (error) {
      logger.error('❌ AdminSettings: Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-page admin-loading">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    )
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
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings?.system, appName: e.target.value }
                    })}
                    className="admin-settings-input"
                  />
                </div>

                <div className="admin-settings-field">
                  <label className="admin-settings-label">Version</label>
                  <input
                    type="text"
                    value={settings?.system?.appVersion || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings?.system, appVersion: e.target.value }
                    })}
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
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings?.system, maintenanceMode: e.target.checked }
                    })}
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
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings?.system, allowRegistration: e.target.checked }
                    })}
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
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings?.email, smtpHost: e.target.value }
                    })}
                    className="admin-settings-input"
                  />
                </div>

                <div className="admin-settings-field">
                  <label className="admin-settings-label">From Email</label>
                  <input
                    type="email"
                    value={settings?.email?.fromEmail || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings?.email, fromEmail: e.target.value }
                    })}
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
          <button className="btn btn-secondary" onClick={() => toast.info('Reset feature coming soon')}>
            Reset to Defaults
          </button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
