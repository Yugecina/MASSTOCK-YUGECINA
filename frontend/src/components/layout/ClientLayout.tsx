import { Sidebar } from './Sidebar';
import type { ReactNode, CSSProperties } from 'react';

/**
 * ClientLayout Props
 */
interface ClientLayoutProps {
  children: ReactNode;
}

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
export function ClientLayout({ children }: ClientLayoutProps) {
  const containerStyle: CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--background)',
    transition: 'background-color 200ms ease-out'
  };

  const contentWrapperStyle: CSSProperties = {
    flex: 1,
    marginLeft: '240px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  };

  const mainStyle: CSSProperties = {
    flex: 1,
    overflow: 'auto',
    background: 'var(--background)',
    transition: 'background-color 200ms ease-out'
  };

  return (
    <div style={containerStyle}>
      <Sidebar />

      <div style={contentWrapperStyle}>
        {/* Main Content */}
        <main style={mainStyle}>
          {children}
        </main>
      </div>
    </div>
  );
}
