import { Sidebar } from './Sidebar'

/**
 * ClientLayout - Solid Card Design (Linear/Vercel)
 * Clean, minimal, professional
 *
 * Features:
 * - Light gray background
 * - White cards with subtle shadows
 * - Clean borders
 * - Professional aesthetic
 */
export function ClientLayout({ children }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--background)',
      transition: 'background-color 200ms ease-out'
    }}>
      <Sidebar />

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
