/**
 * Deep Debug Script for the Bottom Red Next Button Issue
 * This script performs extensive testing to analyze why the "Next" button isn't working
 */
(function() {
  console.log('%c=== SlotAI Button Debug (CTO Edition) ===', 'background: #E60012; color: white; padding: 10px; font-size: 14px; font-weight: bold;');
  
  // Configuration
  const DEBUG_ID = 'button-debug-' + Date.now();
  const SHOW_UI = true;
  const RUN_INTERVAL = 1000; // Check every second
  let runCount = 0;
  const MAX_RUNS = 10;
  
  // Create debug panel
  function createDebugPanel() {
    if (!SHOW_UI) return null;
    
    const panel = document.createElement('div');
    panel.id = 'debug-panel-' + DEBUG_ID;
    panel.style.cssText = `
      position: fixed;
      left: 0;
      bottom: 0;
      width: 400px;
      max-width: 90vw;
      max-height: 50vh;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-top-right-radius: 8px;
      z-index: 10000;
      overflow-y: auto;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      transition: height 0.3s ease;
    `;
    
    // Add title
    const title = document.createElement('div');
    title.textContent = 'Next Button Debug';
    title.style.cssText = `
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      display: flex;
      justify-content: space-between;
    `;
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      cursor: pointer;
      font-size: 18px;
      color: rgba(255, 255, 255, 0.7);
    `;
    closeBtn.addEventListener('click', () => panel.remove());
    title.appendChild(closeBtn);
    panel.appendChild(title);
    
    // Add log container
    const logContainer = document.createElement('div');
    logContainer.id = 'debug-log-' + DEBUG_ID;
    panel.appendChild(logContainer);
    
    // Add repair button
    const fixButton = document.createElement('button');
    fixButton.textContent = 'Fix Next Button';
    fixButton.style.cssText = `
      background: #E60012;
      color: white;
      border: none;
      padding: 8px 12px;
      margin-top: 10px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    `;
    fixButton.addEventListener('click', () => forceFixButton());
    panel.appendChild(fixButton);
    
    document.body.appendChild(panel);
    return panel;
  }
  
  // Log to debug panel
  function debugLog(message, type = 'info') {
    console.log(`[Button Debug] ${message}`);
    
    if (!SHOW_UI) return;
    
    const logContainer = document.getElementById('debug-log-' + DEBUG_ID);
    if (!logContainer) return;
    
    const entry = document.createElement('div');
    entry.style.cssText = `
      margin: 4px 0;
      padding: 4px;
      border-radius: 2px;
      font-family: monospace;
      white-space: pre-wrap;
      word-break: break-word;
    `;
    
    let color = '#aaa';
    switch (type) {
      case 'error':
        color = '#ff6b6b';
        break;
      case 'success':
        color = '#51cf66';
        break;
      case 'warning':
        color = '#fcc419';
        break;
      case 'info':
        color = '#4dabf7';
        break;
    }
    
    entry.style.color = color;
    entry.textContent = message;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }
  
  // Check if we're on the right page
  function isOnStep1() {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('step') === '0') return true;
    
    // Check for visual indicators
    const headings = document.querySelectorAll('h1, h2, h3');
    for (const heading of headings) {
      if (heading.textContent && heading.textContent.includes('Theme')) {
        return true;
      }
    }
    
    // Check for store state
    if (window.useGameStore && window.useGameStore.getState().currentStep === 0) {
      return true;
    }
    
    return false;
  }
  
  // Find the Next button
  function findNextButton() {
    const allButtons = Array.from(document.querySelectorAll('button'));
    const matchingButtons = allButtons.filter(button => {
      const text = button.textContent || '';
      return (
        (text.includes('Next') || text.includes('Continue')) &&
        !text.includes('Force') &&
        !text.includes('Direct') &&
        !text.includes('Step 2')
      );
    });
    
    // If multiple buttons match, prioritize red ones
    if (matchingButtons.length > 1) {
      // Compute button scores
      const scoredButtons = matchingButtons.map(button => {
        let score = 0;
        
        // Check color (prefer red ones)
        const style = window.getComputedStyle(button);
        const bg = style.backgroundColor || '';
        if (bg.includes('rgb(230') || bg.includes('rgb(225') || bg.includes('rgb(220')) {
          score += 5;
        }
        
        // Check for "Game Type" text
        if (button.textContent.includes('Game Type')) {
          score += 3;
        }
        
        // Check for position (prefer buttons at the bottom)
        const rect = button.getBoundingClientRect();
        const height = window.innerHeight;
        if (rect.bottom > height * 0.6) {
          score += 2;
        }
        
        // Check for wrapper elements
        let parent = button.parentElement;
        while (parent && parent !== document.body) {
          if (parent.tagName === 'FOOTER' || parent.className.includes('footer')) {
            score += 2;
            break;
          }
          parent = parent.parentElement;
        }
        
        return { button, score };
      });
      
      // Sort by score (highest first)
      scoredButtons.sort((a, b) => b.score - a.score);
      
      debugLog(`Found ${matchingButtons.length} potential Next buttons. Best match score: ${scoredButtons[0].score}`);
      return scoredButtons[0].button;
    }
    
    return matchingButtons[0] || null;
  }
  
  // Test button properties
  function inspectButton(button) {
    if (!button) {
      debugLog('No Next button found!', 'error');
      return null;
    }
    
    debugLog(`Found Next button: "${button.textContent.trim()}"`);
    
    // Check if the button is visible and enabled
    const rect = button.getBoundingClientRect();
    const style = window.getComputedStyle(button);
    
    // Gather data
    const data = {
      text: button.textContent.trim(),
      visible: (
        rect.width > 0 && 
        rect.height > 0 && 
        style.display !== 'none' && 
        style.visibility !== 'hidden'
      ),
      enabled: !button.disabled,
      position: {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      style: {
        backgroundColor: style.backgroundColor,
        color: style.color,
        opacity: style.opacity,
        pointerEvents: style.pointerEvents,
        cursor: style.cursor
      },
      reactData: findReactProps(button)
    };
    
    // Log findings
    if (!data.visible) {
      debugLog('Button is not visible on screen!', 'error');
    }
    
    if (!data.enabled) {
      debugLog('Button is disabled!', 'error');
    }
    
    if (data.style.pointerEvents === 'none') {
      debugLog('Button has pointer-events: none - cannot be clicked!', 'error');
    }
    
    // Check handlers
    const clickHandlers = getEventListeners(button);
    data.handlers = clickHandlers;
    
    if (clickHandlers.length === 0) {
      debugLog('Button has no click handlers!', 'error');
    } else {
      debugLog(`Button has ${clickHandlers.length} click handlers.`);
    }
    
    return data;
  }
  
  // Attempt to get event listeners (this is browser-dependent)
  function getEventListeners(element) {
    const listeners = [];
    
    // Try to use Chrome/Edge DevTools API
    if (window.getEventListeners) {
      try {
        const chromeListeners = window.getEventListeners(element);
        if (chromeListeners && chromeListeners.click) {
          return chromeListeners.click.length;
        }
      } catch (e) {
        // Not available or error
      }
    }
    
    // Check for React handlers
    const reactKey = Object.keys(element).find(key => 
      key.startsWith('__reactProps$') || 
      key.startsWith('__reactEvents$')
    );
    
    if (reactKey) {
      const reactProps = element[reactKey];
      if (reactProps.onClick) {
        listeners.push('React onClick');
      }
    }
    
    // Check for inline handlers
    if (element.onclick) {
      listeners.push('onclick attribute');
    }
    
    // Check for addEventListener handlers
    if (element._events && element._events.click) {
      listeners.push('addEventListener (jQuery style)');
    }
    
    return listeners;
  }
  
  // Try to find React properties
  function findReactProps(element) {
    // Nothing to return for non-elements
    if (!element || !element.tagName) return null;
    
    // Check for Fiber
    const reactKey = Object.keys(element).find(key => 
      key.startsWith('__reactFiber$') || 
      key.startsWith('__reactInternalInstance$')
    );
    
    if (reactKey) {
      try {
        const internalInstance = element[reactKey];
        if (internalInstance) {
          // Trace up to find component name
          let fiber = internalInstance;
          while (fiber) {
            if (fiber.type) {
              if (typeof fiber.type === 'string') {
                // DOM element
              } else if (fiber.type.displayName || fiber.type.name) {
                // React component
                return {
                  componentName: fiber.type.displayName || fiber.type.name,
                  memoized: fiber.memoizedProps ? true : false
                };
              }
            }
            fiber = fiber.return;
          }
        }
      } catch (e) {
        return { error: e.message };
      }
    }
    
    return null;
  }
  
  // Check the Zustand store implementation
  function inspectStore() {
    if (!window.useGameStore) {
      debugLog('useGameStore not found in window scope!', 'error');
      return null;
    }
    
    try {
      const store = window.useGameStore.getState();
      
      // Check the state
      debugLog('Current store state:', 'info');
      debugLog(`  Current step: ${store.currentStep}`);
      
      // Check if theme is selected
      const themeSelected = store.config?.theme?.selectedThemeId ? true : false;
      debugLog(`  Theme selected: ${themeSelected ? 'Yes' : 'No'}`);
      if (themeSelected) {
        debugLog(`    Theme ID: ${store.config.theme.selectedThemeId}`);
      }
      
      // Check if game ID is set
      const gameIdSet = store.config?.gameId ? true : false;
      debugLog(`  Game ID set: ${gameIdSet ? 'Yes' : 'No'}`);
      if (gameIdSet) {
        debugLog(`    Game ID: ${store.config.gameId}`);
      }
      
      // Check setStep implementation
      let setStepImplemented = typeof store.setStep === 'function';
      debugLog(`  setStep implemented: ${setStepImplemented ? 'Yes' : 'No'}`);
      
      // Check nextStep implementation
      let nextStepImplemented = typeof store.nextStep === 'function';
      debugLog(`  nextStep implemented: ${nextStepImplemented ? 'Yes' : 'No'}`);
      
      return {
        currentStep: store.currentStep,
        themeSelected,
        gameIdSet,
        setStepImplemented,
        nextStepImplemented
      };
    } catch (e) {
      debugLog(`Error inspecting store: ${e.message}`, 'error');
      return null;
    }
  }
  
  // Test clicking the button
  function testClickButton(button) {
    if (!button) {
      debugLog('No button to click', 'error');
      return;
    }
    
    debugLog('Testing button click...', 'info');
    
    try {
      // Save initial state
      const initialStep = window.useGameStore ? 
        window.useGameStore.getState().currentStep : null;
      
      // Try direct click
      button.click();
      
      // Check if state changed
      setTimeout(() => {
        if (!window.useGameStore) return;
        
        const newStep = window.useGameStore.getState().currentStep;
        
        if (newStep !== initialStep) {
          debugLog(`Step changed from ${initialStep} to ${newStep}!`, 'success');
        } else {
          debugLog(`Step did not change after click (still ${newStep})`, 'error');
          
          // Try additional methods
          debugLog('Trying alternate click methods...', 'info');
          
          // Create a MouseEvent
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          
          // Dispatch it
          const dispatched = button.dispatchEvent(clickEvent);
          debugLog(`MouseEvent dispatched: ${dispatched}`);
          
          // If that didn't work, try more aggressive approaches
          setTimeout(() => {
            if (window.useGameStore.getState().currentStep === initialStep) {
              debugLog('Still not navigating. Checking for React component...', 'warning');
              
              // Try to find React onClick handler
              const reactKey = Object.keys(button).find(key => 
                key.startsWith('__reactProps$')
              );
              
              if (reactKey && button[reactKey] && button[reactKey].onClick) {
                debugLog('Found React onClick handler, trying to invoke it directly...', 'info');
                try {
                  button[reactKey].onClick();
                } catch (e) {
                  debugLog(`Error invoking React handler: ${e.message}`, 'error');
                }
              }
            }
          }, 500);
        }
      }, 500);
    } catch (e) {
      debugLog(`Error clicking button: ${e.message}`, 'error');
    }
  }
  
  // Force fix the button
  function forceFixButton() {
    debugLog('🔧 Attempting forced fix of button...', 'info');
    
    const button = findNextButton();
    if (!button) {
      debugLog('Could not find button to fix!', 'error');
      return;
    }
    
    // Create a clone with our own handler
    const clone = button.cloneNode(true);
    
    // Add special styling to indicate fix
    clone.style.position = 'relative';
    clone.style.overflow = 'hidden';
    
    // Add visual indicator
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 0 20px 20px 0;
      border-color: transparent #4caf50 transparent transparent;
      z-index: 5;
    `;
    clone.appendChild(indicator);
    
    // Add our own click handler
    clone.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      debugLog('Fixed button clicked!', 'success');
      
      // 1. Try direct state manipulation
      if (window.useGameStore) {
        const store = window.useGameStore.getState();
        
        // Ensure we have required data
        const updates = {};
        
        // Auto-generate game ID if needed
        if (!store.config.gameId) {
          const gameId = `debug_${Date.now()}`;
          updates.gameId = gameId;
          updates.displayName = 'Debug Game';
          debugLog(`Auto-generated game ID: ${gameId}`, 'info');
        }
        
        // Set default theme if needed
        if (!store.config.theme?.selectedThemeId) {
          updates.theme = {
            ...(store.config.theme || {}),
            mainTheme: 'Default Theme',
            selectedThemeId: 'default-theme',
            colors: {
              primary: '#E60012',
              secondary: '#0052cc',
              accent: '#ff6600',
              background: '#ffffff'
            }
          };
          debugLog('Auto-generated default theme', 'info');
        }
        
        // Apply updates if needed
        if (Object.keys(updates).length > 0) {
          store.updateConfig(updates);
          debugLog('Applied required updates to store', 'success');
        }
        
        // Force step change
        debugLog('Forcing direct navigation to step 1...', 'info');
        store.setStep(1);
        
        // Verify step change
        setTimeout(() => {
          const newStep = window.useGameStore.getState().currentStep;
          if (newStep === 1) {
            debugLog('Navigation successful! Now on step 1', 'success');
          } else {
            debugLog(`Navigation failed! Still on step ${newStep}`, 'error');
            
            // Try alternative: standalone page
            debugLog('Redirecting to standalone step 2 page...', 'warning');
            window.location.href = '/standalone-step2.html';
          }
        }, 200);
      } else {
        // No store, use direct navigation
        debugLog('No access to store, using direct navigation instead', 'warning');
        window.location.href = '/standalone-step2.html';
      }
    });
    
    // Replace the button
    button.parentNode.replaceChild(clone, button);
    
    debugLog('Button has been replaced with fixed version!', 'success');
    debugLog('Click the button to continue to Step 2', 'info');
  }
  
  // Main debug routine
  function runDebug() {
    debugLog(`=== Debug Run #${runCount + 1} ===`, 'info');
    
    // Skip if we're not on Step 1
    if (!isOnStep1()) {
      debugLog('Not on Step 1, debug not applicable', 'warning');
      return;
    }
    
    // Find the button
    const nextButton = findNextButton();
    
    // Inspect the button
    const buttonData = inspectButton(nextButton);
    
    // Inspect the store
    const storeData = inspectStore();
    
    // Deep analysis of the problem
    if (buttonData && storeData) {
      debugLog('=== Root Cause Analysis ===', 'info');
      
      // Check if button is properly enabled
      if (!buttonData.enabled && (storeData.themeSelected || storeData.gameIdSet)) {
        debugLog('ISSUE: Button is disabled but requirements are met!', 'error');
      }
      
      // Check if navigation functions exist
      if (!storeData.nextStepImplemented) {
        debugLog('ISSUE: nextStep function is missing in store!', 'error');
      }
      
      if (!storeData.setStepImplemented) {
        debugLog('ISSUE: setStep function is missing in store!', 'error');
      }
      
      // Check if React handlers are properly connected
      if (buttonData.handlers.length === 0) {
        debugLog('ISSUE: No click handlers attached to button!', 'error');
      }
      
      // Test click if conditions seem appropriate
      if (buttonData.enabled && buttonData.visible && buttonData.handlers.length > 0) {
        if (runCount === MAX_RUNS - 1) { // Only on last run to avoid multiple clicks
          testClickButton(nextButton);
        }
      }
    }
    
    // Increment run count and schedule next run if needed
    runCount++;
    
    if (runCount < MAX_RUNS) {
      setTimeout(runDebug, RUN_INTERVAL);
    } else {
      debugLog('=== Debug Complete ===', 'info');
      
      // Final recommendation
      debugLog('Recommendation: Use the "Fix Next Button" button below to apply a fix.', 'info');
    }
  }
  
  // Start the debug process
  const panel = createDebugPanel();
  if (panel) {
    debugLog('Debug panel created and active', 'info');
    debugLog('Analyzing the Next button...', 'info');
    
    // Start the debug runs
    setTimeout(runDebug, 1000);
  }
})();