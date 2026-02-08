/**
 * Safe Mode Loader
 * 
 * This script handles loading all emergency scripts when safe mode is explicitly requested.
 * It is designed to be loaded conditionally based on URL parameters.
 */

// Ensure timestamp for cache busting
const timestamp = window.timestamp || Date.now();

// Check if we're on the login page - CRITICAL: Don't run emergency scripts on login page
const isLoginPage = window.location.pathname === '/login';

// Recovery status check function
function isRecoveryComplete() {
  const directRecoveryComplete = localStorage.getItem('slotai_recovery_complete') === 'true';
  const urlParams = new URLSearchParams(window.location.search);
  const urlRecovered = urlParams.has('recovered');
  const globalDisabled = window.__EMERGENCY_SCRIPTS_DISABLED === true;
  const globalRecoveryComplete = window.__RECOVERY_COMPLETE === true;
  const hasNavigationState = window.__NAVIGATION_STATE && 
                           window.__NAVIGATION_STATE.recoveryComplete === true;
  
  // Use window.shouldEmergencyScriptsRun if available as the most comprehensive check
  if (typeof window.shouldEmergencyScriptsRun === 'function') {
    return !window.shouldEmergencyScriptsRun();
  }
  
  return directRecoveryComplete || urlRecovered || globalDisabled || 
        globalRecoveryComplete || hasNavigationState;
}

// Function to load a script safely
function loadScript(src, isModule = true) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    
    if (isModule) {
      script.type = 'module';
    }
    
    script.src = `${src}?t=${timestamp}`;
    script.onload = resolve;
    script.onerror = reject;
    
    document.head.appendChild(script);
    console.log(`📢 Loaded emergency script: ${src}`);
  });
}

// If we're not on the login page, load emergency scripts
if (!isLoginPage) {
  console.log('🛡️ Safe Mode Loader: Loading emergency scripts...');
  
  // Primary emergency scripts
  Promise.all([
    loadScript('/EMERGENCY-CLEANUP.js'),
    loadScript('/SAFE-MEGA-LOGGER.js'),
    loadScript('/BLANK-SCREEN-FIX.js'),
    loadScript('/EARLY-EMERGENCY-NAV.js')
  ]).then(() => {
    console.log('✅ Loaded primary emergency scripts');
    
    // Secondary emergency scripts
    return Promise.all([
      loadScript('/EMERGENCY-FORCE-NAVFIX.js'),
      loadScript('/navigation-fix.js'),
      loadScript('/step1to2-fix.js')
    ]);
  }).then(() => {
    console.log('✅ Loaded secondary emergency scripts');
    
    // Only load emergency button if recovery is not complete
    if (!isRecoveryComplete()) {
      return loadScript('/emergency-big-button.js');
    }
  }).then(() => {
    console.log('✅ Completed loading all emergency scripts');
    
    // Add final navigation helpers after a delay
    setTimeout(() => {
      if (!isRecoveryComplete()) {
        loadScript('/emergency-nav.js');
      }
    }, 2000);
  }).catch(error => {
    console.error('❌ Error loading emergency scripts:', error);
  });
} else {
  console.log('🛡️ Safe Mode Loader: On login page, skipping emergency scripts');
}