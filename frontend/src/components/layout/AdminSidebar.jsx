import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * AdminSidebar - "The Organic Factory" Design
 * Pure CSS styling, Verdigris border on active nav
 * Uses monochrome dark logo for admin distinction
 */
export function AdminSidebar() {
  const { user, logout } = useAuth()

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/clients', label: 'Clients', icon: '🏢' },
    { path: '/admin/workflows', label: 'Workflows', icon: '🔄' },
    { path: '/admin/tickets', label: 'Tickets', icon: '💬' },
    { path: '/admin/errors', label: 'Errors', icon: '🔥' },
    { path: '/admin/finances', label: 'Finances', icon: '💰' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: '280px',
      background: 'var(--canvas-pure)',
      borderRight: '1px solid var(--neutral-200)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 30
    }}>
      {/* Logo - Monochrome Dark for Admin distinction */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid var(--neutral-200)'
      }}>
        <img
          src="/logo-monochrome-dark.svg"
          alt="MasStock Admin"
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
        {adminNavItems.map((item) => (
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
        style={{
          borderTop: '1px solid var(--neutral-200)',
          padding: '16px',
          background: 'linear-gradient(to bottom, transparent, var(--neutral-50))'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '12px',
            borderRadius: '8px',
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
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {user?.name || 'Admin'}
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
              {user?.email || 'admin@masstock.com'}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
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
