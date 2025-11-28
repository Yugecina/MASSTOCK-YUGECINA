import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Spinner } from '../ui/Spinner'
import { adminUserService } from '../../services/adminUserService'
import logger from '@/utils/logger'

// SVG Icons
const Icons = {
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

// Validation schemas
const createSchema = z.object({
  email: z.string().min(1, 'L\'email est requis').email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  name: z.string().min(1, 'Le nom est requis'),
  role: z.enum(['user', 'admin']).default('user'),
  status: z.enum(['active', 'suspended', 'pending']).default('active'),
  client_id: z.string().optional(),
  member_role: z.enum(['owner', 'collaborator']).default('collaborator')
}).refine((data) => {
  // Si role='user', client_id est obligatoire
  if (data.role === 'user' && !data.client_id) {
    return false
  }
  return true
}, {
  message: 'Le client est obligatoire pour les utilisateurs',
  path: ['client_id']
})

const editSchema = z.object({
  email: z.string().min(1, 'L\'email est requis').email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').optional().or(z.literal('')),
  name: z.string().min(1, 'Le nom est requis'),
  role: z.enum(['user', 'admin']),
  status: z.enum(['active', 'suspended', 'pending'])
})

/**
 * UserModal - Premium modal for creating/editing users
 */
export function UserModal({ mode = 'create', user = null, onClose, onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(false)

  const schema = mode === 'create' ? createSchema : editSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: user ? {
      email: user.email || '',
      password: '',
      name: user.name || '',
      role: user.role || 'user',
      status: user.status || 'active'
    } : {
      email: '',
      password: '',
      name: '',
      role: 'user',
      status: 'active',
      client_id: '',
      member_role: 'collaborator'
    }
  })

  // Watch role to conditionally show client fields
  const selectedRole = watch('role')

  // Load clients for dropdown
  useEffect(() => {
    async function loadClients() {
      try {
        setLoadingClients(true)
        const response = await adminUserService.getClients(1, { limit: 100 })
        const data = response.data?.data || response.data || {}
        setClients(data.clients || [])
      } catch (error) {
        logger.error('UserModal: Failed to load clients:', error)
      } finally {
        setLoadingClients(false)
      }
    }
    loadClients()
  }, [])

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      reset({
        email: user.email || '',
        password: '',
        name: user.name || '',
        role: user.role || 'user',
        status: user.status || 'active'
      })
    }
  }, [user, reset])

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      // Remove empty password in edit mode
      if (mode === 'edit' && !data.password) {
        delete data.password
      }
      await onSubmit(data)
    } catch (error) {
      logger.error('UserModal: Submit failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className="admin-user-modal-overlay" onClick={onClose}>
      <div className="admin-user-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-user-modal-header">
          <h2 className="admin-user-modal-title">
            {mode === 'create' ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur'}
          </h2>
          <button className="admin-user-modal-close" onClick={onClose}>
            <Icons.X />
          </button>
        </div>

        {/* Body */}
        <div className="admin-user-modal-body">
          <form className="admin-user-form" onSubmit={handleSubmit(handleFormSubmit)}>
            {/* Name */}
            <div className="admin-user-form-group admin-user-form-group--full">
              <label className="admin-user-form-label">Nom complet</label>
              <input
                type="text"
                className={`admin-user-form-input ${errors.name ? 'admin-user-form-input--error' : ''}`}
                placeholder="Jean Dupont"
                {...register('name')}
                disabled={isSubmitting}
              />
              {errors.name && (
                <span className="admin-user-form-error">{errors.name.message}</span>
              )}
            </div>

            {/* Email */}
            <div className="admin-user-form-group admin-user-form-group--full">
              <label className="admin-user-form-label">Email</label>
              <input
                type="email"
                className={`admin-user-form-input ${errors.email ? 'admin-user-form-input--error' : ''}`}
                placeholder="jean@example.com"
                {...register('email')}
                disabled={isSubmitting}
              />
              {errors.email && (
                <span className="admin-user-form-error">{errors.email.message}</span>
              )}
            </div>

            {/* Password */}
            <div className="admin-user-form-group admin-user-form-group--full">
              <label className="admin-user-form-label">
                Mot de passe
                {mode === 'edit' && <span> (laisser vide pour ne pas modifier)</span>}
              </label>
              <input
                type="password"
                className={`admin-user-form-input ${errors.password ? 'admin-user-form-input--error' : ''}`}
                placeholder={mode === 'edit' ? '••••••••' : 'Minimum 8 caractères'}
                {...register('password')}
                disabled={isSubmitting}
              />
              {errors.password && (
                <span className="admin-user-form-error">{errors.password.message}</span>
              )}
            </div>

            {/* Role & Status */}
            <div className="admin-user-form-row">
              <div className="admin-user-form-group">
                <label className="admin-user-form-label">Rôle système</label>
                <select
                  className={`admin-user-form-select ${errors.role ? 'admin-user-form-input--error' : ''}`}
                  {...register('role')}
                  disabled={isSubmitting}
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
                {errors.role && (
                  <span className="admin-user-form-error">{errors.role.message}</span>
                )}
              </div>

              <div className="admin-user-form-group">
                <label className="admin-user-form-label">Statut</label>
                <select
                  className={`admin-user-form-select ${errors.status ? 'admin-user-form-input--error' : ''}`}
                  {...register('status')}
                  disabled={isSubmitting}
                >
                  <option value="active">Actif</option>
                  <option value="suspended">Suspendu</option>
                  <option value="pending">En attente</option>
                </select>
                {errors.status && (
                  <span className="admin-user-form-error">{errors.status.message}</span>
                )}
              </div>
            </div>

            {/* Client & Member Role - Only for regular users in create mode */}
            {mode === 'create' && selectedRole === 'user' && (
              <div className="admin-user-form-row">
                <div className="admin-user-form-group">
                  <label className="admin-user-form-label">
                    Client <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <select
                    className={`admin-user-form-select ${errors.client_id ? 'admin-user-form-input--error' : ''}`}
                    {...register('client_id')}
                    disabled={isSubmitting || loadingClients}
                  >
                    <option value="">
                      {loadingClients ? 'Chargement...' : 'Sélectionner un client'}
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name || client.company_name || client.email}
                      </option>
                    ))}
                  </select>
                  {errors.client_id && (
                    <span className="admin-user-form-error">{errors.client_id.message}</span>
                  )}
                </div>

                <div className="admin-user-form-group">
                  <label className="admin-user-form-label">Rôle dans le client</label>
                  <select
                    className={`admin-user-form-select ${errors.member_role ? 'admin-user-form-input--error' : ''}`}
                    {...register('member_role')}
                    disabled={isSubmitting}
                  >
                    <option value="collaborator">Collaborateur</option>
                    <option value="owner">Propriétaire</option>
                  </select>
                  {errors.member_role && (
                    <span className="admin-user-form-error">{errors.member_role.message}</span>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="admin-user-modal-footer">
          <button
            type="button"
            className="admin-user-modal-btn admin-user-modal-btn--secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="admin-user-modal-btn admin-user-modal-btn--primary"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                <span>{mode === 'create' ? 'Création...' : 'Mise à jour...'}</span>
              </>
            ) : (
              mode === 'create' ? 'Créer l\'utilisateur' : 'Enregistrer'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
