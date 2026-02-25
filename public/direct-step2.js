// This is a minimal, super-simplified solution for direct navigation to Step 2
// It is designed to be as simple as possible with minimal points of failure

(function() {
  // 1. Try the most direct approach first - using the global store
  try {
    const store = window.useGameStore.getState();
    
    // If needed, ensure we have theme and gameId
    if (!store.config.gameId || !store.config.theme?.selectedThemeId) {
      store.updateConfig({
        gameId: 'step2fix_' + Date.now(),
        theme: {
          mainTheme: 'Fixed Theme',
          selectedThemeId: 'default-theme',
          colors: { primary: '#E60012' }
        }
      });
    }
    
    // Force step update
    store.setStep(1);
    console.log('✅ Step updated to 1 directly');
    return;
  } catch (e) {
    console.log('Direct state approach failed:', e);
  }
  
  // 2. Alternative: Try to click any Next buttons in the DOM
  try {
    let buttonClicked = false;
    document.querySelectorAll('button').forEach(button => {
      const text = button.textContent || '';
      if (text.includes('Next') || text.includes('Continue') || text.includes('Game Type')) {
        console.log('✅ Found button, clicking:', text);
        button.click();
        buttonClicked = true;
      }
    });
    
    if (buttonClicked) {
      console.log('✅ Button click attempted');
      return;
    }
  } catch (e) {
    console.log('Button approach failed:', e);
  }
  
  // 3. Final fallback: URL navigation
  console.log('⚠️ Using URL navigation fallback');
  window.location.href = `/?step=1&force=true&t=${Date.now()}`;
})();