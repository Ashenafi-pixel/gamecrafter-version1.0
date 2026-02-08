// Basic HTTP server for testing
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server is working!');
});

// Listen on all interfaces, port 8080
server.listen(8080, '0.0.0.0', () => {
  console.log('Server running at http://0.0.0.0:8080/');
  console.log('Try accessing:');
  console.log('- http://localhost:8080');
  console.log('- http://127.0.0.1:8080');
});