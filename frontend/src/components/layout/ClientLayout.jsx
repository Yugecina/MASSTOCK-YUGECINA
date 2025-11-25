import { Sidebar } from './Sidebar'

/**
 * ClientLayout - Neumorphism (Soft UI) Design
 * Soft extruded sidebar + seamless content area
 *
 * Features:
 * - Neumorphic background (#E8EEF5 light / #1E293B dark)
 * - Soft shadows everywhere
 * - No harsh borders, just shadow depth
 */
export function ClientLayout({ children }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--neu-bg)',
      transition: 'background-color 300ms ease-out'
    }}>
      <Sidebar />

      <div style={{
        flex: 1,
        marginLeft: '280px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Main Content - no header for cleaner neumorphic look */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--neu-bg)',
          transition: 'background-color 300ms ease-out'
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
