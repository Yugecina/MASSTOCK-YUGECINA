import { Link } from 'react-router-dom'

/**
 * NotFound Page - "The Organic Factory" Design
 * Clean, minimal 404 avec logo et design cohérent
 */
export function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--canvas-base)',
      padding: '48px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        {/* Logo */}
        <div style={{ marginBottom: '48px' }}>
          <img
            src="/logo-full-color.svg"
            alt="MasStock"
            style={{
              height: '60px',
              width: 'auto',
              margin: '0 auto',
              display: 'block'
            }}
          />
        </div>

        {/* 404 */}
        <div
          className="font-mono"
          style={{
            fontSize: '120px',
            fontWeight: 700,
            color: 'var(--indigo-600)',
            lineHeight: 1,
            marginBottom: '24px',
            background: 'var(--gradient-indigo)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          404
        </div>

        <h1
          className="font-display"
          style={{
            fontSize: '36px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '16px',
            letterSpacing: '-0.02em'
          }}
        >
          Page Not Found
        </h1>

        <p
          className="font-body"
          style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            marginBottom: '48px',
            lineHeight: 1.6
          }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link to="/dashboard">
          <button
            className="btn btn-primary"
            style={{
              padding: '12px 32px',
              fontSize: '16px'
            }}
          >
            Back to Dashboard
          </button>
        </Link>
      </div>
    </div>
  )
}
