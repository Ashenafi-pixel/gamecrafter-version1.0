import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface SidebarContextType {
  /**
   * Current sidebar open/closed state
   */
  isNavOpen: boolean;
  
  /**
   * Sidebar collapsed state (inverse of isNavOpen for easier reading)
   */
  isSidebarCollapsed: boolean;
  
  /**
   * Toggle sidebar between open/closed states
   */
  toggleSidebar: () => void;
  
  /**
   * Directly set sidebar state
   */
  setSidebarOpen: (isOpen: boolean) => void;
  
  /**
   * Reset sidebar to default state (emergency function)
   */
  resetSidebar: () => void;
}

// Create context with default values
const SidebarContext = createContext<SidebarContextType>({
  isNavOpen: true,
  isSidebarCollapsed: false, // inverse of isNavOpen
  toggleSidebar: () => {},
  setSidebarOpen: () => {},
  resetSidebar: () => {},
});

// Storage key for persistence
const STORAGE_KEY = 'gameCrafter_sidebarState';

/**
 * SidebarProvider component that manages sidebar state
 * and persists it to localStorage
 */
export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[SidebarProvider] Initializing provider');
  // Initialize state from localStorage with error handling
  const [isNavOpen, setIsNavOpen] = useState<boolean>(() => {
    // Server-side rendering check
    if (typeof window === 'undefined') {
      return true;
    }
    
    try {
      // Check if localStorage is accessible
      if (window.localStorage) {
        const savedState = localStorage.getItem(STORAGE_KEY);
        return savedState ? savedState === 'open' : true;
      }
      return true;
    } catch (error) {
      return true;
    }
  });

  // Toggle sidebar state with useCallback for stability
  const toggleSidebar = useCallback(() => {
    console.log('[SidebarContext] toggleSidebar called, current state:', isNavOpen);
    setIsNavOpen(prev => {
      console.log('[SidebarContext] Setting sidebar state from', prev, 'to', !prev);
      return !prev;
    });
  }, [isNavOpen]);

  // Setter for direct state control
  const setSidebarOpen = useCallback((isOpen: boolean) => {
    // Only change state if different from current
    if (isOpen !== isNavOpen) {
      console.log('[SidebarContext] setSidebarOpen called with:', isOpen);
      setIsNavOpen(isOpen);
    }
  }, [isNavOpen]);
  
  // Reset sidebar to default open state
  const resetSidebar = useCallback(() => {
    // Set to default open state
    setIsNavOpen(true);
    
    // Also clean up localStorage to ensure fresh state
    try {
      if (storageAvailable('localStorage')) {
        localStorage.setItem(STORAGE_KEY, 'open');
      }
    } catch (error) {
      // Silent fail for localStorage errors
    }
  }, []);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    console.log('[SidebarContext] State changed effect triggered, isNavOpen =', isNavOpen);
    if (typeof window !== 'undefined') {
      try {
        // Check if localStorage is available
        if (storageAvailable('localStorage')) {
          const stateValue = isNavOpen ? 'open' : 'closed';
          console.log('[SidebarContext] Saving to localStorage:', stateValue);
          localStorage.setItem(STORAGE_KEY, stateValue);
        }
      } catch (error) {
        console.error('[SidebarContext] Error saving to localStorage:', error);
        // Silent fail for localStorage errors
      }
    }
  }, [isNavOpen]);
  
  // Listen for keyboard shortcuts through custom events
  useEffect(() => {
    const handleToggleEvent = () => {
      toggleSidebar();
    };
    
    window.addEventListener('sidebar:toggle', handleToggleEvent);
    
    return () => {
      window.removeEventListener('sidebar:toggle', handleToggleEvent);
    };
  }, [toggleSidebar]);
  
  // Helper function to detect if storage is available
  function storageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
    let storage;
    try {
      storage = window[type];
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return e instanceof DOMException && (
        // everything except Firefox
        e.code === 22 ||
        // Firefox
        e.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        e.name === 'QuotaExceededError' ||
        // Firefox
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
        // acknowledge QuotaExceededError only if there's something already stored
        (storage && storage.length !== 0);
    }
  }

  // Provide both isNavOpen and isSidebarCollapsed for better readability
  return (
    <SidebarContext.Provider value={{ 
      isNavOpen, 
      isSidebarCollapsed: !isNavOpen, // inverse of isNavOpen
      toggleSidebar, 
      setSidebarOpen,
      resetSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

/**
 * Custom hook to use the sidebar context
 */
export const useSidebar = () => useContext(SidebarContext);

export default SidebarContext;