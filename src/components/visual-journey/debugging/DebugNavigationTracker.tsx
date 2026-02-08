import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../../store';

/**
 * DebugNavigationTracker Component
 * 
 * This component monitors and instruments React's event handling system to diagnose
 * navigation issues between steps. It's designed to identify exactly why navigation
 * events might not be propagating correctly by tracking:
 * 
 * 1. Event capture/bubbling phases
 * 2. State update sequences
 * 3. Timing of component lifecycle events
 * 4. React synthetic event behavior
 * 
 * This is particularly focused on the Step 1 -> Step 2 navigation issue.
 */
const DebugNavigationTracker: React.FC = () => {
  const { currentStep, setStep } = useGameStore();
  const eventsLogRef = useRef<Record<string, any>[]>([]);
  const originalSetStepRef = useRef<Function | null>(null);
  const isActiveRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  
  // Record events for debugging
  const recordEvent = (eventType: string, data: any) => {
    const timestamp = new Date().getTime();
    const event = { timestamp, eventType, data };
    eventsLogRef.current.push(event);
    
    console.log(`[Debug Navigator] ${eventType}:`, data);
  };
  
  // Initialize debug instrumentation
  useEffect(() => {
    // Only run on step 0 (the step with navigation issues)
    if (currentStep !== 0) return;
    
    console.log("[Debug Navigator] Initializing debug instrumentation...");
    isActiveRef.current = true;
    
    // Hook into store functions
    if (!originalSetStepRef.current) {
      try {
        const store = useGameStore.getState();
        originalSetStepRef.current = store.setStep;
        
        // Monkey patch setStep to trace calls
        const patchedSetStep = (step: number) => {
          recordEvent('setStep', { step, caller: new Error().stack });
          return originalSetStepRef.current!(step);
        };
        
        // @ts-ignore - We're doing runtime patching which TypeScript doesn't like
        useGameStore.setState({ setStep: patchedSetStep });
        
        recordEvent('store-patched', { success: true });
      } catch (err) {
        recordEvent('store-patch-error', { error: err });
      }
    }
    
    // Find and monitor the Next button
    setTimeout(() => {
      findAndMonitorNextButton();
    }, 1000);
    
    // Define event capture phase to monitor propagation
    const capturePhaseEventHandler = (e: Event) => {
      if (!isActiveRef.current) return;
      
      if (e.type === 'click') {
        // Check if this is a Next button click
        const target = e.target as HTMLElement;
        const isNextButton = target?.tagName === 'BUTTON' && 
                         (target?.textContent?.includes('Next') || 
                          target?.textContent?.includes('Continue'));
        
        if (isNextButton) {
          recordEvent('next-button-capture-phase', { 
            target: e.target,
            currentTarget: e.currentTarget,
            eventPhase: e.eventPhase,
            defaultPrevented: e.defaultPrevented
          });
          
          // Add special tracking for React synthetic event
          setTimeout(() => {
            recordEvent('next-button-after-click', { 
              step: useGameStore.getState().currentStep
            });
          }, 100);
        }
      }
    };
    
    // Add capture phase event listener to trace event propagation
    document.addEventListener('click', capturePhaseEventHandler, true);
    
    // Cleanup function
    return () => {
      isActiveRef.current = false;
      document.removeEventListener('click', capturePhaseEventHandler, true);
      
      // Restore original setStep
      if (originalSetStepRef.current) {
        try {
          // @ts-ignore - Runtime patching
          useGameStore.setState({ setStep: originalSetStepRef.current });
        } catch (err) {
          console.error("Failed to restore setStep:", err);
        }
      }
    };
  }, [currentStep]); 
  
  // Find and monitor the Next button
  const findAndMonitorNextButton = () => {
    const buttons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent?.includes('Next') || 
      btn.textContent?.includes('Continue') ||
      btn.textContent?.includes('Game Type')
    );
    
    if (buttons.length === 0) {
      recordEvent('next-button-search', { found: false });
      setTimeout(findAndMonitorNextButton, 1000);
      return;
    }
    
    // Try to find red button at bottom right
    const redButton = buttons.find(btn => {
      const style = getComputedStyle(btn);
      const rect = btn.getBoundingClientRect();
      const isRed = style.backgroundColor.includes('rgb(230') || 
                  style.backgroundColor.includes('rgb(220') || 
                  style.backgroundColor.includes('rgb(255') ||
                  btn.className.includes('red') ||
                  btn.className.includes('nintendo');
                  
      const isBottomRight = rect.bottom > window.innerHeight / 2 && 
                           rect.right > window.innerWidth / 2;
                  
      return isRed && isBottomRight;
    });
    
    const targetButton = redButton || buttons[0];
    buttonRef.current = targetButton;
    
    recordEvent('next-button-search', { 
      found: true, 
      button: targetButton.outerHTML,
      position: {
        top: targetButton.getBoundingClientRect().top,
        bottom: targetButton.getBoundingClientRect().bottom,
        left: targetButton.getBoundingClientRect().left,
        right: targetButton.getBoundingClientRect().right
      }
    });
    
    // Monitor button click using DOM events
    const originalClick = targetButton.onclick;
    targetButton.onclick = (e) => {
      recordEvent('next-button-direct-click', { 
        e,
        defaultPrevented: e.defaultPrevented,
        bubbles: e.bubbles,
        cancelable: e.cancelable,
        currentTarget: e.currentTarget,
      });
      
      // Let's see if the original handler prevents propagation
      if (originalClick) {
        const originalResult = originalClick.call(targetButton, e);
        recordEvent('original-click-handler-result', { result: originalResult });
      }
      
      // Check if we need to implement a direct fix
      setTimeout(() => {
        const afterStep = useGameStore.getState().currentStep;
        recordEvent('post-click-check', { step: afterStep });
        
        if (afterStep === 0) {
          recordEvent('navigation-failed', { applying: 'direct-fix' });
          applyDirectFix();
        }
      }, 500);
    };
    
    // If this is a React element, we also need to look at React handlers
    monitorReactHandlers(targetButton);
  };
  
  // Monitor React event handlers if possible
  const monitorReactHandlers = (button: HTMLButtonElement) => {
    // Look for React fiber
    let reactKey = Object.keys(button).find(key => 
      key.startsWith('__reactFiber$') || 
      key.startsWith('__reactInternalInstance$')
    );
    
    if (reactKey) {
      recordEvent('react-fiber-found', { key: reactKey });
      
      // @ts-ignore - Dynamic property access
      const fiber = button[reactKey];
      
      // Navigate up the fiber tree to find event handlers
      let currentFiber = fiber;
      while (currentFiber) {
        if (currentFiber.memoizedProps && currentFiber.memoizedProps.onClick) {
          recordEvent('react-click-handler-found', { 
            component: currentFiber.type?.name || 'Unknown',
            handlerPresent: true 
          });
          break;
        }
        currentFiber = currentFiber.return;
      }
    } else {
      recordEvent('react-fiber-not-found', {});
    }
    
    // Also check for reactEventHandlers
    let reactEventKey = Object.keys(button).find(key => 
      key.startsWith('__reactEventHandlers$') || 
      key.startsWith('__reactProps$')
    );
    
    if (reactEventKey) {
      // @ts-ignore - Dynamic property access
      const reactEvents = button[reactEventKey];
      recordEvent('react-event-handlers', { 
        hasOnClick: !!reactEvents.onClick,
        hasOnMouseDown: !!reactEvents.onMouseDown,
        hasOnMouseUp: !!reactEvents.onMouseUp,
      });
    }
  };
  
  // Direct fix to be applied if needed
  const applyDirectFix = () => {
    // Save step transition data
    localStorage.setItem('debug_navigation_attempted', 'true');
    localStorage.setItem('debug_direct_fix_applied', 'true');
    localStorage.setItem('debug_timestamp', Date.now().toString());
    
    try {
      // Get required data
      const store = useGameStore.getState();
      const config = store.config;
      
      // Direct fix: set the step using setState pattern
      recordEvent('applying-direct-fix', { method: 'setState-pattern' });
      
      // Use a React setState-like pattern to ensure proper state updates
      useGameStore.setState(state => ({
        ...state,
        currentStep: 1,
        savedProgress: {
          ...state.savedProgress,
          0: {
            config: state.config,
            timestamp: new Date()
          }
        }
      }));
      
      // Verify the state change
      setTimeout(() => {
        const afterStep = useGameStore.getState().currentStep;
        recordEvent('direct-fix-result', { step: afterStep });
        
        if (afterStep !== 1) {
          recordEvent('direct-fix-failed', {});
          
          // Fallback to URL navigation as last resort
          window.location.href = '/?step=1&force=true&t=' + Date.now();
        }
      }, 200);
    } catch (err) {
      recordEvent('direct-fix-error', { error: err });
      
      // Fallback to URL navigation
      window.location.href = '/?step=1&force=true&t=' + Date.now();
    }
  };
  
  // This component doesn't render anything
  return null;
};

export default DebugNavigationTracker;