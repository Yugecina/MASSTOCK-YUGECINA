import { useState, useEffect, FormEvent } from 'react'
import { ClientLayout } from '../components/layout/ClientLayout'
import { useAuth } from '../hooks/useAuth'
import { settingsService } from '../services/settings'
import { Spinner } from '../components/ui/Spinner'
import DarkModeToggle from '../components/ui/DarkModeToggle'
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

/**
 * Settings Page - Dark Premium Style
 */
export function Settings(): JSX.Element {
  const { user } = useAuth()
  const [loading, setLoading] = useState<boolean>(true)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [showInviteForm, setShowInviteForm] = useState<boolean>(false)
  const [inviteEmail, setInviteEmail] = useState<string>('')
  const [inviting, setInviting] = useState<boolean>(false)

  useEffect(() => {
    loadData()
  }, [])

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

            {/* Company Information */}
            {profile?.client && (
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
            )}

            {/* Collaborators Management */}
            {isOwner && (
              <section className="settings-card">
                <div className="settings-card-header">
                  <h2 className="settings-card-title">Team Management</h2>
                  {!showInviteForm && (
                    <button className="btn btn-primary" disabled>
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
                      <button type="submit" className="btn btn-primary" disabled>
                        {inviting ? 'Sending...' : 'Send Invitation'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled
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
                            disabled
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

            {/* Security */}
            <section className="settings-card">
              <h2 className="settings-card-title">Security</h2>

              <div className="settings-security-row">
                <div className="settings-security-info">
                  <p className="settings-security-title">Change Password</p>
                  <p className="settings-security-desc">Update your password regularly to keep your account secure</p>
                </div>
                <button
                  className="btn btn-secondary"
                  disabled
                >
                  Change
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
