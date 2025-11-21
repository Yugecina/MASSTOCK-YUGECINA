import { Sidebar } from './Sidebar'

/**
 * ClientLayout - "The Organic Factory" Design
 * Ghost White background, minimal header, clean layout
 */
export function ClientLayout({ children }) {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--canvas-base)', // Ghost White
    }}>
      <Sidebar />

      <div style={{
        flex: 1,
        marginLeft: '280px', // Sidebar width
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header - Optional, minimal */}
        <header style={{
          background: 'var(--canvas-pure)',
          borderBottom: '1px solid var(--neutral-200)',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '72px'
        }}>
          <div style={{ flex: 1 }}>
            {/* Header content can be added here */}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Header actions can be added here */}
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--canvas-base)' // Ghost White
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
