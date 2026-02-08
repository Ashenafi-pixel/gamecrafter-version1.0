/**
 * Enhanced Emergency Sidebar Toggle System
 * 
 * This script provides direct DOM manipulation to toggle the sidebar
 * when React state management isn't working properly.
 */

(function() {
  console.log("🚨 Emergency sidebar toggle script loaded");
  
  // Create a function to manually toggle the sidebar
  window.toggleSidebar = function() {
    console.log("🚨 Manual sidebar toggle activated");
    
    try {
      // Find elements using more reliable selectors with fallbacks
      const mainSidebar = document.querySelector('[data-sidebar-type="main"]') || 
                         document.querySelector('.sidebar-main') || 
                         document.querySelector('.w-64.bg-white.border-r');
                         
      const mainContent = document.querySelector('[data-content-shifted]') || 
                         document.querySelector('.flex-1.flex.flex-col.overflow-hidden');
      
      // Find vertical sidebar with fallbacks
      let verticalSidebar = document.querySelector('[data-sidebar-type="vertical"]') || 
                           document.querySelector('.vertical-step-sidebar') ||
                           document.querySelector('.fixed.left-0.top-0.h-full.w-20');
      
      // Determine current state based on the main sidebar's visibility
      const isOpen = Boolean(
        mainSidebar && 
        getComputedStyle(mainSidebar).display !== 'none' && 
        mainSidebar.getBoundingClientRect().width > 20
      );
      
      console.log(`Current sidebar state detected as: ${isOpen ? 'OPEN' : 'CLOSED'}`);
      
      // Toggle state
      if (isOpen) {
        // Close sidebar
        console.log("Closing sidebar...");
        
        // Hide main sidebar
        if (mainSidebar) {
          mainSidebar.style.display = 'none';
          mainSidebar.style.width = '0px';
          mainSidebar.style.opacity = '0';
          // Add additional transform for smoother animation
          mainSidebar.style.transform = 'translateX(-100%)';
          mainSidebar.style.transition = 'opacity 0.3s, transform 0.3s';
        }
        
        // Show vertical sidebar
        if (verticalSidebar) {
          verticalSidebar.style.display = 'flex';
          verticalSidebar.style.opacity = '1';
          verticalSidebar.style.transform = 'translateX(0)';
        } else {
          // Create vertical sidebar if it doesn't exist
          verticalSidebar = createVerticalSidebar();
        }
        
        // Add margin to main content
        if (mainContent) {
          if (!mainContent.classList.contains('ml-20')) {
            mainContent.classList.add('ml-20');
          }
          mainContent.setAttribute('data-content-shifted', 'true');
          
          // Add transition for smoother margin shift
          mainContent.style.transition = 'margin-left 0.3s ease-in-out';
        }
        
        // Update localStorage
        try {
          localStorage.setItem('gameCrafter_sidebarState', 'closed');
          // Also set the universal sidebarState for components using that key
          localStorage.setItem('sidebarState', 'closed');
        } catch (e) {
          console.warn("localStorage access error:", e);
        }
      } else {
        // Open sidebar
        console.log("Opening sidebar...");
        
        // Show main sidebar
        if (mainSidebar) {
          mainSidebar.style.display = 'block';
          mainSidebar.style.width = '256px';
          mainSidebar.style.opacity = '1';
          mainSidebar.style.transform = 'translateX(0)';
          mainSidebar.style.transition = 'opacity 0.3s, transform 0.3s';
        } else {
          // Create main sidebar if it doesn't exist
          mainSidebar = createMainSidebar();
        }
        
        // Hide vertical sidebar
        if (verticalSidebar) {
          verticalSidebar.style.display = 'none';
          verticalSidebar.style.opacity = '0';
          verticalSidebar.style.transform = 'translateX(-100%)';
        }
        
        // Remove margin from main content
        if (mainContent) {
          mainContent.classList.remove('ml-20');
          mainContent.setAttribute('data-content-shifted', 'false');
        }
        
        // Update localStorage
        try {
          localStorage.setItem('gameCrafter_sidebarState', 'open');
          // Also set the universal sidebarState for components using that key
          localStorage.setItem('sidebarState', 'open');
        } catch (e) {
          console.warn("localStorage access error:", e);
        }
      }
      
      // Force React to update if possible
      triggerReactUpdate(isOpen);
      
      // Show success message
      showNotification(isOpen ? "Sidebar collapsed successfully" : "Sidebar expanded successfully");
      
    } catch (error) {
      console.error("Error in sidebar toggle:", error);
      showNotification("Error toggling sidebar: " + error.message, true);
    }
  };
  
  // Force sidebar into a specific state
  window.forceSidebarState = function(shouldBeOpen) {
    console.log(`🔧 Forcing sidebar to be ${shouldBeOpen ? "OPEN" : "CLOSED"}`);
    
    try {
      // Find elements using multiple selector approaches
      const mainSidebar = document.querySelector('[data-sidebar-type="main"]') || 
                         document.querySelector('.sidebar-main') || 
                         document.querySelector('.w-64.bg-white.border-r');
                         
      const mainContent = document.querySelector('[data-content-shifted]') || 
                         document.querySelector('.flex-1.flex.flex-col.overflow-hidden');
      
      // Find vertical sidebar
      let verticalSidebar = document.querySelector('[data-sidebar-type="vertical"]') || 
                           document.querySelector('.vertical-step-sidebar') ||
                           document.querySelector('.fixed.left-0.top-0.h-full.w-20');
      
      // Check if elements exist
      if (!mainSidebar && !mainContent) {
        console.error("Critical elements not found");
        showNotification("Could not find sidebar or content elements", true);
        return;
      }
      
      if (shouldBeOpen) {
        // OPEN the sidebar
        console.log("Forcing sidebar to open state");
        
        // Show main sidebar
        if (mainSidebar) {
          mainSidebar.style.display = 'block';
          mainSidebar.style.width = '256px';
          mainSidebar.style.opacity = '1';
          mainSidebar.style.transform = 'translateX(0)';
        } else {
          // Create main sidebar if it doesn't exist
          mainSidebar = createMainSidebar();
        }
        
        // Hide vertical sidebar
        if (verticalSidebar) {
          verticalSidebar.style.display = 'none';
        }
        
        // Remove margin from main content
        if (mainContent) {
          mainContent.classList.remove('ml-20');
          mainContent.setAttribute('data-content-shifted', 'false');
        }
      } else {
        // CLOSE the sidebar
        console.log("Forcing sidebar to closed state");
        
        // Hide main sidebar
        if (mainSidebar) {
          mainSidebar.style.display = 'none';
          mainSidebar.style.width = '0px';
          mainSidebar.style.opacity = '0';
        }
        
        // Show vertical sidebar
        if (!verticalSidebar) {
          verticalSidebar = createVerticalSidebar();
        } else {
          verticalSidebar.style.display = 'flex';
        }
        
        // Add margin to main content
        if (mainContent && !mainContent.classList.contains('ml-20')) {
          mainContent.classList.add('ml-20');
          mainContent.setAttribute('data-content-shifted', 'true');
        }
      }
      
      // Update localStorage to maintain state
      try {
        localStorage.setItem('gameCrafter_sidebarState', shouldBeOpen ? 'open' : 'closed');
        localStorage.setItem('sidebarState', shouldBeOpen ? 'open' : 'closed');
      } catch (e) {
        console.warn("localStorage access error:", e);
      }
      
      // Force React to update if possible
      triggerReactUpdate(!shouldBeOpen);
      
      // Show success message
      showNotification(shouldBeOpen ? "Sidebar forcibly expanded" : "Sidebar forcibly collapsed");
      
    } catch (error) {
      console.error("Error forcing sidebar state:", error);
      showNotification("Error changing sidebar: " + error.message, true);
    }
  };
  
  // Try to trigger a React re-render
  function triggerReactUpdate(wasPreviouslyOpen) {
    try {
      // Dispatch custom event so any React components listening can update
      window.dispatchEvent(new CustomEvent('sidebarStateChanged', { 
        detail: { 
          isOpen: !wasPreviouslyOpen,
          timestamp: Date.now()
        } 
      }));
      
      // Try to directly access React's internals if available
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log("Attempting to trigger React state update...");
      }
      
      // Force UI refresh with minimal DOM reflow
      if (typeof document !== 'undefined') {
        const html = document.documentElement;
        html.style.display = 'none';
        // Force reflow
        void html.offsetHeight;
        html.style.display = '';
      }
    } catch (e) {
      console.warn("React update error:", e);
    }
  }
  
  function createVerticalSidebar() {
    console.log("Creating emergency vertical sidebar");
    
    // Check if it already exists
    if (document.querySelector('.vertical-step-sidebar')) {
      return document.querySelector('.vertical-step-sidebar');
    }
    
    const sidebar = document.createElement('div');
    sidebar.className = 'vertical-step-sidebar fixed left-0 top-0 h-full w-20 bg-white border-r border-gray-200 shadow-md flex flex-col items-center pt-16 z-30';
    sidebar.setAttribute('data-sidebar-type', 'vertical');
    sidebar.style.display = 'flex';
    
    // Add visual indication this is the emergency sidebar
    const badge = document.createElement('div');
    badge.className = 'absolute top-2 left-0 right-0 text-center text-xs font-bold';
    badge.style.color = '#E60012';
    badge.style.padding = '4px';
    badge.textContent = 'EMERGENCY';
    sidebar.appendChild(badge);
    
    // Create step indicators
    for (let i = 1; i <= 7; i++) {
      const step = document.createElement('div');
      step.className = `step-indicator w-12 h-12 rounded-full flex items-center justify-center my-2 ${i === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`;
      step.style.cursor = 'pointer';
      step.textContent = i;
      step.onclick = function() {
        showNotification(`Emergency navigation: attempted to navigate to step ${i}`);
      };
      sidebar.appendChild(step);
    }
    
    // Add a button to expand
    const toggleButton = document.createElement('button');
    toggleButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
    toggleButton.className = 'absolute bottom-8 left-1/2 transform -translate-x-1/2 p-3 rounded-full bg-white shadow-lg';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.border = '1px solid #e2e8f0';
    toggleButton.onclick = window.toggleSidebar;
    
    sidebar.appendChild(toggleButton);
    document.body.appendChild(sidebar);
    return sidebar;
  }
  
  function createMainSidebar() {
    console.log("Creating emergency main sidebar");
    
    // Find container for the sidebar
    const container = document.querySelector('.flex-1.flex.overflow-hidden') || document.body;
    
    const sidebar = document.createElement('div');
    sidebar.className = 'w-64 bg-white border-r border-gray-200 overflow-y-auto z-40';
    sidebar.setAttribute('data-sidebar-type', 'main');
    sidebar.style.width = '256px';
    sidebar.style.height = '100%';
    sidebar.style.position = container === document.body ? 'fixed' : 'relative';
    sidebar.style.left = '0';
    sidebar.style.top = '0';
    
    // Add basic content
    sidebar.innerHTML = `
      <div class="p-5">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold" style="color: #E60012">Game Creation</h2>
          <button id="collapse-sidebar-btn" style="cursor: pointer; padding: 4px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
        
        <div style="color: white; background-color: #E60012; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
          <p class="font-bold">Emergency Sidebar Recovery</p>
          <p class="text-sm mt-1">This is an emergency recovery sidebar created by direct DOM manipulation</p>
          <button id="emergency-toggle-btn" style="background: white; color: #E60012; padding: 6px 12px; margin-top: 10px; border-radius: 4px; cursor: pointer; font-weight: bold;">
            Toggle Sidebar
          </button>
        </div>
        
        <div class="space-y-4 mt-6">
          <div class="p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200">Theme Selection</div>
          <div class="p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200">Game Type</div>
          <div class="p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200">Symbols</div>
          <div class="p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200">Frame Design</div>
          <div class="p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200">Background</div>
          <div class="p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200">Win Animation</div>
          <div class="p-3 bg-gray-100 rounded cursor-pointer hover:bg-gray-200">Math Model</div>
        </div>
      </div>
    `;
    
    // Append to container
    container.prepend(sidebar);
    
    // Add click handlers
    setTimeout(() => {
      document.getElementById('emergency-toggle-btn')?.addEventListener('click', window.toggleSidebar);
      document.getElementById('collapse-sidebar-btn')?.addEventListener('click', window.toggleSidebar);
      
      // Add click handlers to menu items
      sidebar.querySelectorAll('.p-3.bg-gray-100').forEach((item, index) => {
        item.addEventListener('click', () => {
          showNotification(`Emergency navigation: attempted to navigate to ${item.textContent}`);
        });
      });
    }, 100);
    
    return sidebar;
  }
  
  function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = isError ? '#E53E3E' : '#38A169';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '6px';
    notification.style.zIndex = '9999';
    notification.style.fontWeight = 'bold';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    notification.style.maxWidth = '300px';
    
    // Add animation
    notification.style.animation = 'slideInRight 0.3s, fadeOut 3s 0.5s forwards';
    
    // Add animation styles if not already present
    if (!document.getElementById('notification-animations')) {
      const style = document.createElement('style');
      style.id = 'notification-animations';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; visibility: hidden; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after animation completes
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 3500);
  }
  
  // Add emergency controls panel
  function createEmergencyControls() {
    const existingControls = document.getElementById('sidebar-emergency-controls');
    if (existingControls) return;
    
    const controlPanel = document.createElement('div');
    controlPanel.id = 'sidebar-emergency-controls';
    controlPanel.style.position = 'fixed';
    controlPanel.style.bottom = '20px';
    controlPanel.style.right = '20px';
    controlPanel.style.zIndex = '9999';
    controlPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    controlPanel.style.color = 'white';
    controlPanel.style.padding = '15px';
    controlPanel.style.borderRadius = '8px';
    controlPanel.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
    controlPanel.style.backdropFilter = 'blur(4px)';
    controlPanel.style.maxWidth = '260px';
    
    controlPanel.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span>Sidebar Emergency Controls</span>
        <button id="minimize-controls" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; padding: 0 4px;">−</button>
      </div>
      <div id="controls-content" style="display: flex; flex-direction: column; gap: 10px;">
        <button id="emergency-toggle" style="background-color: #E60012; color: white; border: none; padding: 10px 14px; border-radius: 4px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 6px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3H3C1.9 3 1 3.9 1 5V19C1 20.1 1.9 21 3 21H21C22.1 21 23 20.1 23 19V5C23 3.9 22.1 3 21 3Z"></path><path d="M9 3V21"></path></svg>
          Toggle Sidebar
        </button>
        <div style="display: flex; gap: 8px;">
          <button id="emergency-collapse" style="flex: 1; background-color: #3F3F46; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
            Force Collapse
          </button>
          <button id="emergency-expand" style="flex: 1; background-color: #3F3F46; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
            Force Expand
          </button>
        </div>
        <button id="emergency-reset" style="background-color: #2563EB; color: white; border: none; padding: 10px 14px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path></svg>
          Reset & Reload
        </button>
        <button id="emergency-inspect" style="background-color: #4B5563; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;">
          Inspect DOM State
        </button>
      </div>
      <div style="font-size: 10px; text-align: center; margin-top: 12px; opacity: 0.7; line-height: 1.4;">
        These controls manipulate the DOM directly<br>
        <span style="color: #FCD34D;">Press Ctrl+Alt+S to toggle sidebar</span>
      </div>
    `;
    
    document.body.appendChild(controlPanel);
    
    // Add event listeners
    setTimeout(() => {
      // Toggle sidebar
      document.getElementById('emergency-toggle')?.addEventListener('click', window.toggleSidebar);
      
      // Force collapse
      document.getElementById('emergency-collapse')?.addEventListener('click', function() {
        window.forceSidebarState(false);
      });
      
      // Force expand
      document.getElementById('emergency-expand')?.addEventListener('click', function() {
        window.forceSidebarState(true);
      });
      
      // Reset state
      document.getElementById('emergency-reset')?.addEventListener('click', function() {
        // Clear storage
        try {
          localStorage.removeItem('gameCrafter_sidebarState');
          localStorage.removeItem('sidebarState');
          localStorage.setItem('sidebarState', 'open'); // Default to open
        } catch (e) {
          console.warn("localStorage access error:", e);
        }
        
        // Force refresh
        showNotification("Resetting sidebar state and reloading page...");
        setTimeout(() => {
          location.reload();
        }, 800);
      });
      
      // Inspect DOM state
      document.getElementById('emergency-inspect')?.addEventListener('click', function() {
        // Find sidebars
        const mainSidebar = document.querySelector('[data-sidebar-type="main"]');
        const verticalSidebar = document.querySelector('[data-sidebar-type="vertical"]') ||
                                document.querySelector('.fixed.left-0.top-0.h-full.w-20');
        const mainContent = document.querySelector('[data-content-shifted]');
        
        // Get computed widths
        const mainSidebarWidth = mainSidebar ? mainSidebar.getBoundingClientRect().width : 0;
        const verticalSidebarWidth = verticalSidebar ? verticalSidebar.getBoundingClientRect().width : 0;
        
        // Generate report
        const report = `
          DOM State:
          - Main Sidebar: ${mainSidebar ? 'Found' : 'Not found'}
            Width: ${mainSidebarWidth}px
            Display: ${mainSidebar ? getComputedStyle(mainSidebar).display : 'N/A'}
          - Vertical Sidebar: ${verticalSidebar ? 'Found' : 'Not found'}
            Width: ${verticalSidebarWidth}px
            Display: ${verticalSidebar ? getComputedStyle(verticalSidebar).display : 'N/A'}
          - Content margin: ${mainContent?.classList.contains('ml-20') ? 'ml-20 applied' : 'no margin'}
          - LocalStorage:
            sidebarState: ${localStorage.getItem('sidebarState') || 'not set'}
            gameCrafter_sidebarState: ${localStorage.getItem('gameCrafter_sidebarState') || 'not set'}
        `;
        
        console.log("DOM State Report:", report);
        alert(report);
      });
      
      // Minimize controls
      let isMinimized = false;
      document.getElementById('minimize-controls')?.addEventListener('click', function() {
        const content = document.getElementById('controls-content');
        const button = document.getElementById('minimize-controls');
        
        if (isMinimized) {
          content.style.display = 'flex';
          button.textContent = '−';
          controlPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        } else {
          content.style.display = 'none';
          button.textContent = '+';
          controlPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        }
        
        isMinimized = !isMinimized;
      });
    }, 100);
  }
  
  // Keyboard shortcut (Ctrl+Alt+S) to toggle sidebar
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.altKey && e.key === 's') {
      e.preventDefault();
      window.toggleSidebar();
    }
  });
  
  // Initialize emergency controls
  createEmergencyControls();
  
  // Give user feedback
  console.log("🚀 Sidebar emergency controls added - click the panel in the bottom right corner to toggle");
  showNotification("Sidebar emergency controls ready ↘️", false);
})();