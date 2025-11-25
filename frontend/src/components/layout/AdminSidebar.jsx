import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import DarkModeToggle from '../ui/DarkModeToggle'

/**
 * AdminSidebar - Dark Premium Style
 * Mirrors Sidebar but with admin navigation
 */
export function AdminSidebar() {
  const { user, logout } = useAuth()

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { path: '/admin/users', label: 'Users', icon: UsersIcon },
    { path: '/admin/clients', label: 'Clients', icon: ClientsIcon },
    { path: '/admin/workflows', label: 'Workflows', icon: WorkflowsIcon },
    { path: '/admin/tickets', label: 'Tickets', icon: TicketsIcon },
    { path: '/admin/errors', label: 'Errors', icon: ErrorsIcon },
    { path: '/admin/finances', label: 'Finances', icon: FinancesIcon },
    { path: '/admin/settings', label: 'Settings', icon: SettingsIcon },
  ]

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="var(--primary)" />
            <path d="M12 28V12h4.5l3.5 10.5L23.5 12H28v16h-3v-11l-3.5 11h-3L15 17v11h-3z" fill="white" />
          </svg>
          <span className="sidebar-logo-text">Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Dark Mode Toggle */}
        <div className="sidebar-theme">
          <DarkModeToggle />
        </div>

        {/* User */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name || 'Admin'}</span>
            <span className="sidebar-user-email">{user?.email || 'admin@masstock.com'}</span>
          </div>
        </div>

        {/* Logout */}
        <button onClick={logout} className="sidebar-logout">
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

// Icons
function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ClientsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18" />
      <path d="M9 8h1" />
      <path d="M9 12h1" />
      <path d="M9 16h1" />
      <path d="M14 8h1" />
      <path d="M14 12h1" />
      <path d="M14 16h1" />
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
    </svg>
  )
}

function WorkflowsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

function TicketsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ErrorsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function FinancesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
