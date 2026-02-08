import { createRoot } from 'react-dom/client';
// Import app versions
import App from './App';
import './index.css';
import SymbolPreloader from './utils/symbolPreloader';

// Force Vite HMR to detect changes
const BUILD_TIME = Date.now();

// Check for URL parameters
const urlParams = new URLSearchParams(window.location.search);
const isSafeMode = urlParams.has('SafeMode') || urlParams.has('safeMode');
const isRecovered = urlParams.has('recovered');
const targetStep = urlParams.get('step');

// Set a global timestamp that can be used throughout the app
window.timestamp = Date.now();

// Global flag for recovery state
(window as any).__RECOVERY_COMPLETE = isRecovered || localStorage.getItem('slotai_recovery_complete') === 'true';

// Disable all emergency navigation scripts if recovery is complete
if ((window as any).__RECOVERY_COMPLETE) {
  (window as any).__EMERGENCY_SCRIPTS_DISABLED = true;

  // Also protect the store's setStep function
  setTimeout(() => {
    try {
      if (window.useGameStore && window.useGameStore.getState().setStep) {
        // Keep a reference to the original setStep
        const originalSetStep = window.useGameStore.getState().setStep;

        // Create a wrapper that logs attempted overrides
        const protectedSetStep = function (step: number) {
          return originalSetStep(step);
        };

        // Override the store's setStep with our protected version
        window.useGameStore.setState((state: any) => ({
          ...state,
          setStep: protectedSetStep
        }));

      }
    } catch (e) {
      console.warn('Could not protect setStep function:', e);
    }
  }, 1000); // Wait for store to be fully initialized
}

// Process recovered state - we want to handle this first
if (isRecovered) {

  // Set recovery flags to prevent emergency detection
  localStorage.setItem('slotai_recovery_complete', 'true');
  localStorage.setItem('slotai_recovery_timestamp', Date.now().toString());

  // Full cleanup of all emergency-related localStorage keys
  const emergencyKeys = [
    // Primary emergency flags
    'slotai_emergency_nav',
    'slotai_memory_crash',
    'slotai_safe_mode',

    // Secondary emergency flags
    'blank_screen_detected',
    'last_emergency_ui',
    'last_emergency_ui_created',

    // Logging keys
    'STEPFUCK_LOGS',
    'navigation_logs',

    // Legacy navigation flags
    'slotai_navigation_backup'
  ];

  // Clean up all emergency localStorage entries
  emergencyKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore errors
    }
  });

  // If URL has step parameter, save it for navigation
  if (targetStep) {
    localStorage.setItem('slotai_target_step', targetStep);
    localStorage.setItem('slotai_timestamp', Date.now().toString());
  }

  // Define a comprehensive cleanup function for emergency UIs
  const performFullDOMCleanup = () => {
    // Target all possible emergency UI elements with multiple selectors
    const selectors = [
      // Step menus and overlays specifically
      '.step-menu',
      '.step-overlay',
      '.step-indicator',
      '.step-navigation-menu',
      '[id^="step-menu-"]',
      '[id^="step-nav-"]',
      '[id^="step-indicator-"]',
      // Bottom-right fixed menus
      'div[style*="position: fixed"][style*="bottom"][style*="right"]',
      // Data attributes
      '[data-emergency-ui]',
      '[data-emergency-ui="true"]',

      // IDs
      '#emergency-nav-container',
      '#emergency-big-button',
      '#emergency-nav-button',
      '#emergency-debug-panel',
      '#emergency-fix-overlay',
      '#emergency-navigation-overlay',
      '#navigation-emergency-container',
      '#step-navigation-fix-container',
      '[id^="emergency-"]',
      '[id^="emergency-nav-button-"]',
      '[id*="emergency"]',

      // Classes
      '.emergency-button',
      '.emergency-nav',
      '.emergency-step-fix',
      '.step1to2-fix-button',
      '.emergency-ui',
      '.emergency-overlay',
      '.emergency-control',
      '.navigation-emergency',
      '.step-navigation-fix',
      '.step-button-fix',
      '.fix-overlay',
      '.fix-button',
      '[class*="emergency"]',
      '[class*="step-fix"]',

      // Specific indicators
      'div[title="Click to export logs"]',
      'button[title*="emergency"]',
      'div[style*="position: fixed"][style*="z-index: 9999"]'
    ];

    let removedCount = 0;

    // Clean each selector
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          try {
            element.remove();
            removedCount++;
          } catch (e) {
            // If remove() fails, try removeChild
            if (element.parentNode) {
              element.parentNode.removeChild(element);
              removedCount++;
            }
          }
        });
      } catch (e) {
        // Ignore errors for individual selectors
      }
    });

    // Also clean fixed positioned elements that might be emergency UIs
    try {
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (!(el instanceof HTMLElement)) return;

        const style = window.getComputedStyle(el);
        const isFixed = style.position === 'fixed';
        const hasHighZIndex = parseInt(style.zIndex, 10) >= 1000;
        const isEmergencyRelated =
          el.id.toLowerCase().includes('emergency') ||
          el.id.toLowerCase().includes('fix') ||
          el.className.toLowerCase().includes('emergency') ||
          el.className.toLowerCase().includes('fix');

        if (isFixed && (hasHighZIndex || isEmergencyRelated)) {
          try {
            el.remove();
            removedCount++;
          } catch (e) {
            // If remove() fails, try removeChild
            if (el.parentNode) {
              el.parentNode.removeChild(el);
              removedCount++;
            }
          }
        }
      });
    } catch (e) {
      console.warn('Error cleaning fixed position elements:', e);
    }

    if (removedCount > 0) {
      console.log(`✅ Removed ${removedCount} emergency UI elements after recovery`);
    }

    // Use MutationObserver to clean any dynamically added emergency UIs
    try {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (!(node instanceof HTMLElement)) return;

              const isEmergency =
                node.id.toLowerCase().includes('emergency') ||
                node.id.toLowerCase().includes('fix') ||
                node.className.toLowerCase().includes('emergency') ||
                node.className.toLowerCase().includes('fix') ||
                node.hasAttribute('data-emergency-ui');

              if (isEmergency) {
                try {
                  node.remove();
                } catch (e) {
                  // Ignore
                }
              }
            });
          }
        }
      });

      // Start observing with a configuration that watches for child nodes and attributes
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });

      // Store the observer reference in window for later access/disconnection
      (window as any).__emergencyCleanupObserver = observer;

    } catch (e) {
      console.warn('Error setting up MutationObserver:', e);
    }
  };

  // Add cleanup function to window for global access
  (window as any).performEmergencyUICleanup = performFullDOMCleanup;

  // Run cleanup at various times to ensure all UI is cleaned
  setTimeout(performFullDOMCleanup, 100); // Initial cleanup
  setTimeout(performFullDOMCleanup, 1000); // After initial render
  setTimeout(performFullDOMCleanup, 2000); // After most async operations

  // Clean URL by removing recovery parameter to prevent reloads
  if (window.history && window.history.replaceState) {
    // Replace with clean URL or just keep the step parameter if needed
    let newUrl = '/';
    if (targetStep) {
      newUrl = `/?step=${targetStep}`;
    }
    window.history.replaceState({}, document.title, newUrl);
  }
}

// If in safe mode, output status to console
if (isSafeMode) {
  // Set safe mode flag in localStorage
  localStorage.setItem('slotai_safe_mode', 'true');
}

// Add cache-busting query params to all dynamic imports
const originalDynamicImport = (window as any).import;
if (originalDynamicImport) {
  (window as any).import = function (url: string) {
    const cacheBuster = `?t=${BUILD_TIME}`;
    const urlWithCacheBuster = url.includes('?') ? `${url}&t=${BUILD_TIME}` : `${url}${cacheBuster}`;
    return originalDynamicImport(urlWithCacheBuster);
  };
}

// Start preloading symbols immediately (before DOM is ready)
SymbolPreloader.initialize().catch((error) => {
  console.error('Failed to initialize SymbolPreloader:', error);
});

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Don't clear localStorage to maintain login state
  // Instead, just add a custom flag to indicate the app has premium UI
  try {
    localStorage.setItem('slotai_premium_ui', 'true');

    // Flag for safe mode
    if (isSafeMode) {
      localStorage.setItem('slotai_safe_mode', 'true');
    } else {
      localStorage.removeItem('slotai_safe_mode');
    }
  } catch (e) {
    console.warn('Failed to update localStorage:', e);
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      // Temporarily disable StrictMode to prevent DOM conflicts with GPT-4 Vision
      <App key={BUILD_TIME} />
    );
  } catch (error) {
    console.error('Failed to render app:', error);
  }
});