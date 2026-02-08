/**
 * HOW TO BYPASS THE BROKEN NAVIGATION BETWEEN STEPS 1 AND 2:
 * 
 * 1. From Step 1 (Theme Selection), open browser console with F12
 * 2. Copy and paste this entire script 
 * 3. Press Enter to run it
 * 4. You'll see a red button in the top right corner
 * 5. Select your theme and enter game name as usual
 * 6. Click either the modified Next button OR the red button to go to Step 2
 */

(function() {
  console.log('🛠️ Installing custom navigation for Step 1...');
  
  // Find the Next button
  const findNextButton = () => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(btn => {
      const text = btn.textContent || '';
      return (
        (text.includes('Next') || text.includes('Continue') || text.includes('Game Type')) &&
        !text.includes('Force')
      );
    });
  };
  
  // Store selected theme and game ID
  const saveCurrentSelections = () => {
    try {
      // Get current store state
      const store = window.useGameStore?.getState();
      if (!store) return null;
      
      const themeData = {
        gameId: store.config?.gameId || null,
        displayName: store.config?.displayName || null,
        theme: store.config?.theme || null
      };
      
      console.log('Saving current theme data:', themeData);
      localStorage.setItem('slotai_emergency_config', JSON.stringify(themeData));
      return themeData;
    } catch (err) {
      console.error('Failed to save selections:', err);
      return null;
    }
  };
  
  // Main function
  const setupCustomNavigation = () => {
    const nextButton = findNextButton();
    if (!nextButton) {
      console.log('Next button not found, will try again in 1 second');
      setTimeout(setupCustomNavigation, 1000);
      return;
    }
    
    console.log('Found Next button:', nextButton);
    
    // Create a clone of the original button with same styling
    const originalButton = nextButton;
    const originalParent = originalButton.parentNode;
    
    // Copy the button
    const newButton = originalButton.cloneNode(true);
    
    // Replace the click action
    newButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Custom Next button clicked');
      
      // Save current selections
      saveCurrentSelections();
      
      // Navigate to standalone Step 2
      window.location.href = '/standalone-step2.html';
    });
    
    // Add a visual indicator that this button is modified
    const buttonText = newButton.textContent;
    if (buttonText) {
      newButton.innerHTML = buttonText.replace('Continue to Game Type', '➡️ Continue to Game Type');
    }
    
    // Replace the original button
    if (originalParent) {
      originalParent.replaceChild(newButton, originalButton);
      console.log('Successfully replaced Next button with custom version');
    }
  };
  
  // Try to set up right away
  setupCustomNavigation();
  
  // Also add a direct navigation button to the top of the page
  const addEmergencyButton = () => {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #E60012;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      z-index: 9999;
      font-family: system-ui, sans-serif;
      font-size: 14px;
    `;
    container.innerHTML = '🔄 Direct to Step 2';
    container.onclick = () => {
      saveCurrentSelections();
      window.location.href = '/standalone-step2.html';
    };
    
    document.body.appendChild(container);
    console.log('Added emergency navigation button');
  };
  
  // Add emergency button
  addEmergencyButton();
  
  console.log('🛠️ Custom navigation installed successfully!');
})();