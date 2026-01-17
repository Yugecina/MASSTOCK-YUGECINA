/**
 * CreateEditUserModal Component
 * Modal for creating or editing users (admin panel)
 */

import { useState, FormEvent } from 'react';
import { XIcon } from '../icons/AdminIcons';
import type { AdminUser } from '@/types/admin';

interface CreateEditUserModalProps {
  /** User being edited (null if creating new user) */
  user: AdminUser | null;
  /** Whether modal is visible */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when form is submitted */
  onSubmit: (formData: UserFormData) => Promise<void>;
}

export interface UserFormData {
  email: string;
  password: string;
  name: string;
  company_name: string;
  role: 'user' | 'admin';
}

export function CreateEditUserModal({
  user,
  isOpen,
  onClose,
  onSubmit,
}: CreateEditUserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: user?.email || '',
    password: '',
    name: user?.name || '',
    company_name: user?.company_name || '',
    role: user?.role === 'admin' ? 'admin' : 'user',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);
      await onSubmit(formData);

      // Reset form
      setFormData({
        email: '',
        password: '',
        name: '',
        company_name: '',
        role: 'user',
      });
    } catch (error) {
      console.error('❌ CreateEditUserModal: Submit error', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {user ? 'Modifier' : 'Créer'} un utilisateur
          </h2>
          <button className="modal-close" onClick={onClose}>
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="form-input"
                required
                disabled={submitting}
              />
            </div>

            {!user && (
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  className="form-input"
                  required
                  disabled={submitting}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Rôle
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    role: e.target.value as 'user' | 'admin',
                  }))
                }
                className="form-select"
                disabled={submitting}
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Enregistrement...' : user ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
