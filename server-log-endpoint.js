/**
 * Server Log Endpoint
 * This adds an endpoint to the Express server to write logs to a file
 */

const fs = require('fs');
const path = require('path');

// Path to the log file
const LOG_FILE = path.join(__dirname, 'navigation-logs.txt');

// Initialize log file if it doesn't exist
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '--- Navigation Logs ---\n\n', 'utf8');
}

/**
 * Add the log endpoint to an Express server
 * @param {Express} app - The Express app
 */
function addLogEndpoint(app) {
  // Endpoint to write logs to file
  app.post('/log-to-file', (req, res) => {
    try {
      const logData = req.body;
      
      // Format the log entry
      const timestamp = new Date().toISOString();
      const formattedLog = `[${timestamp}] ${logData.message}\n` +
                          (logData.data ? `Data: ${JSON.stringify(logData.data)}\n` : '') +
                          `URL: ${logData.location}\n` +
                          '-'.repeat(50) + '\n';
      
      // Append to log file
      fs.appendFileSync(LOG_FILE, formattedLog, 'utf8');
      
      // Send success response
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error writing to log file:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  console.log('Log endpoint added at /log-to-file');
}

module.exports = addLogEndpoint;