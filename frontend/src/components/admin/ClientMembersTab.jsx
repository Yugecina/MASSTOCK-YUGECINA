import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import useAdminClientStore from '../../store/adminClientStore'
import { Spinner } from '../ui/Spinner'
import { AddMemberModal } from './AddMemberModal'

/**
 * ClientMembersTab - List and manage client members
 */
export function ClientMembersTab({ clientId }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [changingRole, setChangingRole] = useState(null)

  const {
    members,
    membersLoading,
    membersError,
    fetchMembers,
    updateMemberRole,
    removeMember
  } = useAdminClientStore()

  console.log('👥 ClientMembersTab: Render', {
    clientId,
    members,
    membersLoading,
    membersError
  })

  useEffect(() => {
    console.log('👥 ClientMembersTab: useEffect - fetching members', { clientId })
    fetchMembers(clientId)
  }, [clientId, fetchMembers])

  const handleRoleChange = async (memberId, newRole) => {
    setChangingRole(memberId)
    const result = await updateMemberRole(clientId, memberId, newRole)
    setChangingRole(null)

    if (result.success) {
      toast.success(`Role updated to ${newRole}`)
    } else {
      toast.error(result.error || 'Failed to update role')
    }
  }

  const handleRemove = async (memberId, email) => {
    if (!confirm(`Remove ${email} from this client?`)) return

    const result = await removeMember(clientId, memberId)
    if (result.success) {
      toast.success('Member removed successfully')
    } else {
      toast.error(result.error || 'Failed to remove member')
    }
  }

  if (membersLoading) {
    return (
      <div className="admin-loading">
        <Spinner size="md" />
      </div>
    )
  }

  if (membersError) {
    return (
      <div className="admin-card">
        <div className="admin-empty">
          <div className="admin-empty-icon">❌</div>
          <h3 className="admin-empty-title">Error loading members</h3>
          <p className="admin-empty-text">{membersError}</p>
        </div>
      </div>
    )
  }

  const owners = members.filter(m => m.role === 'owner')
  const collaborators = members.filter(m => m.role === 'collaborator')

  return (
    <div className="admin-tab-members">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h3 className="admin-section-title">Team Members</h3>
          <p className="admin-section-subtitle">
            {members.length} member{members.length !== 1 ? 's' : ''} ({owners.length} owner{owners.length !== 1 ? 's' : ''}, {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''})
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Member
        </button>
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty">
            <div className="admin-empty-icon">👥</div>
            <h3 className="admin-empty-title">No members yet</h3>
            <p className="admin-empty-text">Add members to give them access to this client</p>
          </div>
        </div>
      ) : (
        <div className="admin-members-list">
          {members.map((member) => (
            <div key={member.id} className="admin-member-row">
              <div className="admin-member-info">
                <div className="admin-member-avatar">
                  {member.user?.email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="admin-member-details">
                  <span className="admin-member-email">{member.user?.email || 'Unknown'}</span>
                  <span className="admin-member-meta">
                    Added {member.created_at ? new Date(member.created_at).toLocaleDateString() : '-'}
                    {member.user?.last_login && (
                      <> • Last login: {new Date(member.user.last_login).toLocaleDateString()}</>
                    )}
                  </span>
                </div>
              </div>

              <div className="admin-member-actions">
                <select
                  className="admin-select admin-select--sm"
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  disabled={changingRole === member.id}
                >
                  <option value="owner">Owner</option>
                  <option value="collaborator">Collaborator</option>
                </select>

                <span className={`admin-member-role-badge admin-member-role-badge--${member.role}`}>
                  {member.role}
                </span>

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleRemove(member.id, member.user?.email)}
                  title="Remove member"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role Legend */}
      <div className="admin-card admin-card--muted">
        <h4 className="admin-card-subtitle">Role Permissions</h4>
        <div className="admin-role-legend">
          <div className="admin-role-item">
            <span className="admin-member-role-badge admin-member-role-badge--owner">Owner</span>
            <span>Full access: workflows, executions, billing, team management</span>
          </div>
          <div className="admin-role-item">
            <span className="admin-member-role-badge admin-member-role-badge--collaborator">Collaborator</span>
            <span>Limited access: workflows and execution results only</span>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <AddMemberModal
          clientId={clientId}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
