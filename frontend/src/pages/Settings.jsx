import { useState, useEffect } from 'react'
import { ClientLayout } from '../components/layout/ClientLayout'
import { useAuth } from '../hooks/useAuth'
import { settingsService } from '../services/settings'
import { Spinner } from '../components/ui/Spinner'
import toast from 'react-hot-toast'
import logger from '@/utils/logger';


/**
 * Settings Page - "The Organic Factory" Design
 * Complete user and company settings with collaborator management
 */
export function Settings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [collaborators, setCollaborators] = useState([])
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  // Load profile and collaborators on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      logger.debug('📋 Settings: Loading profile and collaborators')
      setLoading(true)

      // Load profile
      const profileResponse = await settingsService.getProfile()
      logger.debug('✅ Settings: Profile loaded:', profileResponse)
      setProfile(profileResponse.data)

      // Load collaborators if user has a client
      if (profileResponse.data.client) {
        const collabResponse = await settingsService.getCollaborators()
        logger.debug('✅ Settings: Collaborators loaded:', collabResponse)
        setCollaborators(collabResponse.data.collaborators || [])
      }
    } catch (error) {
      logger.error('❌ Settings: Failed to load data:', {
        error,
        message: error.message,
        response: error.response
      })
      toast.error('Impossible de charger les paramètres')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteCollaborator = async (e) => {
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

      toast.success(
        `Invitation envoyée à ${inviteEmail}`,
        { duration: 5000 }
      )

      // Show temp password in toast (in production, should be sent via email)
      if (response.data.temp_password) {
        toast.success(
          `Mot de passe temporaire: ${response.data.temp_password}`,
          { duration: 10000 }
        )
      }

      setInviteEmail('')
      setShowInviteForm(false)

      // Reload collaborators
      await loadData()
    } catch (error) {
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

  const handleRemoveCollaborator = async (collaborator) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${collaborator.email} ?`)) {
      return
    }

    try {
      logger.debug('🗑️ Settings: Removing collaborator:', collaborator.id)

      await settingsService.removeCollaborator(collaborator.id)

      logger.debug('✅ Settings: Collaborator removed')
      toast.success(`${collaborator.email} a été retiré`)

      // Reload collaborators
      await loadData()
    } catch (error) {
      logger.error('❌ Settings: Failed to remove collaborator:', {
        error,
        message: error.message,
        response: error.response
      })

      const errorMessage = error.response?.data?.message || error.message || 'Échec du retrait'
      toast.error(errorMessage)
    }
  }

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return {
          background: 'var(--error-light)',
          color: 'var(--error-dark)'
        }
      case 'owner':
        return {
          background: 'var(--primary-light)',
          color: 'var(--primary-dark)'
        }
      case 'collaborator':
        return {
          background: 'var(--neutral-100)',
          color: 'var(--neutral-700)'
        }
      default:
        return {
          background: 'var(--neutral-100)',
          color: 'var(--neutral-700)'
        }
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return {
          background: 'var(--success-light)',
          color: 'var(--success-dark)'
        }
      case 'suspended':
        return {
          background: 'var(--warning-light)',
          color: 'var(--warning-dark)'
        }
      default:
        return {
          background: 'var(--neutral-100)',
          color: 'var(--neutral-700)'
        }
    }
  }

  const isOwner = profile?.user?.client_role === 'owner'

  return (
    <ClientLayout>
      <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
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
            Settings
          </h1>
          <p
            className="font-body"
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)'
            }}
          >
            Manage your account, company, and team
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px' }}>
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* User Information */}
            <div className="card-bento" style={{
              background: 'var(--canvas-pure)',
              padding: '32px',
              marginBottom: '24px'
            }}>
              <h2
                className="font-display"
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '24px'
                }}
              >
                User Information
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                <div>
                  <label
                    className="font-body"
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--neutral-500)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Email
                  </label>
                  <p
                    className="font-mono"
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      fontWeight: 500
                    }}
                  >
                    {profile?.user?.email}
                  </p>
                </div>

                <div>
                  <label
                    className="font-body"
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--neutral-500)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Platform Role
                  </label>
                  <span
                    className="badge"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      ...getRoleBadgeColor(profile?.user?.role),
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {profile?.user?.role}
                  </span>
                </div>

                {profile?.user?.client_role && (
                  <div>
                    <label
                      className="font-body"
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--neutral-500)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Company Role
                    </label>
                    <span
                      className="badge"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        ...getRoleBadgeColor(profile?.user?.client_role)
                      }}
                    >
                      {profile?.user?.client_role}
                    </span>
                  </div>
                )}

                <div>
                  <label
                    className="font-body"
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--neutral-500)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Status
                  </label>
                  <span
                    className="badge"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      ...getStatusBadgeColor(profile?.user?.status)
                    }}
                  >
                    {profile?.user?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Information */}
            {profile?.client && (
              <div className="card-bento" style={{
                background: 'var(--canvas-pure)',
                padding: '32px',
                marginBottom: '24px'
              }}>
                <h2
                  className="font-display"
                  style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '24px'
                  }}
                >
                  Company Information
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
                  <div>
                    <label
                      className="font-body"
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--neutral-500)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Company Name
                    </label>
                    <p
                      className="font-display"
                      style={{
                        fontSize: '18px',
                        color: 'var(--text-primary)',
                        fontWeight: 600
                      }}
                    >
                      {profile.client.company_name || profile.client.name}
                    </p>
                  </div>

                  <div>
                    <label
                      className="font-body"
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--neutral-500)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Plan
                    </label>
                    <span
                      className="badge"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        background: 'var(--primary-light)',
                        color: 'var(--primary-dark)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      {profile.client.plan}
                    </span>
                  </div>

                  <div>
                    <label
                      className="font-body"
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--neutral-500)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Owner
                    </label>
                    <p
                      className="font-mono"
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                        fontWeight: 500
                      }}
                    >
                      {profile.client.owner?.email}
                    </p>
                  </div>

                  <div>
                    <label
                      className="font-body"
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--neutral-500)',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Team Members
                    </label>
                    <p
                      className="font-mono"
                      style={{
                        fontSize: '18px',
                        color: 'var(--text-primary)',
                        fontWeight: 700
                      }}
                    >
                      {profile.client.collaborators_count || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Collaborators Management (Only for owners) */}
            {isOwner && (
              <div className="card-bento" style={{
                background: 'var(--canvas-pure)',
                padding: '32px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <h2
                    className="font-display"
                    style={{
                      fontSize: '24px',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}
                  >
                    Team Management
                  </h2>
                  {!showInviteForm && (
                    <button
                      className="btn btn-primary-lime"
                      style={{ padding: '10px 20px', fontSize: '14px' }}
                      onClick={() => setShowInviteForm(true)}
                    >
                      + Invite Collaborator
                    </button>
                  )}
                </div>

                {/* Invite Form */}
                {showInviteForm && (
                  <form
                    onSubmit={handleInviteCollaborator}
                    style={{
                      padding: '20px',
                      background: 'var(--neutral-50)',
                      borderRadius: '12px',
                      marginBottom: '24px',
                      border: '2px solid var(--primary)'
                    }}
                  >
                    <h3
                      className="font-display"
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '16px'
                      }}
                    >
                      Invite New Collaborator
                    </h3>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="collaborator@email.com"
                        className="input-field"
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          fontSize: '14px'
                        }}
                        disabled={inviting}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary-lime"
                        style={{ padding: '12px 24px', fontSize: '14px' }}
                        disabled={inviting}
                      >
                        {inviting ? 'Sending...' : 'Send Invitation'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ padding: '12px 24px', fontSize: '14px' }}
                        onClick={() => {
                          setShowInviteForm(false)
                          setInviteEmail('')
                        }}
                        disabled={inviting}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Collaborators List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {collaborators.map((collab) => (
                    <div
                      key={collab.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 20px',
                        background: 'var(--neutral-50)',
                        borderRadius: '12px',
                        border: '1px solid var(--neutral-200)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          className="font-mono"
                          style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            marginBottom: '4px'
                          }}
                        >
                          {collab.email}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span
                            className="badge"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '4px',
                              ...getRoleBadgeColor(collab.client_role)
                            }}
                          >
                            {collab.client_role}
                          </span>
                          <span
                            className="badge"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '4px',
                              ...getStatusBadgeColor(collab.status)
                            }}
                          >
                            {collab.status}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <p
                          className="font-body"
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-tertiary)',
                            marginRight: '12px'
                          }}
                        >
                          Joined {new Date(collab.created_at).toLocaleDateString()}
                        </p>
                        {collab.client_role !== 'owner' && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '6px 16px', fontSize: '12px' }}
                            onClick={() => handleRemoveCollaborator(collab)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {collaborators.length === 0 && (
                    <div
                      style={{
                        padding: '32px',
                        textAlign: 'center',
                        color: 'var(--text-tertiary)'
                      }}
                    >
                      <p className="font-body" style={{ fontSize: '14px' }}>
                        No team members yet. Invite your first collaborator!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security */}
            <div className="card-bento" style={{
              background: 'var(--canvas-pure)',
              padding: '32px'
            }}>
              <h2
                className="font-display"
                style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '24px'
                }}
              >
                Security
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p
                    className="font-body"
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: '4px'
                    }}
                  >
                    Change Password
                  </p>
                  <p
                    className="font-body"
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-tertiary)'
                    }}
                  >
                    Update your password regularly to keep your account secure
                  </p>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '10px 24px', fontSize: '14px' }}
                  onClick={() => toast.info('Change password feature coming soon')}
                >
                  Change
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </ClientLayout>
  )
}
