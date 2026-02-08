import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../../store';
import { ensureGameId } from '../../../utils/stepStorage';

/**
 * A component to display and ensure a game ID is assigned
 */
const GameIdDisplay: React.FC = () => {
  const { config, updateConfig, saveProgress } = useGameStore();
  const [savedStatus, setSavedStatus] = useState<string>('');
  
  // Ensure we have a game ID when the component mounts or when theme changes
  useEffect(() => {
    if (!config.gameId || (config.theme?.mainTheme && !config.gameId.includes(config.theme.mainTheme.toLowerCase().replace(/\s+/g, '-')))) {
      // Create new game ID if we don't have one or if the theme has changed
      const newGameId = ensureGameId(config);
      updateConfig({ gameId: newGameId });
      console.log(`[DEBUG] Assigned new game ID: ${newGameId}`);
    }
  }, [config.theme?.mainTheme]);
  
  // Display saved status briefly when ID changes
  useEffect(() => {
    if (config.gameId) {
      setSavedStatus('Game ID assigned');
      
      const timer = setTimeout(() => {
        setSavedStatus('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [config.gameId]);
  
  // Handle manual save
  const handleManualSave = () => {
    setSavedStatus('Saving...');
    saveProgress();
    
    // Update status after a short delay
    setTimeout(() => {
      setSavedStatus('Saved!');
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setSavedStatus('');
      }, 3000);
    }, 500);
  };
  
  if (!config.gameId) {
    return null;
  }
  
  // Format the game ID for display
  const displayGameId = () => {
    if (!config.gameId) return '';

    // If it's a date-based format (YYYYMMDD), display it nicely
    if (config.gameId.includes('_') && config.gameId.split('_')[1]?.length === 8) {
      const [name, dateStr] = config.gameId.split('_');
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      return `${name} (${year}-${month}-${day})`;
    }

    return config.gameId;
  };

  // Function to open the game directory in file explorer
  const openGameFolder = async () => {
    if (!config.gameId) {
      console.error('No game ID available');
      setSavedStatus('No game ID found');
      setTimeout(() => setSavedStatus(''), 3000);
      return;
    }

    console.log(`[DEBUG] Attempting to open folder for gameId: ${config.gameId}`);
    setSavedStatus('Creating folder...');

    // First ensure the directory exists by creating it explicitly
    try {
      console.log('[DEBUG] Creating game directory first...');
      const createUrl = `/api/games/${config.gameId}/create-directory`;

      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ createSubdirectories: true })
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error(`[ERROR] Failed to create directory: ${errorText}`);
        setSavedStatus(`Error: ${createResponse.status}`);
        setTimeout(() => setSavedStatus(''), 3000);
        return;
      }

      const createData = await createResponse.json();
      console.log('[DEBUG] Directory creation response:', createData);

      // Now try to open the directory
      if (createData.success) {
        // Get path information
        console.log('[DEBUG] Directory successfully created/verified');
        const windowsPath = createData.windowsPath;
        const unixPath = createData.absolutePath;

        console.log(`[DEBUG] Windows path: ${windowsPath}`);
        console.log(`[DEBUG] Unix path: ${unixPath}`);

        // Try to use the test endpoint to verify paths are correct
        try {
          console.log('[DEBUG] Testing directory system...');
          const testResponse = await fetch('/api/test-directory');
          const testData = await testResponse.json();
          console.log('[DEBUG] Test endpoint response:', testData);
        } catch (testError) {
          console.error('[ERROR] Test endpoint failed:', testError);
        }

        // Show the path to the user
        setSavedStatus(`Path: ${windowsPath}`);

        // Try to use the server-side Explorer opening feature
        try {
          console.log('[DEBUG] Attempting to use server-side explorer opening');

          // Make a direct request to open the directory through the server
          const openUrl = `/api/games/${config.gameId}/open-directory`;
          const openResponse = await fetch(openUrl);
          const openData = await openResponse.json();

          console.log('[DEBUG] Server-side open response:', openData);

          // Also try the file:// approach as a backup
          console.log('[DEBUG] Also attempting to open folder with file:// protocol');

          // Create a clickable element as a reliable approach
          const link = document.createElement('a');
          link.style.display = 'none';

          if (windowsPath && windowsPath.includes(':')) {
            // Windows path with proper escaping of backslashes
            const escapedPath = windowsPath.replace(/\\/g, '/');
            const fileUrl = `file:///${escapedPath}`;
            console.log(`[DEBUG] Opening URL: ${fileUrl}`);
            link.href = fileUrl;
          } else {
            // Unix path
            const fileUrl = `file://${unixPath}`;
            console.log(`[DEBUG] Opening URL: ${fileUrl}`);
            link.href = fileUrl;
          }

          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          console.log('[DEBUG] Link clicked');
        } catch (linkError) {
          console.error('[ERROR] Failed to open with link:', linkError);
        }

        // Copy path to clipboard as a fallback
        navigator.clipboard.writeText(windowsPath || unixPath)
          .then(() => console.log('[DEBUG] Path copied to clipboard'))
          .catch(err => console.error('[ERROR] Failed to copy path:', err));

        setTimeout(() => setSavedStatus(''), 5000);
      } else {
        console.error('[ERROR] Directory creation failed:', createData.error);
        setSavedStatus('Failed to create folder');
        setTimeout(() => setSavedStatus(''), 3000);
      }
    } catch (error) {
      console.error('[ERROR] Error in folder opening process:', error);
      setSavedStatus('Error opening folder');
      setTimeout(() => setSavedStatus(''), 3000);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-lg shadow-lg z-50 opacity-90 hover:opacity-100 transition-opacity">
      <div className="flex flex-col items-end text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-gray-300">Game ID:</span>
          <span className="font-mono">{displayGameId()}</span>
        </div>

        {savedStatus && (
          <div className="mt-1 text-green-400 font-medium">
            {savedStatus}
          </div>
        )}

        <div className="mt-2 flex gap-2">
          <button
            onClick={handleManualSave}
            id="save-progress-btn"
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
          >
            Save Progress
          </button>

          <button
            onClick={openGameFolder}
            title="Open game folder in file explorer"
            className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs"
          >
            Open Folder
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameIdDisplay;