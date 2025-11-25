import { AdminSidebar } from './AdminSidebar'

/**
 * AdminLayout - Dark Premium Style
 * Mirrors ClientLayout but for admin interface
 */
export function AdminLayout({ children }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--background)',
      transition: 'background-color 200ms ease-out'
    }}>
      <AdminSidebar />

      <div style={{
        flex: 1,
        marginLeft: '240px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Main Content */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--background)',
          transition: 'background-color 200ms ease-out'
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
