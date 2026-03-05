#!/usr/bin/env python3

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Configuration
PORT = 8080
HOST = 'localhost'

class SmartReaderHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Set the directory to serve from
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def end_headers(self):
        # Add security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()
    
    def do_GET(self):
        # Handle root path
        if self.path == '/':
            self.path = '/index.html'
        
        # Try to serve the requested file
        try:
            # Check if file exists
            file_path = Path(self.translate_path(self.path))
            if not file_path.exists():
                # For SPA routing, serve index.html
                self.path = '/index.html'
            
            # Call parent method to serve the file
            super().do_GET()
            
        except Exception as e:
            self.send_error(500, f"Internal Server Error: {str(e)}")

def main():
    # Change to the directory where this script is located
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)
    
    # Create and start server
    with socketserver.TCPServer((HOST, PORT), SmartReaderHandler) as httpd:
        print(f"Smart Reader server running at http://{HOST}:{PORT}/")
        print("Press Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            sys.exit(0)

if __name__ == "__main__":
    main()