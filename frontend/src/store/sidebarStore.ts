import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

/**
 * Sidebar Store - Manage sidebar collapse state
 *
 * Persists sidebar state in localStorage
 */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,

      toggleSidebar: () => set((state) => ({ isCollapsed: !state.isCollapsed })),

      setSidebarCollapsed: (collapsed: boolean) => set({ isCollapsed: collapsed }),
    }),
    {
      name: 'sidebar-storage',
    }
  )
);
