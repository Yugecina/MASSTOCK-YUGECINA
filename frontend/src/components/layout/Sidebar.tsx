import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSidebarStore } from '../../store/sidebarStore';
import type { ReactNode } from 'react';

/**
 * Navigation item interface
 */
interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
}

/**
 * Sidebar - Dark Premium Design System
 *
 * Features:
 * - Collapsible sidebar with toggle button
 * - Clean SVG icons
 * - Active state indicators
 * - Smooth transitions
 */
export function Sidebar() {
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebarStore();

  const navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1.5" y="1.5" width="6" height="6" rx="1" />
          <rect x="10.5" y="1.5" width="6" height="6" rx="1" />
          <rect x="10.5" y="10.5" width="6" height="6" rx="1" />
          <rect x="1.5" y="10.5" width="6" height="6" rx="1" />
        </svg>
      )
    },
    {
      path: '/workflows',
      label: 'Workflows',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
          <rect x="11.5" y="11.5" width="5" height="5" rx="1" />
          <path d="M6.5 4h4.5v2.5a2.5 2.5 0 0 0 2.5 2.5h2" />
          <path d="M4 6.5v4.5l2.5 2.5" />
        </svg>
      )
    },
    {
      path: '/executions',
      label: 'Executions',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16.5 9 13.5 9 11.5 16 6.5 2 4.5 9 1.5 9" />
        </svg>
      )
    },
    {
      path: '/assets',
      label: 'Assets',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="14" height="13" rx="1.5" />
          <path d="M2 7 L6.5 11.5 L9.5 8.5 L16 15" />
          <circle cx="13" cy="7" r="1.2" fill="currentColor" />
        </svg>
      )
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Header: Logo + Toggle Button */}
      <div className="sidebar-header">
        {isCollapsed ? (
          <div className="sidebar-logo sidebar-logo--icon">
            <img
              src="/logo-monochrome-light.svg"
              alt="MasStock"
              className="sidebar-logo-icon"
            />
          </div>
        ) : (
          <div className="sidebar-logo">
            <span className="sidebar-logo-text">MASSTOCK</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="sidebar-toggle-btn"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            {!isCollapsed && <span className="sidebar-link-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="sidebar-footer">
        {/* User Card */}
        {!isCollapsed && (
          <div className="sidebar-user-card">
            {/* Avatar with gradient */}
            <div className="sidebar-user-avatar">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>

            {/* User Info */}
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.name || 'User'}
              </div>
              <div className="sidebar-user-email">
                {user?.email || 'user@example.com'}
              </div>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="sidebar-user-card sidebar-user-card--collapsed">
            <div className="sidebar-user-avatar">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button onClick={logout} className="sidebar-logout-btn" title="Sign out">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
