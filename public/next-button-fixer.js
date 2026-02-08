// Next Button Fixer - Ultimate Navigation Fix Tool
// Version 1.0.0 (2025-05-16)

(function() {
  console.log("🛠️ Next Button Fixer - Loading...");

  // Create debug UI container
  const createDebugPanel = () => {
    const panel = document.createElement('div');
    panel.id = 'next-button-fixer-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 320px;
      max-height: 500px;
      overflow-y: auto;
      background-color: rgba(0, 0, 0, 0.85);
      color: #0f0;
      font-family: monospace;
      padding: 15px;
      border-radius: 8px;
      z-index: 9999;
      border: 2px solid #0f0;
      box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;

    const heading = document.createElement('div');
    heading.textContent = "🔄 Next Button Fixer";
    heading.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      color: white;
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
      padding-bottom: 5px;
    `;
    panel.appendChild(heading);

    const logContainer = document.createElement('div');
    logContainer.id = 'next-button-fixer-logs';
    logContainer.style.cssText = `
      font-size: 12px;
      line-height: 1.4;
      margin-bottom: 10px;
      max-height: 250px;
      overflow-y: auto;
      padding: 5px;
      background-color: rgba(0, 0, 0, 0.5);
      border-radius: 4px;
    `;
    panel.appendChild(logContainer);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    `;

    // Add action buttons
    const createButton = (text, onClick, color = '#0f0') => {
      const button = document.createElement('button');
      button.textContent = text;
      button.style.cssText = `
        background-color: rgba(0, 0, 0, 0.8);
        color: ${color};
        border: 1px solid ${color};
        border-radius: 4px;
        padding: 6px 10px;
        cursor: pointer;
        font-size: 12px;
        flex-grow: 1;
      `;
      button.addEventListener('click', onClick);
      buttonsContainer.appendChild(button);
      return button;
    };

    createButton("Fix Button", fixNextButton, '#0f0');
    createButton("Force Navigate", forceNavigateToStep2, '#00bfff');
    createButton("Analyze DOM", analyzeDOM, '#ffcc00');
    createButton("Check Store", analyzeStore, '#ff9900');
    createButton("Inject Fallback", injectFallbackButton, '#ff00ff');
    
    // Clear logs and close buttons
    const bottomButtons = document.createElement('div');
    bottomButtons.style.cssText = `
      display: flex;
      gap: 8px;
      margin-top: 8px;
    `;
    
    const clearButton = document.createElement('button');
    clearButton.textContent = "Clear Logs";
    clearButton.style.cssText = `
      background-color: rgba(0, 0, 0, 0.8);
      color: #999;
      border: 1px solid #999;
      border-radius: 4px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 12px;
      flex: 1;
    `;
    clearButton.addEventListener('click', () => {
      const logContainer = document.getElementById('next-button-fixer-logs');
      if (logContainer) logContainer.innerHTML = '';
      log("Logs cleared");
    });
    bottomButtons.appendChild(clearButton);

    const closeButton = document.createElement('button');
    closeButton.textContent = "Close";
    closeButton.style.cssText = `
      background-color: rgba(0, 0, 0, 0.8);
      color: #ff5555;
      border: 1px solid #ff5555;
      border-radius: 4px;
      padding: 6px 10px;
      cursor: pointer;
      font-size: 12px;
      flex: 1;
    `;
    closeButton.addEventListener('click', () => {
      const panel = document.getElementById('next-button-fixer-panel');
      if (panel) document.body.removeChild(panel);
    });
    bottomButtons.appendChild(closeButton);
    
    panel.appendChild(buttonsContainer);
    panel.appendChild(bottomButtons);

    // Make panel draggable
    let isDragging = false;
    let dragOffsetX, dragOffsetY;

    heading.style.cursor = 'move';
    heading.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragOffsetX = e.clientX - panel.offsetLeft;
      dragOffsetY = e.clientY - panel.offsetTop;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        panel.style.left = (e.clientX - dragOffsetX) + 'px';
        panel.style.top = (e.clientY - dragOffsetY) + 'px';
        e.preventDefault();
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    return panel;
  };

  // Logger function
  const log = (message, type = 'info') => {
    const logContainer = document.getElementById('next-button-fixer-logs');
    if (!logContainer) return;

    const logEntry = document.createElement('div');
    
    let color;
    let prefix;
    
    switch (type) {
      case 'error':
        color = '#ff5555';
        prefix = '❌ ERROR: ';
        break;
      case 'success':
        color = '#50fa7b';
        prefix = '✅ SUCCESS: ';
        break;
      case 'warning':
        color = '#f1fa8c';
        prefix = '⚠️ WARNING: ';
        break;
      default:
        color = '#8be9fd';
        prefix = '🔍 INFO: ';
    }
    
    logEntry.style.cssText = `
      color: ${color};
      margin-bottom: 4px;
      font-size: 12px;
      line-height: 1.3;
      word-break: break-word;
    `;
    
    logEntry.textContent = prefix + message;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    console.log(`[Next Button Fixer] ${prefix}${message}`);
  };

  // Find the Next button
  const findNextButton = () => {
    log("Searching for Next button...");
    
    // Strategy 1: Look for buttons with "Next" text
    const buttonsByText = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent?.includes('Next') && 
      !btn.textContent?.includes('Force') &&
      !btn.disabled &&
      getComputedStyle(btn).display !== 'none'
    );
    
    if (buttonsByText.length > 0) {
      log(`Found ${buttonsByText.length} Next buttons by text`);
      
      // Try to find the specific red button in Step 1
      const redNextBtn = buttonsByText.find(btn => {
        const style = getComputedStyle(btn);
        return style.backgroundColor.includes('rgb(220') || // Red-ish
               style.backgroundColor.includes('rgb(239') || // Red-ish
               btn.classList.contains('bg-red') ||
               btn.classList.contains('from-red') ||
               btn.parentElement?.classList.contains('from-red');
      });
      
      if (redNextBtn) {
        log("Found red Next button!", 'success');
        return redNextBtn;
      }
      
      // If no red button, return the first one
      log("No red Next button found, using first Next button");
      return buttonsByText[0];
    }
    
    // Strategy 2: Look by class names and position
    log("Looking by class/position...");
    const possibleButtons = Array.from(document.querySelectorAll('button'))
      .filter(btn => {
        const rect = btn.getBoundingClientRect();
        const isRightSide = rect.right > window.innerWidth / 2;
        const isBottomHalf = rect.bottom > window.innerHeight / 2;
        return isRightSide && isBottomHalf && !btn.disabled;
      });
    
    if (possibleButtons.length > 0) {
      log(`Found ${possibleButtons.length} possible buttons by position`);
      return possibleButtons[0];
    }
    
    log("No Next button found!", 'error');
    return null;
  };

  // Find Step 1 component
  const findStep1Component = () => {
    log("Searching for Step 1 component...");
    
    // Try to identify the component by class names and content
    const possibleSteps = Array.from(document.querySelectorAll('.enhanced-theme-selection, [class*="theme-selection"], [class*="step1"]'));
    
    if (possibleSteps.length > 0) {
      log(`Found ${possibleSteps.length} possible Step 1 components`, 'success');
      return possibleSteps[0];
    }
    
    log("No Step 1 component found", 'error');
    return null;
  };

  // Check Zustand store
  const analyzeStore = () => {
    log("Analyzing Zustand store...");
    
    try {
      if (!window.useGameStore) {
        log("useGameStore not found in window scope", 'error');
        return false;
      }
      
      const store = window.useGameStore.getState();
      log(`Current step: ${store.currentStep}`);
      log(`Total steps: ${store.totalSteps}`);
      
      if (store.config?.theme?.selectedThemeId) {
        log(`Selected theme: ${store.config.theme.selectedThemeId}`, 'success');
      } else {
        log("No theme selected!", 'warning');
      }
      
      if (store.config?.gameId) {
        log(`Game ID: ${store.config.gameId}`, 'success');
      } else {
        log("No game ID set!", 'warning');
      }
      
      // Test store functions
      log("Testing store.setStep function...");
      try {
        const originalStep = store.currentStep;
        
        // Try to call setStep with the same value (shouldn't change anything)
        store.setStep(originalStep);
        log(`Called setStep(${originalStep}) - No change should occur`);
        
        // Verify the store functions
        if (typeof store.nextStep !== 'function') {
          log("store.nextStep is not a function!", 'error');
        } else {
          log("store.nextStep is available", 'success');
        }
        
        if (typeof store.setStep !== 'function') {
          log("store.setStep is not a function!", 'error');
        } else {
          log("store.setStep is available", 'success');
        }
        
        return true;
      } catch (error) {
        log(`Store function test failed: ${error.message}`, 'error');
        return false;
      }
    } catch (error) {
      log(`Store analysis failed: ${error.message}`, 'error');
      return false;
    }
  };

  // Analyze DOM structure
  const analyzeDOM = () => {
    log("Analyzing DOM structure...");
    
    const button = findNextButton();
    if (!button) {
      log("Cannot analyze - Next button not found", 'error');
      return;
    }
    
    // Get button properties
    log(`Button text: "${button.textContent.trim()}"`);
    log(`Button classes: ${button.className}`);
    
    // Check if button has click handlers
    const clickHandlers = getEventListeners(button);
    if (clickHandlers && clickHandlers.length > 0) {
      log(`Button has ${clickHandlers.length} click handlers`, 'success');
    } else {
      log("Button has no direct click handlers!", 'warning');
    }
    
    // Check button style
    const style = getComputedStyle(button);
    log(`Button color: ${style.color}`);
    log(`Button background: ${style.backgroundColor}`);
    
    // Check if button is inside a React component
    let reactInstance = null;
    for (const key in button) {
      if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) {
        reactInstance = button[key];
        break;
      }
    }
    
    if (reactInstance) {
      log("Button is part of a React component", 'success');
      
      // Try to find component name and props
      let fiber = reactInstance;
      
      while (fiber) {
        if (fiber.elementType && typeof fiber.elementType === 'function') {
          const name = fiber.elementType.name || 'UnnamedComponent';
          log(`Found React component: ${name}`);
        }
        
        if (fiber.memoizedProps && fiber.memoizedProps.onClick) {
          log("Found onClick handler in component props!", 'success');
          break;
        }
        
        fiber = fiber.return;
      }
    } else {
      log("Button is not part of a React component", 'warning');
    }
    
    // Check for potential issues
    if (button.disabled) {
      log("Button is disabled!", 'error');
    }
    
    if (style.pointerEvents === 'none') {
      log("Button has pointer-events: none", 'error');
    }
    
    if (parseFloat(style.opacity) < 0.1) {
      log("Button is nearly invisible (low opacity)", 'warning');
    }
  };

  // Get event listeners (mock implementation since actual getEventListeners is only in DevTools)
  const getEventListeners = (element) => {
    // We can't directly access event listeners, so we'll simulate
    const clickHandler = element.onclick;
    if (clickHandler) {
      return [{ type: 'click', handler: clickHandler }];
    }
    
    // For React synthetic events, we can't directly detect them
    // but we can assume they might exist if certain properties are present
    for (const key in element) {
      if (key.startsWith('__reactEventHandlers$')) {
        const handlers = element[key];
        if (handlers && handlers.onClick) {
          return [{ type: 'synthetic-click', handler: handlers.onClick }];
        }
      }
    }
    
    return [];
  };

  // Fix the Next button issue
  const fixNextButton = () => {
    log("Attempting to fix Next button...");
    
    const button = findNextButton();
    if (!button) {
      log("Cannot fix - Next button not found", 'error');
      injectFallbackButton();
      return;
    }
    
    // Strategy: Replace the button with a cloned version that has direct DOM event handlers
    log("Cloning button and adding custom handlers...");
    
    const clone = button.cloneNode(true);
    
    // Add visual indicator that this is a fixed button
    clone.style.position = 'relative';
    
    // Add a subtle glow effect to indicate it's the fixed button
    clone.style.boxShadow = '0 0 8px rgba(0, 255, 0, 0.5)';
    
    // Add our custom click handler that directly manipulates state
    clone.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      log("Fixed button clicked!", 'success');
      
      // 1. Try multiple navigation methods in sequence
      try {
        // Get store reference
        if (window.useGameStore) {
          const store = window.useGameStore.getState();
          
          // Ensure required data is present
          if (!store.config.gameId) {
            const gameId = `game_${Date.now()}`;
            log(`Setting default gameId: ${gameId}`);
            store.updateConfig({ gameId });
          }
          
          if (!store.config?.theme?.selectedThemeId) {
            log("Setting default theme");
            store.updateConfig({
              theme: {
                ...store.config.theme || {},
                selectedThemeId: 'default-theme',
                mainTheme: 'Default Theme'
              }
            });
          }
          
          // Try direct navigation via setStep
          log("Attempting direct navigation using store.setStep(1)");
          store.setStep(1);
          
          // Verify if it worked after a short delay
          setTimeout(() => {
            const currentStep = window.useGameStore.getState().currentStep;
            if (currentStep === 1) {
              log("Navigation successful! Now on step 1", 'success');
            } else {
              log(`Navigation failed! Still on step ${currentStep}`, 'error');
              
              // Try using nextStep method as fallback
              log("Trying nextStep method as fallback");
              window.useGameStore.getState().nextStep();
              
              setTimeout(() => {
                const newStep = window.useGameStore.getState().currentStep;
                if (newStep === 1) {
                  log("Navigation successful with nextStep!", 'success');
                } else {
                  log("All direct navigation methods failed", 'error');
                  forceNavigateToStep2();
                }
              }, 200);
            }
          }, 200);
        } else {
          log("useGameStore not found, using URL navigation", 'warning');
          forceNavigateToStep2();
        }
      } catch (error) {
        log(`Error during navigation: ${error.message}`, 'error');
        forceNavigateToStep2();
      }
    });
    
    // Replace the original button with our fixed clone
    button.parentNode.replaceChild(clone, button);
    log("Button replaced with fixed version", 'success');
    
    // Add a visual indicator
    const indicator = document.createElement('div');
    indicator.textContent = "✓ FIXED";
    indicator.style.cssText = `
      position: absolute;
      top: -20px;
      right: 0;
      background-color: rgba(0, 255, 0, 0.8);
      color: black;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: system-ui, sans-serif;
      font-weight: bold;
      pointer-events: none;
    `;
    clone.appendChild(indicator);
  };

  // Force navigation to Step 2
  const forceNavigateToStep2 = () => {
    log("Forcing direct navigation to Step 2...");
    
    // Try using URL parameters first
    try {
      // Save state to localStorage as backup
      if (window.useGameStore) {
        const store = window.useGameStore.getState();
        log("Saving current state to localStorage");
        localStorage.setItem('slotai_emergency_nav', 'true');
        localStorage.setItem('slotai_target_step', '1');
        localStorage.setItem('slotai_timestamp', Date.now().toString());
        localStorage.setItem('slotai_game_data', JSON.stringify({
          gameId: store.config.gameId || `game_${Date.now()}`,
          theme: store.config.theme || {
            selectedThemeId: 'default-theme',
            mainTheme: 'Default Theme'
          }
        }));
      }
      
      // Try direct navigation to standalone page first
      log("Redirecting to standalone Step 2 page");
      window.location.href = '/standalone-step2.html';
    } catch (error) {
      log(`Navigation failed: ${error.message}`, 'error');
      
      // Fallback to URL parameter navigation
      try {
        window.location.href = '/?step=1&force=true&t=' + Date.now();
      } catch (e) {
        log("All navigation methods failed", 'error');
      }
    }
  };

  // Inject a fallback button as last resort
  const injectFallbackButton = () => {
    log("Injecting fallback navigation button...");
    
    const existingFallback = document.getElementById('emergency-next-button');
    if (existingFallback) {
      log("Fallback button already exists", 'warning');
      return;
    }
    
    const fallbackBtn = document.createElement('button');
    fallbackBtn.id = 'emergency-next-button';
    fallbackBtn.textContent = '⚡ EMERGENCY: GO TO STEP 2';
    fallbackBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #ff3366;
      color: white;
      font-weight: bold;
      padding: 15px 20px;
      border-radius: 8px;
      border: none;
      box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
      cursor: pointer;
      z-index: 9999;
      font-size: 16px;
      animation: pulse 1.5s infinite;
    `;
    
    // Add keyframe animation
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(255, 0, 0, 0.7); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(styleElement);
    
    fallbackBtn.addEventListener('click', forceNavigateToStep2);
    document.body.appendChild(fallbackBtn);
    
    log("Emergency button injected", 'success');
  };

  // Main initialization function
  const initialize = () => {
    try {
      // Add debug panel to page
      const panel = createDebugPanel();
      document.body.appendChild(panel);
      
      log("Next Button Fixer loaded successfully", 'success');
      log("Current URL: " + window.location.href);
      
      // Check if we're on Step 1
      if (window.useGameStore) {
        const currentStep = window.useGameStore.getState().currentStep;
        log(`Current step: ${currentStep}`);
        
        if (currentStep !== 0) {
          log("Not on Step 1 - tool might not be needed", 'warning');
        }
      } else {
        log("useGameStore not found in window scope", 'warning');
      }
      
      // Initial analysis
      setTimeout(() => {
        const button = findNextButton();
        if (button) {
          log("Next button found automatically", 'success');
        } else {
          log("Next button not found automatically", 'error');
          injectFallbackButton();
        }
        
        // Analyze store state
        analyzeStore();
      }, 500);
      
      // Show reminder about keyboard shortcut
      setTimeout(() => {
        log("Tip: Try pressing F key for auto-fix");
      }, 2000);
      
      // Add keyboard shortcut for quick fix (press F)
      document.addEventListener('keydown', (e) => {
        if (e.key === 'f' || e.key === 'F') {
          log("Keyboard shortcut triggered");
          fixNextButton();
        }
      });
      
      return true;
    } catch (error) {
      console.error("Failed to initialize Next Button Fixer:", error);
      return false;
    }
  };

  // Run initialization
  initialize();
})();