// Simple Express server for SlotAI built version
const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing - redirect all requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Access at http://localhost:${PORT} or http://127.0.0.1:${PORT}`);
});