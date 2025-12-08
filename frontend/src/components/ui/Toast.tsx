import React from 'react';
import { Toaster } from 'react-hot-toast';

/**
 * Toast Notification Container Component
 *
 * Uses react-hot-toast library with custom styling from Organic Factory design system.
 * Positioned top-right with slide-in animation.
 *
 * Installation required: npm install react-hot-toast
 *
 * Usage:
 * 1. Import this component in App.jsx
 * 2. Place <ToastContainer /> once in your app root
 * 3. Use toast.success(), toast.error(), toast.loading() anywhere
 *
 * Example:
 * import toast from 'react-hot-toast'
 * toast.success('Workflow executed successfully!')
 * toast.error('Failed to generate content')
 * toast.loading('Processing...')
 */
export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: 'white',
          color: 'var(--text-primary)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          lineHeight: '1.5',
          maxWidth: '400px',
        },

        // Success toast
        success: {
          duration: 3000,
          style: {
            borderLeft: '4px solid var(--success-main)',
            backgroundColor: 'white',
          },
          iconTheme: {
            primary: 'var(--success-main)',
            secondary: 'white',
          },
        },

        // Error toast
        error: {
          duration: 5000,
          style: {
            borderLeft: '4px solid var(--error-main)',
            backgroundColor: 'white',
          },
          iconTheme: {
            primary: 'var(--error-main)',
            secondary: 'white',
          },
        },

        // Warning toast
        warning: {
          duration: 4000,
          style: {
            borderLeft: '4px solid var(--warning-main)',
            backgroundColor: 'white',
          },
          iconTheme: {
            primary: 'var(--warning-main)',
            secondary: 'white',
          },
        },

        // Loading toast
        loading: {
          style: {
            borderLeft: '4px solid var(--indigo-600)',
            backgroundColor: 'white',
          },
          iconTheme: {
            primary: 'var(--indigo-600)',
            secondary: 'white',
          },
        },
      }}
    />
  )
}

interface ToastWithActionProps {
  message: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
}

/**
 * Custom toast notification with action button
 *
 * @param {string} message - Main message text
 * @param {string} description - Optional description text
 * @param {function} onAction - Callback for action button
 * @param {string} actionLabel - Label for action button
 * @returns {JSX.Element}
 */
export function ToastWithAction({ message, description, onAction, actionLabel = 'View' }: ToastWithActionProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <div className="font-semibold text-sm text-neutral-900">{message}</div>
        {description && (
          <div className="text-xs text-neutral-600 mt-1">{description}</div>
        )}
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          style={{ whiteSpace: 'nowrap' }}
        >
          {actionLabel} →
        </button>
      )}
    </div>
  )
}

// Export toast for convenience
export { default as toast } from 'react-hot-toast';
