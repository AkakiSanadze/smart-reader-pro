#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Configuration
const PORT = 8080;
const HOST = 'localhost';
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon'
};

// Create HTTP server
const server = http.createServer((req, res) => {
  // Parse URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Handle root path
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Resolve file path
  const filePath = path.join(__dirname, pathname);
  
  // Security: Prevent directory traversal
  if (!filePath.startsWith(__dirname + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }
  
  // Read file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found - try to serve index.html for SPA routing
        const indexPath = path.join(__dirname, 'index.html');
        fs.readFile(indexPath, (indexErr, indexContent) => {
          if (indexErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      // Determine content type
      const extname = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[extname] || 'application/octet-stream';
      
      // Set headers and send response
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`Smart Reader server running at http://${HOST}:${PORT}/`);
  console.log('Press Ctrl+C to stop the server');
});