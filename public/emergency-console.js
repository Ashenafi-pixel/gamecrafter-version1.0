/**
 * EMERGENCY NAVIGATION CONSOLE SCRIPT
 * 
 * This script is designed to be manually pasted into the browser console
 * when all other navigation methods have failed.
 * 
 * HOW TO USE:
 * 1. Open the SlotAI app
 * 2. Press F12 to open developer tools
 * 3. Click on the Console tab
 * 4. Copy this entire script and paste it into the console
 * 5. Press Enter to execute
 */

(function() {
  console.log('%c🚨 EMERGENCY NAVIGATION SCRIPT RUNNING', 'color: red; font-weight: bold; font-size: 16px');
  
  // Step 1: Find the Zustand store
  let store = null;
  
  // Check if global store is available
  if (typeof window.useGameStore !== 'undefined' && typeof window.useGameStore.getState === 'function') {
    console.log('%c✅ Found global useGameStore', 'color: green');
    store = window.useGameStore.getState();
  } else {
    // Try to find it in React Devtools hook registry
    console.log('%c⚠️ Global store not found, trying alternative methods', 'color: orange');
    
    // Look for it in window properties
    for (const prop in window) {
      if (
        prop.includes('Store') || 
        prop.includes('store') || 
        prop.includes('state') || 
        prop.includes('zustand')
      ) {
        console.log(`Checking window.${prop}...`);
        try {
          const potentialStore = window[prop];
          if (
            typeof potentialStore === 'object' && 
            potentialStore !== null && 
            typeof potentialStore.getState === 'function'
          ) {
            const state = potentialStore.getState();
            // Check if it looks like our game store
            if (
              state && 
              typeof state === 'object' && 
              ('config' in state || 'gameType' in state || 'currentStep' in state)
            ) {
              console.log(`%c✅ Found store in window.${prop}`, 'color: green');
              store = potentialStore.getState();
              break;
            }
          }
        } catch (e) {
          // Ignore errors while probing
        }
      }
    }
  }
  
  // If we still don't have the store, try deeper React state access
  if (!store) {
    console.log('%c⚠️ Store not found in window. Attempting React fiber access.', 'color: orange');
    
    try {
      // Try to find React instance
      const findReactRoot = () => {
        // Get the React root element
        const rootEl = document.getElementById('root');
        if (!rootEl) return null;
        
        // Loop through property names to find React fiber
        for (const key in rootEl) {
          if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
            return rootEl[key];
          }
        }
        return null;
      };
      
      const fiber = findReactRoot();
      if (fiber) {
        console.log('%c✅ Found React fiber', 'color: green');
        
        // Function to traverse the fiber tree
        const findStoreInFiber = (fiber) => {
          if (!fiber) return null;
          
          // Check if this node has the store
          if (fiber.memoizedState && fiber.memoizedState.refs && fiber.memoizedState.refs.store) {
            return fiber.memoizedState.refs.store;
          }
          
          // Check hooks
          if (fiber.memoizedState && fiber.memoizedState.memoizedState) {
            const stateNode = fiber.memoizedState.memoizedState;
            if (stateNode && typeof stateNode === 'object' && ('config' in stateNode || 'gameType' in stateNode)) {
              return { getState: () => stateNode };
            }
          }
          
          // Recurse through children
          if (fiber.child) {
            const childResult = findStoreInFiber(fiber.child);
            if (childResult) return childResult;
          }
          
          // Recurse through siblings
          if (fiber.sibling) {
            const siblingResult = findStoreInFiber(fiber.sibling);
            if (siblingResult) return siblingResult;
          }
          
          return null;
        };
        
        const storeFromFiber = findStoreInFiber(fiber);
        if (storeFromFiber) {
          console.log('%c✅ Found store in React fiber', 'color: green');
          store = storeFromFiber.getState();
        }
      }
    } catch (e) {
      console.error('Error accessing React fiber:', e);
    }
  }
  
  // If we still don't have the store, use fallback method
  if (!store) {
    console.log('%cCould not find Zustand store, using DOM manipulation fallback', 'color: red');
    
    // Try direct DOM button click
    console.log('Attempting to find and click the Next button...');
    
    const buttons = Array.from(document.querySelectorAll('button'));
    const nextButtons = buttons.filter(button => {
      const text = button.textContent || '';
      return (
        text.includes('Next') || 
        text.includes('Continue') || 
        text.includes('Game Type')
      );
    });
    
    if (nextButtons.length > 0) {
      console.log(`%c✅ Found ${nextButtons.length} potential Next buttons`, 'color: green');
      
      nextButtons.forEach((button, i) => {
        console.log(`Clicking button ${i + 1}: "${button.textContent.trim()}"`);
        button.click();
      });
    } else {
      console.log('%cNo Next buttons found', 'color: red');
      
      // Ultimate fallback: Try URL manipulation
      console.log('Using URL navigation as final fallback');
      setTimeout(() => {
        window.location.href = `/?step=1&force=true&t=${Date.now()}`;
      }, 500);
    }
    
    return;
  }
  
  // If we have the store, use it to navigate
  console.log('%c✅ Successfully found store, current state:', 'color: green', store);
  
  // Step 2: Make sure we have required values
  console.log('Setting up emergency game state...');
  
  // Use the store's actual update functions to properly update state
  if (typeof store.updateConfig === 'function') {
    // Check what we need to set up
    const needsGameId = !store.config?.gameId;
    const needsTheme = !store.config?.theme?.selectedThemeId;
    
    if (needsGameId || needsTheme) {
      console.log('Updating missing config values: ', {
        needsGameId,
        needsTheme
      });
      
      // Create update object
      const updates = {};
      
      if (needsGameId) {
        updates.gameId = 'emergency_' + new Date().toISOString().slice(0, 10).replace(/-/g, '');
        updates.displayName = 'Emergency Game';
      }
      
      if (needsTheme) {
        updates.theme = {
          ...(store.config.theme || {}),
          mainTheme: 'Emergency Theme',
          description: 'A default theme',
          selectedThemeId: 'default-theme',
          colors: {
            primary: '#E60012',
            secondary: '#0052cc',
            accent: '#ff6600',
            background: '#ffffff'
          }
        };
      }
      
      // Apply updates
      store.updateConfig(updates);
      console.log('Config updated with emergency values');
    }
  }
  
  // Make sure game type is set
  if (typeof store.setGameType === 'function' && !store.gameType) {
    console.log('Setting game type to visual_journey');
    store.setGameType('visual_journey');
  }
  
  // Step 3: Force navigation to step 1 (second step, 0-indexed)
  console.log('%c🚀 FORCING NAVIGATION TO STEP 1 (Game Type)', 'color: blue; font-weight: bold');
  
  // Try multiple approaches to maximize chance of success
  setTimeout(() => {
    try {
      // Approach 1: Direct setStep
      if (typeof store.setStep === 'function') {
        console.log('Using direct setStep method');
        store.setStep(1);
      }
      
      // Approach 2: Use nextStep function
      setTimeout(() => {
        if (store.currentStep === 0 && typeof store.nextStep === 'function') {
          console.log('Current step is still 0, using nextStep method');
          store.nextStep();
        }
      }, 200);
      
      // Approach 3: Check if we need more direct React state update
      setTimeout(() => {
        if (store.currentStep === 0) {
          console.log('Current step is STILL 0, using aggressive direct state update');
          
          // Create a new React state update event
          const event = new Event('react-state-update');
          
          // Use a more direct approach by modifying the state object directly
          if (store.setState) {
            store.setState({ currentStep: 1 });
            document.dispatchEvent(event);
          }
        }
      }, 500);
      
      // Final verification
      setTimeout(() => {
        const newState = window.useGameStore ? 
          window.useGameStore.getState() : 
          (store.getState ? store.getState() : store);
          
        console.log('Final state after navigation attempts:', newState);
        
        if (newState.currentStep === 1) {
          console.log('%c✅ NAVIGATION SUCCESSFUL!', 'color: green; font-weight: bold; font-size: 16px');
        } else {
          console.log('%cNavigation failed, current step is still: ' + newState.currentStep, 'color: red; font-weight: bold');
          console.log('Trying URL redirection as last resort...');
          
          // Last resort: URL redirect
          window.location.href = `/?step=1&force=true&t=${Date.now()}`;
        }
      }, 1000);
    } catch (err) {
      console.error('Error during navigation:', err);
      // Last resort: URL redirect
      window.location.href = `/?step=1&force=true&t=${Date.now()}`;
    }
  }, 100);
  
  console.log('%c🚨 EMERGENCY NAVIGATION SCRIPT COMPLETE', 'color: red; font-weight: bold; font-size: 16px');
})();