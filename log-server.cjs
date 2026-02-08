/**
 * LOG SERVER
 * 
 * This is a simple Express server that accepts log messages and writes them to a file.
 * It runs alongside the main application server.
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

// Path to log file
const LOG_FILE = path.join(__dirname, 'STEPFUCK.log');

// Create log file if it doesn't exist
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '--- STEP NAVIGATION LOGS ---\n\n', 'utf8');
  console.log(`Created log file at ${LOG_FILE}`);
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
    return res.status(200).send(logs);
  } catch (error) {
    console.error('Error reading log file:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint to clear logs
app.post('/clear-logs', (req, res) => {
  try {
    fs.writeFileSync(LOG_FILE, '--- STEP NAVIGATION LOGS ---\n\n', 'utf8');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error clearing log file:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Start server on a different port than the main app
const PORT = 3501;
app.listen(PORT, () => {
  console.log(`Log server running on http://localhost:${PORT}`);
  console.log(`Writing logs to ${LOG_FILE}`);
});
