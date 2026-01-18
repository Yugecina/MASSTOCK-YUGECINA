import { Sidebar } from './Sidebar';
import { useSidebarStore } from '../../store/sidebarStore';
import type { ReactNode, CSSProperties } from 'react';

/**
 * ClientLayout Props
 */
interface ClientLayoutProps {
  children: ReactNode;
}

/**
 * ClientLayout - Dark Premium Design
 * Clean, minimal, professional
 *
 * Features:
 * - Responsive to sidebar collapse state
 * - Smooth transitions
 * - Clean borders
 * - Professional aesthetic
 */
export function ClientLayout({ children }: ClientLayoutProps) {
  const { isCollapsed } = useSidebarStore();

  const containerStyle: CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--background)',
    transition: 'background-color 200ms ease-out'
  };

  const contentWrapperStyle: CSSProperties = {
    flex: 1,
    marginLeft: isCollapsed ? '64px' : '240px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'margin-left 200ms ease-out'
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
