import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Spinner } from '../../components/ui/Spinner'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { adminService } from '../../services/admin'
import logger from '@/utils/logger';


/**
 * AdminSettings - "The Organic Factory" Design
 * Horizontal tabs with Indigo active state
 * Save Changes button in Lime (critical CTA)
 * Toggle switches with Lime when active
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
        logger.error('❌ AdminSettings: Failed to load settings:', {
          error,
          message: error.message,
          response: error.response
        })
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
      logger.error('❌ AdminSettings: Failed to save settings:', {
        error,
        message: error.message,
        response: error.response
      })
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}>
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ padding: '48px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1
            className="font-display"
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px',
              letterSpacing: '-0.02em'
            }}
          >
            Settings & Configuration
          </h1>
          <p
            className="font-body"
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)'
            }}
          >
            Manage platform settings and configurations
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '32px',
          borderBottom: '2px solid var(--neutral-200)',
          paddingBottom: '0'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid var(--indigo-600)' : '3px solid transparent',
                background: activeTab === tab.id ? 'var(--indigo-50)' : 'transparent',
                color: activeTab === tab.id ? 'var(--indigo-600)' : 'var(--neutral-600)',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
                marginBottom: '-2px',
                borderRadius: '8px 8px 0 0'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'var(--neutral-50)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* System Settings */}
            <div
              className="card-bento"
              style={{
                background: 'var(--canvas-pure)',
                padding: '32px'
              }}
            >
              <h2
                className="font-display"
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '24px'
                }}
              >
                System Settings
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label
                    className="font-body"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}
                  >
                    Application Name
                  </label>
                  <input
                    type="text"
                    value={settings?.system?.appName || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings?.system, appName: e.target.value }
                    })}
                    className="input-field"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid var(--neutral-200)',
                      borderRadius: '8px',
                      background: 'var(--canvas-pure)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label
                    className="font-body"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}
                  >
                    Version
                  </label>
                  <input
                    type="text"
                    value={settings?.system?.appVersion || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings?.system, appVersion: e.target.value }
                    })}
                    className="input-field"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid var(--neutral-200)',
                      borderRadius: '8px',
                      background: 'var(--canvas-pure)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Toggle Switches */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'var(--neutral-50)',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div
                      className="font-body"
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        marginBottom: '4px'
                      }}
                    >
                      Maintenance Mode
                    </div>
                    <div
                      className="font-body"
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Put system in maintenance mode
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings?.system?.maintenanceMode || false}
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings?.system, maintenanceMode: e.target.checked }
                    })}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: 'var(--lime-500)'
                    }}
                  />
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'var(--neutral-50)',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div
                      className="font-body"
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        marginBottom: '4px'
                      }}
                    >
                      Allow Registration
                    </div>
                    <div
                      className="font-body"
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Enable new user registration
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings?.system?.allowRegistration || false}
                    onChange={(e) => setSettings({
                      ...settings,
                      system: { ...settings?.system, allowRegistration: e.target.checked }
                    })}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer',
                      accentColor: 'var(--lime-500)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Email Configuration */}
            <div
              className="card-bento"
              style={{
                background: 'var(--canvas-pure)',
                padding: '32px'
              }}
            >
              <h2
                className="font-display"
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '24px'
                }}
              >
                Email Configuration
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label
                    className="font-body"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}
                  >
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={settings?.email?.smtpHost || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings?.email, smtpHost: e.target.value }
                    })}
                    className="input-field"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid var(--neutral-200)',
                      borderRadius: '8px',
                      background: 'var(--canvas-pure)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label
                    className="font-body"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}
                  >
                    From Email
                  </label>
                  <input
                    type="email"
                    value={settings?.email?.fromEmail || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings?.email, fromEmail: e.target.value }
                    })}
                    className="input-field"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid var(--neutral-200)',
                      borderRadius: '8px',
                      background: 'var(--canvas-pure)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div
            className="card-bento"
            style={{
              background: 'var(--canvas-pure)',
              padding: '64px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔑</div>
            <h3
              className="font-display"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              API Keys Management
            </h3>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
            >
              Feature coming soon
            </p>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div
            className="card-bento"
            style={{
              background: 'var(--canvas-pure)',
              padding: '64px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔗</div>
            <h3
              className="font-display"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              Third-party Integrations
            </h3>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
            >
              Feature coming soon
            </p>
          </div>
        )}

        {activeTab === 'billing' && (
          <div
            className="card-bento"
            style={{
              background: 'var(--canvas-pure)',
              padding: '64px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💳</div>
            <h3
              className="font-display"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              Billing & Payments
            </h3>
            <p
              className="font-body"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
            >
              Feature coming soon
            </p>
          </div>
        )}

        {/* Save Button (Lime - Critical CTA) */}
        <div style={{ marginTop: '32px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '12px 24px' }}
            onClick={() => toast.info('Reset feature coming soon')}
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary-lime"
            style={{ padding: '12px 32px', fontSize: '16px' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}
