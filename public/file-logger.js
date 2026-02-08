/**
 * File Logger Script
 * This script creates a log file in the root folder of the project
 * It uses fetch to send log data to a simple endpoint that writes to a file
 */

(function() {
  console.log("📝 FILE LOGGER INITIALIZED");
  
  // Function to send log to server for file writing
  function writeLogToFile(message, data) {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        message: message,
        data: data || null,
        location: window.location.href,
        userAgent: navigator.userAgent
      };
      
      // Use fetch to send log to server
      fetch('/log-to-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      })
      .then(response => {
        if (!response.ok) {
          console.error("Failed to write log to file:", response.statusText);
        }
      })
      .catch(error => {
        console.error("Error sending log to server:", error);
      });
      
      // Also log to console
      console.log(`📝 FILE LOG: ${message}`, data || '');
    } catch (e) {
      console.error("Failed to send log to server:", e);
    }
  }
  
  // Override the console.log function to also write to file
  const originalConsoleLog = console.log;
  console.log = function() {
    // Call the original console.log
    originalConsoleLog.apply(console, arguments);
    
    // Convert arguments to an array
    const args = Array.from(arguments);
    
    // Get the first argument as message
    const message = args[0];
    
    // Get the rest as data
    const data = args.length > 1 ? args.slice(1) : null;
    
    // Write to file if message is a string and contains certain keywords
    if (typeof message === 'string' && 
        (message.includes('Navigation') || 
         message.includes('Step') || 
         message.includes('Next') || 
         message.includes('store') ||
         message.includes('Button'))) {
      writeLogToFile(message, data);
    }
  };
  
  // Also override console.error
  const originalConsoleError = console.error;
  console.error = function() {
    // Call the original console.error
    originalConsoleError.apply(console, arguments);
    
    // Convert arguments to an array
    const args = Array.from(arguments);
    
    // Get the first argument as message
    const message = args[0];
    
    // Get the rest as data
    const data = args.length > 1 ? args.slice(1) : null;
    
    // Write to file
    writeLogToFile(`ERROR: ${message}`, data);
  };
  
  // Add a global function to manually write to log file
  window.logToFile = writeLogToFile;
  
  // Log initialization
  writeLogToFile("File logger initialized");
})();