// Simple Express server for SlotAI (CommonJS version)
const express = require('express');
const path = require('path');
const cors = require('cors');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

// Set correct MIME types for TypeScript and JSX files
app.use((req, res, next) => {
  if (req.path.endsWith('.tsx') || req.path.endsWith('.ts') || req.path.endsWith('.jsx')) {
    res.setHeader('Content-Type', 'application/javascript');
  }
  next();
});

// Disable caching for development
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Use environment port (for Render.com) or 5173 as default
const PORT = process.env.PORT || 5173;

// Serve the built files if they exist
app.use(express.static(path.join(__dirname, 'dist')));

// Also serve the source files for development
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Serve the root index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Get local IP address
const getLocalIP = () => {
  const nets = os.networkInterfaces();
  let localIP = 'localhost';

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (loopback) addresses
      if (net.family === 'IPv4' && !net.internal) {
        localIP = net.address;
        return localIP;
      }
    }
  }
  return localIP;
};

const localIP = getLocalIP();

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SlotAI server running on port ${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://${localIP}:${PORT}`);
  console.log('To stop the server, press Ctrl+C');
});