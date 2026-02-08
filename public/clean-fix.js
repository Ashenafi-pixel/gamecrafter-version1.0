/**
 * Clean Next Button Fix
 * This script only modifies the Next button behavior without adding any UI elements
 */

(function() {
  console.log('🔄 Installing clean Next button fix...');
  
  // Store current theme and game ID before navigation
  function saveSelections() {
    try {
      const store = window.useGameStore?.getState();
      if (!store || !store.config) return false;
      
      const data = {
        gameId: store.config.gameId || null,
        displayName: store.config.displayName || null,
        theme: store.config.theme || null
      };
      
      console.log('Saving current selections:', data);
      localStorage.setItem('slotai_emergency_config', JSON.stringify(data));
      return true;
    } catch (err) {
      console.error('Error saving selections:', err);
      return false;
    }
  }
  
  // Find and replace the Next button
  function fixNextButton() {
    // Find all buttons
    const buttons = Array.from(document.querySelectorAll('button'));
    
    // Find the Next button
    const nextButton = buttons.find(btn => {
      const text = (btn.textContent || '').trim();
      return (
        (text.includes('Next') || text.includes('Continue to Game Type')) &&
        !text.includes('Force') &&
        !text.includes('Direct')
      );
    });
    
    if (!nextButton) {
      console.log('Next button not found, retrying in 1 second...');
      setTimeout(fixNextButton, 1000);
      return;
    }
    
    console.log('Found Next button:', nextButton);
    
    // Create a clone of the button to prevent any React event handlers
    const originalButton = nextButton;
    const clonedButton = nextButton.cloneNode(true);
    
    // Add our own click handler
    clonedButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('🔄 Custom Next button clicked');
      
      // Save current selections
      saveSelections();
      
      // Navigate to standalone Step 2
      window.location.href = '/standalone-step2.html';
    });
    
    // Replace the original button
    if (originalButton.parentNode) {
      originalButton.parentNode.replaceChild(clonedButton, originalButton);
      console.log('✅ Successfully replaced Next button with fixed version');
    }
  }
  
  // Remove the emergency navigator if it exists
  function removeEmergencyNavigator() {
    try {
      // Remove the emergency navigator container
      const container = document.getElementById('emergency-nav-container');
      if (container) {
        container.remove();
        console.log('✅ Removed emergency navigator UI');
      }
      
      // Try to find it by other means
      document.querySelectorAll('div').forEach(div => {
        if ((div.textContent || '').includes('Emergency Navigation') &&
            !div.id.includes('error') && // Don't remove error messages
            div.style.position === 'fixed') {
          div.remove();
          console.log('✅ Removed additional emergency navigation UI');
        }
      });
    } catch (err) {
      console.error('Error removing emergency navigator:', err);
    }
  }
  
  // Initialize our fix
  function init() {
    console.log('🔄 Starting clean fix initialization...');
    
    // Remove emergency navigator
    removeEmergencyNavigator();
    
    // Fix next button
    fixNextButton();
    
    console.log('✅ Clean fix initialized');
  }
  
  // Start initialization
  init();
})();