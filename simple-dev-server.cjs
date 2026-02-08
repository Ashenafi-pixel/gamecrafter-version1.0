// Simple development server for SlotAI on port 5173
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5173;
const projectDir = process.cwd();

// Set correct MIME types for TypeScript and JSX files
express.static.mime.define({
  'application/javascript': ['ts', 'tsx', 'jsx'],
  'text/javascript': ['ts', 'tsx', 'jsx'],
  'application/typescript': ['ts'],
  'text/typescript': ['ts']
});

// Custom middleware to handle .tsx and .ts files
app.use('/src', (req, res, next) => {
  if (req.path.endsWith('.tsx') || req.path.endsWith('.ts') || req.path.endsWith('.jsx')) {
    res.setHeader('Content-Type', 'application/javascript');
  }
  next();
}, express.static(path.join(projectDir, 'src')));

// Serve static files
app.use(express.static(projectDir));
app.use('/public', express.static(path.join(projectDir, 'public')));

// Simple API health check
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(projectDir, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`SlotAI development server running on http://localhost:${PORT}`);
  console.log(`Animation Lab available at http://localhost:${PORT}/animtest`);
  console.log('To stop the server, press Ctrl+C');
});