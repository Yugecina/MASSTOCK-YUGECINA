import { useState, useEffect, FormEvent } from 'react'
import { ClientLayout } from '../components/layout/ClientLayout'
import { useAuth } from '../hooks/useAuth'
import { settingsService } from '../services/settings'
import { Spinner } from '../components/ui/Spinner'
import DarkModeToggle from '../components/ui/DarkModeToggle'
import { NotificationSettings } from '../components/settings/NotificationSettings'
import { InterfaceSettings } from '../components/settings/InterfaceSettings'
import { SecuritySettings } from '../components/settings/SecuritySettings'
import { usePreferencesStore } from '../store/preferencesStore'
import toast from 'react-hot-toast'
import logger from '@/utils/logger'
import './Settings.css'

interface UserProfile {
  email: string
  role: string
  client_role?: string
  status: string
}

interface ClientInfo {
  company_name?: string
  name: string
  plan: string
  owner?: {
    email: string
  }
  collaborators_count?: number
}

interface ProfileResponse {
  user: UserProfile
  client?: ClientInfo
}

interface Collaborator {
  id: string
  email: string
  client_role: string
  status: string
  created_at: string
}

interface SettingsTab {
  id: string
  label: string
  icon: JSX.Element
}

const SETTINGS_TABS: SettingsTab[] = [
  {
    id: 'profile',
    label: 'Profil',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )
  },
  {
    id: 'team',
    label: 'Équipe',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    id: 'preferences',
    label: 'Préférences',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
      </svg>
    )
  },
  {
    id: 'security',
    label: 'Sécurité',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    )
  },
]

/**
 * Settings Page - Dark Premium Style
 */
export function Settings(): JSX.Element {
  const { user } = useAuth()
  const { loadPreferences } = usePreferencesStore()
  const [loading, setLoading] = useState<boolean>(true)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [showInviteForm, setShowInviteForm] = useState<boolean>(false)
  const [inviteEmail, setInviteEmail] = useState<string>('')
  const [inviting, setInviting] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('profile')

  useEffect(() => {
    loadData()
    loadPreferences()
  }, [])

  // Sync tab with URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash && SETTINGS_TABS.some(tab => tab.id === hash)) {
      setActiveTab(hash)
    }
  }, [])

  const handleTabChange = (tabId: string): void => {
    setActiveTab(tabId)
    window.history.replaceState(null, '', `#${tabId}`)
  }

  const loadData = async (): Promise<void> => {
    try {
      logger.debug('📋 Settings: Loading profile and collaborators')
      setLoading(true)

      const profileResponse = await settingsService.getProfile()
      logger.debug('✅ Settings: Profile loaded:', profileResponse)
      setProfile(profileResponse.data)

      if (profileResponse.data.client) {
        const collabResponse = await settingsService.getCollaborators()
        logger.debug('✅ Settings: Collaborators loaded:', collabResponse)
        setCollaborators(collabResponse.data.collaborators || [])
      }
    } catch (error) {
      logger.error('❌ Settings: Failed to load data:', {
        error,
        message: (error as any).message,
        response: (error as any).response
      })
      toast.error('Impossible de charger les paramètres')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteCollaborator = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    if (!inviteEmail) {
      toast.error('Veuillez saisir une adresse email')
      return
    }

    try {
      logger.debug('✉️ Settings: Inviting collaborator:', inviteEmail)
      setInviting(true)

      const response = await settingsService.inviteCollaborator({
        email: inviteEmail,
        role: 'user'
      })

      logger.debug('✅ Settings: Invitation sent:', response)
      toast.success(`Invitation envoyée à ${inviteEmail}`, { duration: 5000 })

      if (response.data.temp_password) {
        toast.success(`Mot de passe temporaire: ${response.data.temp_password}`, { duration: 10000 })
      }

      setInviteEmail('')
      setShowInviteForm(false)
      await loadData()
    } catch (error: any) {
      logger.error('❌ Settings: Invitation failed:', {
        error,
        message: error.message,
        response: error.response
      })
      const errorMessage = error.response?.data?.message || error.message || 'Échec de l\'invitation'
      toast.error(errorMessage)
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveCollaborator = async (collaborator: Collaborator): Promise<void> => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${collaborator.email} ?`)) {
      return
    }

    try {
      logger.debug('🗑️ Settings: Removing collaborator:', collaborator.id)
      await settingsService.removeCollaborator(collaborator.id)
      logger.debug('✅ Settings: Collaborator removed')
      toast.success(`${collaborator.email} a été retiré`)
      await loadData()
    } catch (error: any) {
      logger.error('❌ Settings: Failed to remove collaborator:', {
        error,
        message: error.message,
        response: error.response
      })
      const errorMessage = error.response?.data?.message || error.message || 'Échec du retrait'
      toast.error(errorMessage)
    }
  }

  const isOwner = profile?.user?.client_role === 'owner'

  return (
    <ClientLayout>
      <div className="settings-page">
        {/* Header */}
        <header className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your account, company, and team</p>
        </header>

        {loading ? (
          <div className="settings-loading">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Tabs Navigation */}
            <div className="settings-tabs">
              {SETTINGS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`settings-tab ${activeTab === tab.id ? 'settings-tab--active' : ''}`}
                >
                  <span className="settings-tab-icon">{tab.icon}</span>
                  <span className="settings-tab-label">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="settings-tab-content">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="settings-content">
                  {/* User Information */}
                  <section className="settings-card">
              <h2 className="settings-card-title">User Information</h2>

              <div className="settings-grid">
                <div className="settings-field">
                  <label className="settings-label">Email</label>
                  <p className="settings-value settings-value--mono">{profile?.user?.email}</p>
                </div>

                <div className="settings-field">
                  <label className="settings-label">Platform Role</label>
                  <span className={`settings-badge ${profile?.user?.role === 'admin' ? 'settings-badge--danger' : 'settings-badge--primary'}`}>
                    {profile?.user?.role}
                  </span>
                </div>

                {profile?.user?.client_role && (
                  <div className="settings-field">
                    <label className="settings-label">Company Role</label>
                    <span className={`settings-badge ${profile?.user?.client_role === 'owner' ? 'settings-badge--primary' : ''}`}>
                      {profile?.user?.client_role}
                    </span>
                  </div>
                )}

                <div className="settings-field">
                  <label className="settings-label">Status</label>
                  <span className={`settings-badge ${profile?.user?.status === 'active' ? 'settings-badge--success' : 'settings-badge--warning'}`}>
                    {profile?.user?.status}
                  </span>
                </div>
              </div>
            </section>
                </div>
              )}

              {/* Team Tab */}
              {activeTab === 'team' && (
                <div className="settings-content">
                  {/* Company Information */}
                  {profile?.client ? (
                    <>
                      <section className="settings-card">
                <h2 className="settings-card-title">Company Information</h2>

                <div className="settings-grid">
                  <div className="settings-field">
                    <label className="settings-label">Company Name</label>
                    <p className="settings-value settings-value--large">
                      {profile.client.company_name || profile.client.name}
                    </p>
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">Plan</label>
                    <span className="settings-badge settings-badge--primary">
                      {profile.client.plan}
                    </span>
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">Owner</label>
                    <p className="settings-value settings-value--mono">{profile.client.owner?.email}</p>
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">Team Members</label>
                    <p className="settings-value settings-value--large">{profile.client.collaborators_count || 0}</p>
                  </div>
                </div>
              </section>

              {/* Collaborators Management */}
              {isOwner && (
              <section className="settings-card">
                <div className="settings-card-header">
                  <h2 className="settings-card-title">Team Management</h2>
                  {!showInviteForm && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowInviteForm(true)}
                    >
                      + Invite Collaborator
                    </button>
                  )}
                </div>

                {/* Invite Form */}
                {showInviteForm && (
                  <form onSubmit={handleInviteCollaborator} className="settings-invite-form">
                    <h3 className="settings-invite-title">Invite New Collaborator</h3>
                    <div className="settings-invite-row">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="collaborator@email.com"
                        className="settings-input"
                        disabled={inviting}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={inviting}
                      >
                        {inviting ? 'Sending...' : 'Send Invitation'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowInviteForm(false)}
                        disabled={inviting}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Collaborators List */}
                <div className="settings-collaborators">
                  {collaborators.map((collab) => (
                    <div key={collab.id} className="settings-collaborator">
                      <div className="settings-collaborator-info">
                        <p className="settings-collaborator-email">{collab.email}</p>
                        <div className="settings-collaborator-badges">
                          <span className={`settings-badge-sm ${collab.client_role === 'owner' ? 'settings-badge-sm--primary' : ''}`}>
                            {collab.client_role}
                          </span>
                          <span className={`settings-badge-sm ${collab.status === 'active' ? 'settings-badge-sm--success' : 'settings-badge-sm--warning'}`}>
                            {collab.status}
                          </span>
                        </div>
                      </div>
                      <div className="settings-collaborator-actions">
                        <span className="settings-collaborator-date">
                          Joined {new Date(collab.created_at).toLocaleDateString()}
                        </span>
                        {collab.client_role !== 'owner' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveCollaborator(collab)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {collaborators.length === 0 && (
                    <div className="settings-empty">
                      <p>No team members yet. Invite your first collaborator!</p>
                    </div>
                  )}
                </div>
              </section>
              )}
                    </>
                  ) : (
                    <section className="settings-card">
                      <div className="settings-empty">
                        <p>Aucune entreprise associée.</p>
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="settings-content">
                  {/* Notifications */}
                  <section className="settings-card">
              <NotificationSettings />
            </section>

            {/* Interface & Display */}
            <section className="settings-card">
              <InterfaceSettings />
            </section>

            {/* Appearance */}
            <section className="settings-card">
              <h2 className="settings-card-title">Appearance</h2>

              <div className="settings-security-row">
                <div className="settings-security-info">
                  <p className="settings-security-title">Dark Mode</p>
                  <p className="settings-security-desc">Toggle between dark and light theme</p>
                </div>
                <div className="settings-dark-mode-wrapper">
                  <DarkModeToggle />
                </div>
              </div>
            </section>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="settings-content">
                  <section className="settings-card">
              <SecuritySettings />
            </section>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ClientLayout>
  )
}
