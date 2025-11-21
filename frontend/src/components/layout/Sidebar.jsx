import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-70 bg-white border-r border-neutral-200 flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-neutral-200">
        <img
          src="/logo-full-color.svg"
          alt="MasStock"
          className="h-10 w-auto"
          style={{ height: '40px', width: 'auto' }}
        />
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {[
          { path: '/dashboard', label: 'Dashboard', icon: '📊' },
          { path: '/workflows', label: 'Workflows', icon: '⚙️' },
          { path: '/executions', label: 'Executions', icon: '🚀' },
          { path: '/settings', label: 'Settings', icon: '⚙️' },
        ].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s ease-out',
              textDecoration: 'none',
              background: isActive ? 'var(--primary-50)' : 'transparent',
              color: isActive ? 'var(--primary-600)' : 'var(--neutral-600)',
              borderLeft: isActive ? '4px solid var(--primary-500)' : '4px solid transparent',
              paddingLeft: isActive ? '12px' : '16px'
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.background = 'var(--neutral-100)'
                e.currentTarget.style.color = 'var(--neutral-900)'
              }
            }}
            onMouseLeave={(e) => {
              const isActive = e.currentTarget.getAttribute('aria-current') === 'page'
              if (!isActive) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--neutral-600)'
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div
        className="border-t border-neutral-200 p-4"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--neutral-50))'
        }}
      >
        <div
          className="flex items-center gap-3 mb-3 p-3 rounded-lg"
          style={{
            background: 'var(--canvas-pure)',
            border: '1px solid var(--neutral-200)'
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--secondary-500) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              flexShrink: 0
            }}
          >
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="font-semibold"
              style={{
                fontSize: '14px',
                color: 'var(--text-primary)',
                marginBottom: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {user?.name || 'User'}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-tertiary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {user?.email || 'user@example.com'}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2"
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            background: 'transparent',
            border: '1px solid var(--neutral-200)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--neutral-100)'
            e.currentTarget.style.borderColor = 'var(--neutral-300)'
            e.currentTarget.style.color = 'var(--text-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'var(--neutral-200)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <span style={{ fontSize: '16px' }}>🚪</span>
          Logout
        </button>
      </div>
    </aside>
  )
}
