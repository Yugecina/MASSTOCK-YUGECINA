import { useEffect } from 'react'

export function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => (document.body.style.overflow = 'unset')
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--spacing-xl)',
          maxWidth: '600px',
          width: '90%',
          zIndex: 50,
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden'
        }}
      >
        {title && <h2 className="text-h2" style={{marginBottom: 'var(--spacing-md)'}}>{title}</h2>}
        {children}
      </div>
    </>
  )
}
