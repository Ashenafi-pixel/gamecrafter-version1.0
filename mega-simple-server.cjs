// Mega simple Express server for SlotAI
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Use port 3500 to match our scripts
const PORT = 3500;

// Serve static files from various directories
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve the root index.html file for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`MEGA SIMPLE SlotAI server running on http://localhost:${PORT}`);
  console.log(`Access at: http://localhost:${PORT}`);
  console.log('To stop the server, press Ctrl+C');
});