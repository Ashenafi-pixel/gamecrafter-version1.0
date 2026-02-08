/**
 * STANDALONE LOG SERVER
 * 
 * This is a simple Express server that accepts log messages and writes them to a file.
 * It runs completely independently of the main application.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

// Create Express app
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Path to log file (one level up)
const LOG_FILE = path.join(__dirname, '..', 'STEPFUCK.log');

// Create log file if it doesn't exist
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '--- NEW STEP NAVIGATION LOGS ---\n\n', 'utf8');
  console.log(`Created log file at ${LOG_FILE}`);
} else {
  // Append a new session marker
  fs.appendFileSync(LOG_FILE, '\n\n=== NEW LOGGING SESSION STARTED ===\n\n', 'utf8');
  console.log(`Appending to existing log file at ${LOG_FILE}`);
}

// Endpoint to write logs
app.post('/write-log', (req, res) => {
  try {
    const { category, message, data } = req.body;
    
    if (!category || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${category}] ${message}\n` +
      `Data: ${JSON.stringify(data || {}, null, 2)}\n` +
      '------------------------------------------------\n';
    
    // Append to log file
    fs.appendFileSync(LOG_FILE, logEntry, 'utf8');
    
    // Send success response
    return res.status(200).json({ success: true, timestamp });
  } catch (error) {
    console.error('Error writing to log file:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint to get all logs
app.get('/get-logs', (req, res) => {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return res.status(404).json({ error: 'Log file not found' });
    }
    
    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    
    // Format for HTML viewing
    const htmlLogs = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SlotAI Navigation Logs</title>
      <style>
        body { font-family: monospace; background: #1e1e1e; color: #e0e0e0; padding: 20px; }
        h1 { color: #61dafb; }
        .logs { background: #262626; padding: 15px; border-radius: 5px; white-space: pre-wrap; }
        .toolbar { margin-bottom: 15px; }
        button { padding: 8px 16px; margin-right: 10px; background: #0078d4; color: white; 
                border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #106ebe; }
        .navigation { color: #2196f3; }
        .click { color: #e91e63; }
        .store { color: #4caf50; }
        .error { color: #f44336; }
        .system { color: #ff9800; }
      </style>
    </head>
    <body>
      <h1>SlotAI Navigation Logs</h1>
      <div class="toolbar">
        <button onclick="location.reload()">Refresh Logs</button>
        <button onclick="clearLogs()">Clear Logs</button>
        <button onclick="downloadLogs()">Download Logs</button>
      </div>
      <div class="logs">${escapeHtml(logs)
        .replace(/\[NAVIGATION\]/g, '<span class="navigation">[NAVIGATION]</span>')
        .replace(/\[CLICK\]/g, '<span class="click">[CLICK]</span>')
        .replace(/\[STORE\]/g, '<span class="store">[STORE]</span>')
        .replace(/\[ERROR\]/g, '<span class="error">[ERROR]</span>')
        .replace(/\[SYSTEM\]/g, '<span class="system">[SYSTEM]</span>')
      }</div>
      <script>
        function clearLogs() {
          if (confirm('Are you sure you want to clear all logs?')) {
            fetch('/clear-logs', { method: 'POST' })
              .then(() => location.reload())
              .catch(err => alert('Error clearing logs: ' + err));
          }
        }
        function downloadLogs() {
          const blob = new Blob([document.querySelector('.logs').textContent], {type: 'text/plain'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'STEPFUCK.log';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      </script>
    </body>
    </html>
    `;
    
    // Send as HTML
    res.header('Content-Type', 'text/html');
    return res.send(htmlLogs);
  } catch (error) {
    console.error('Error reading log file:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Helper function to escape HTML
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Endpoint to clear logs
app.post('/clear-logs', (req, res) => {
  try {
    fs.writeFileSync(LOG_FILE, '--- STEP NAVIGATION LOGS CLEARED ---\n\n', 'utf8');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error clearing log file:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Simple test endpoint
app.get('/test', (req, res) => {
  return res.send(`
    <h1>Log Server Test Page</h1>
    <p>The log server is running correctly!</p>
    <p><a href="/get-logs">View Logs</a></p>
  `);
});

// Root endpoint for health check
app.get('/', (req, res) => {
  return res.send(`
    <h1>SlotAI Log Server</h1>
    <p>The log server is running at port ${PORT}</p>
    <p><a href="/get-logs">View Logs</a></p>
    <p><a href="/test">Test Server</a></p>
  `);
});

// Start server on a different port than the main app
const PORT = 3501;
app.listen(PORT, () => {
  console.log(`\n✨ STANDALONE Log server running at http://localhost:${PORT}`);
  console.log(`✨ View logs at http://localhost:${PORT}/get-logs`);
  console.log(`✨ Writing to log file: ${LOG_FILE}`);
  console.log(`✨ Server test page: http://localhost:${PORT}/test\n`);
});