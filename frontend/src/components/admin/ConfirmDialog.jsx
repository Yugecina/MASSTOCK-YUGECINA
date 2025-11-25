import { useEffect } from 'react'

// SVG Icons
const Icons = {
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

/**
 * ConfirmDialog - Premium confirmation dialog
 */
export function ConfirmDialog({
  type = 'warning',
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel
}) {
  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  return (
    <div className="admin-user-modal-overlay" onClick={onCancel}>
      <div className="admin-confirm-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Icon */}
        <div className={`admin-confirm-icon admin-confirm-icon--${type}`}>
          {type === 'danger' ? <Icons.Trash /> : <Icons.AlertTriangle />}
        </div>

        {/* Content */}
        <h3 className="admin-confirm-title">{title}</h3>
        <p className="admin-confirm-text">{message}</p>

        {/* Actions */}
        <div className="admin-confirm-actions">
          <button
            className="admin-user-modal-btn admin-user-modal-btn--secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={`admin-user-modal-btn ${type === 'danger' ? 'admin-user-modal-btn--danger' : 'admin-user-modal-btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
