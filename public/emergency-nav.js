/**
 * Emergency navigation script that bypasses React entirely
 * This is loaded as a standalone script to help fix navigation issues
 */
(function() {
  // Create UI only if it doesn't exist yet
  if (!document.getElementById('emergency-nav-container')) {
    console.log('🔴 Emergency Navigator: Initializing...');
    
    // Create navigation UI
    const createEmergencyUI = () => {
      const container = document.createElement('div');
      container.id = 'emergency-nav-container';
      container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        background: #fff;
        border: 2px solid #E60012;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 10px;
        display: flex;
        flex-direction: column;
        width: 180px;
      `;
      
      // Create title
      const title = document.createElement('div');
      title.textContent = '🔧 Emergency Navigation';
      title.style.cssText = `
        font-weight: bold;
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 1px solid #eee;
        text-align: center;
      `;
      container.appendChild(title);
      
      // Create buttons
      const steps = [
        { name: 'Theme Selection', index: 0 },
        { name: 'Game Type', index: 1 },
        { name: 'Grid Layout', index: 2 },
        { name: 'Symbol Generator', index: 3 }
      ];
      
      steps.forEach(step => {
        const button = document.createElement('button');
        button.textContent = `Step ${step.index + 1}: ${step.name}`;
        button.style.cssText = `
          margin: 4px 0;
          padding: 6px 12px;
          background: ${step.index === 1 ? '#E60012' : '#f5f5f5'};
          color: ${step.index === 1 ? 'white' : '#333'};
          border: 1px solid ${step.index === 1 ? '#C5000F' : '#ddd'};
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        `;
        
        button.addEventListener('click', () => {
          navigateToStep(step.index);
        });
        
        container.appendChild(button);
      });
      
      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.style.cssText = `
        margin-top: 8px;
        padding: 4px;
        background: #eee;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 12px;
      `;
      closeBtn.addEventListener('click', () => {
        container.remove();
      });
      container.appendChild(closeBtn);
      
      return container;
    };
    
    // Navigation function
    const navigateToStep = (stepIndex) => {
      console.log(`🔴 Emergency Navigator: Navigating to step ${stepIndex}`);
      
      try {
        // 1. Try to find and use the Zustand store directly
        const allStores = [];
        for (const key in window) {
          if (key.startsWith('__ZUSTAND') || key.includes('store') || key.includes('Store')) {
            allStores.push(key);
            console.log(`🔴 Found potential store: ${key}`);
          }
        }
        
        if (typeof window.useGameStore !== 'undefined' && 
            typeof window.useGameStore.getState === 'function') {
          console.log('🔴 Found global useGameStore, attempting direct state manipulation');
          const store = window.useGameStore.getState();
          store.setStep(stepIndex);
          console.log('🔴 Direct store manipulation completed');
          return;
        }
        
        // 2. Try using localStorage and URL navigation
        console.log('🔴 Using localStorage + URL navigation fallback');
        localStorage.setItem('slotai_emergency_nav', 'true');
        localStorage.setItem('slotai_target_step', stepIndex.toString());
        localStorage.setItem('slotai_timestamp', Date.now().toString());
        
        window.location.href = `/?step=${stepIndex}&force=true&t=${Date.now()}`;
      } catch (err) {
        console.error('🔴 Navigation error:', err);
        alert(`Navigation failed. Please try reloading the page.`);
      }
    };
    
    // Add UI to document
    const ui = createEmergencyUI();
    document.body.appendChild(ui);
    
    console.log('🔴 Emergency Navigator: Initialized and ready');
  } else {
    console.log('🔴 Emergency Navigator: Already initialized');
  }
})();