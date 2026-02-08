// Super simple Express server for testing
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3500;

// Serve static files from current directory
app.use(express.static(__dirname));

// Serve the test.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

// Start the server on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on:`);
  console.log(`- http://localhost:${PORT}`);
  console.log(`- http://127.0.0.1:${PORT}`);
  console.log('Try accessing using any of these URLs in your browser.');
  console.log('To stop the server, press Ctrl+C');
});