import { AdminSidebar } from './AdminSidebar';
import type { ReactNode, CSSProperties } from 'react';

/**
 * AdminLayout Props
 */
interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * AdminLayout - Dark Premium Style
 * Mirrors ClientLayout but for admin interface
 */
export function AdminLayout({ children }: AdminLayoutProps) {
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
      <AdminSidebar />

      <div style={contentWrapperStyle}>
        {/* Main Content */}
        <main style={mainStyle}>
          {children}
        </main>
      </div>
    </div>
  );
}
