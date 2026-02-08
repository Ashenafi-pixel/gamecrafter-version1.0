import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  // State
  isNavOpen: boolean;
  isSidebarCollapsed: boolean;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  resetSidebar: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      // Initial state
      isNavOpen: true,
      isSidebarCollapsed: false,
      
      // Actions
      toggleSidebar: () => {
        const { isNavOpen } = get();
        console.log('[SidebarStore] Toggling sidebar from', isNavOpen, 'to', !isNavOpen);
        set({
          isNavOpen: !isNavOpen,
          isSidebarCollapsed: isNavOpen, // inverse
        });
      },
      
      setSidebarOpen: (isOpen: boolean) => {
        console.log('[SidebarStore] Setting sidebar to', isOpen);
        set({
          isNavOpen: isOpen,
          isSidebarCollapsed: !isOpen,
        });
      },
      
      resetSidebar: () => {
        console.log('[SidebarStore] Resetting sidebar to default state');
        set({
          isNavOpen: true,
          isSidebarCollapsed: false,
        });
      },
    }),
    {
      name: 'gameCrafter_sidebarState',
      partialize: (state) => ({ 
        isNavOpen: state.isNavOpen,
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);