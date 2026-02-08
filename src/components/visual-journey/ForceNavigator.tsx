import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store';

/**
 * Emergency component that forces navigation to step 2
 * This is a last resort to fix the "Next" button issue
 */
const ForceNavigator: React.FC = () => {
  const [attempts, setAttempts] = useState(0);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('Initializing emergency navigation...');
  
  useEffect(() => {
    // Wait for initial render
    const firstAttempt = setTimeout(() => {
      try {
        console.log('ForceNavigator: First attempt to navigate to step 1');
        // Create a single reference to the store
        const store = useGameStore.getState();
        
        // Ensure we have a game ID and theme
        if (!store.config.gameId) {
          store.updateConfig({
            gameId: 'emergency-game_' + new Date().toISOString().slice(0, 10).replace(/-/g, ''),
            displayName: 'Emergency Game',
          });
        }
        
        if (!store.config.theme?.selectedThemeId) {
          store.updateConfig({
            theme: {
              ...store.config.theme || {},
              mainTheme: 'Default Theme',
              description: 'A default theme',
              selectedThemeId: 'default-theme',
              colors: {
                primary: '#E60012',
                secondary: '#0052cc',
                accent: '#ff6600',
                background: '#ffffff'
              }
            }
          });
        }
        
        // Force direct navigation to step 1 (second step)
        store.setStep(1);
        
        // Check if navigation was successful
        setTimeout(() => {
          // Get a fresh reference to the store state to avoid stale closures
          const currentStore = useGameStore.getState();
          const currentStep = currentStore.currentStep;
          if (currentStep === 1) {
            setSuccess(true);
            setMessage('Success! Redirecting to step 2...');
          } else {
            setMessage('First attempt failed. Trying alternative method...');
            setAttempts(prev => prev + 1);
          }
        }, 100);
      } catch (err) {
        console.error('ForceNavigator: First attempt failed', err);
        setMessage('Error in first attempt. Trying alternative method...');
        setAttempts(prev => prev + 1);
      }
    }, 300);
    
    return () => clearTimeout(firstAttempt);
  }, []);
  
  // Second attempt using different method
  useEffect(() => {
    if (attempts === 1) {
      const secondAttempt = setTimeout(() => {
        try {
          console.log('ForceNavigator: Second attempt with direct DOM navigation');
          
          // Set local storage as a backup in case of reload
          localStorage.setItem('slotai_target_step', '1');
          localStorage.setItem('slotai_emergency', 'true');
          
          // Try to find and click the Next button in the DOM
          const nextButtons = document.querySelectorAll('button');
          let found = false;
          
          nextButtons.forEach(button => {
            if (button.textContent?.includes('Next') && 
                button.textContent?.includes('Game Type') &&
                !found) {
              console.log('Found Next button, clicking programmatically');
              button.click();
              found = true;
              
              // Check if navigation was successful
              setTimeout(() => {
                // Get a fresh reference to the store state
                const currentStore = useGameStore.getState();
                const currentStep = currentStore.currentStep;
                if (currentStep === 1) {
                  setSuccess(true);
                  setMessage('Success! Next button clicked and navigation worked.');
                } else {
                  setMessage('Button click failed. Using URL navigation...');
                  setAttempts(prev => prev + 1);
                }
              }, 100);
            }
          });
          
          if (!found) {
            setMessage('Next button not found. Using URL navigation...');
            setAttempts(prev => prev + 1);
          }
        } catch (err) {
          console.error('ForceNavigator: Second attempt failed', err);
          setMessage('Error in second attempt. Using URL navigation...');
          setAttempts(prev => prev + 1);
        }
      }, 500);
      
      return () => clearTimeout(secondAttempt);
    }
  }, [attempts]);
  
  // Third attempt using URL navigation
  useEffect(() => {
    if (attempts === 2) {
      const thirdAttempt = setTimeout(() => {
        try {
          console.log('ForceNavigator: Final attempt with URL navigation');
          
          // Set URL parameters and reload the page
          window.location.href = '/?step=1&force=true&t=' + Date.now();
        } catch (err) {
          console.error('ForceNavigator: Third attempt failed', err);
          setMessage('All navigation attempts failed. Please reload the page manually.');
        }
      }, 1000);
      
      return () => clearTimeout(thirdAttempt);
    }
  }, [attempts]);
  
  if (success) {
    return null; // Hide the component if navigation was successful
  }
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md text-center">
        <div className="animate-spin w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-bold mb-2">Emergency Navigation</h2>
        <p className="text-gray-700 mb-4">{message}</p>
        <div className="text-xs text-gray-500">
          Attempt {attempts + 1} of 3
        </div>
      </div>
    </div>
  );
};

export default ForceNavigator;