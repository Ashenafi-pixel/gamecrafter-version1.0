/**
 * SlotAI AutoFix Script
 * This script automatically fixes the Next button in Step 1
 * to navigate to our standalone Step 2 page
 */

(function() {
  console.log('🔧 SlotAI AutoFix: Initializing...');
  
  // Check if we're on Step 1
  function isStep1() {
    try {
      // Check URL for step parameter
      const params = new URLSearchParams(window.location.search);
      const step = params.get('step');
      if (step === '0') return true;
      
      // Check store if available
      if (window.useGameStore) {
        const state = window.useGameStore.getState();
        if (state.currentStep === 0) return true;
      }
      
      // Check for visual elements that indicate Step 1
      const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
      for (const heading of headings) {
        const text = heading.textContent || '';
        if (text.includes('Theme') && text.includes('Design')) return true;
      }
      
      // Check for EnhancedThemeExplorer component
      if (document.querySelector('[class*="theme-explorer"]')) return true;
      
      return false;
    } catch (err) {
      console.error('Error determining step:', err);
      return false;
    }
  }
  
  // Find and fix the Next button
  function fixNextButton() {
    if (!isStep1()) {
      console.log('Not on Step 1, no fix needed');
      return;
    }
    
    console.log('On Step 1, looking for Next button...');
    
    // Find all buttons that might be the Next button
    const possibleButtons = Array.from(document.querySelectorAll('button')).filter(button => {
      const text = button.textContent || '';
      return (
        (text.includes('Next') || text.includes('Continue')) &&
        !text.includes('Emergency') &&
        !text.includes('Force') &&
        !text.includes('Direct')
      );
    });
    
    if (possibleButtons.length === 0) {
      console.log('No suitable Next button found, will retry in 1 second...');
      setTimeout(fixNextButton, 1000);
      return;
    }
    
    // Sort buttons by likelihood of being the correct one
    const nextButtons = possibleButtons.sort((a, b) => {
      const aText = a.textContent || '';
      const bText = b.textContent || '';
      
      // Prefer buttons with "Game Type" in the text
      if (aText.includes('Game Type') && !bText.includes('Game Type')) return -1;
      if (!aText.includes('Game Type') && bText.includes('Game Type')) return 1;
      
      // Prefer buttons with "Continue" over just "Next"
      if (aText.includes('Continue') && !bText.includes('Continue')) return -1;
      if (!aText.includes('Continue') && bText.includes('Continue')) return 1;
      
      // Prefer buttons that are enabled over disabled
      if (!a.disabled && b.disabled) return -1;
      if (a.disabled && !b.disabled) return 1;
      
      return 0;
    });
    
    // Get the most likely Next button
    const nextButton = nextButtons[0];
    console.log(`Found Next button: "${nextButton.textContent?.trim()}"`);
    
    // Create a clone of the button to prevent React event handlers
    const originalButton = nextButton;
    const clonedButton = nextButton.cloneNode(true);
    
    // Save current theme and game ID state for the standalone page
    function saveState() {
      try {
        if (!window.useGameStore) return;
        
        const store = window.useGameStore.getState();
        const gameData = {
          gameId: store.config?.gameId || null,
          displayName: store.config?.displayName || null,
          theme: store.config?.theme || null
        };
        
        console.log('Saving game state:', gameData);
        localStorage.setItem('slotai_emergency_config', JSON.stringify(gameData));
        
        return true;
      } catch (err) {
        console.error('Error saving state:', err);
        return false;
      }
    }
    
    // Add our own click handler that redirects to Step 2
    clonedButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🔧 AutoFix: Next button clicked');
      
      // Save current state
      saveState();
      
      // Navigate to either auto-redirect or directly to standalone Step 2
      window.location.href = '/auto-redirect.html';
    });
    
    // Replace the original button with our fixed version
    if (originalButton.parentNode) {
      originalButton.parentNode.replaceChild(clonedButton, originalButton);
      console.log('✅ Successfully replaced Next button with fixed version');
      
      // Add a subtle indicator to show the button has been fixed
      clonedButton.style.position = 'relative';
      const indicator = document.createElement('div');
      indicator.style.cssText = `
        position: absolute;
        top: -4px;
        right: -4px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #2ecc71;
        box-shadow: 0 0 4px rgba(46, 204, 113, 0.8);
      `;
      clonedButton.appendChild(indicator);
    }
  }
  
  // Apply the fix
  setTimeout(fixNextButton, 1000);
  
  // Also try again after a longer delay in case the UI is slow to load
  setTimeout(fixNextButton, 3000);
  
  console.log('🔧 SlotAI AutoFix: Initialization complete');
})();