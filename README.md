# Smart Reader Pro

Interactive text-to-speech reader with Georgian language support.

## Running Locally

### Option 1: Using Built-in Server Scripts (Recommended)

**Node.js Server:**
```bash
# Make sure you have Node.js installed
node server.js
# Then open http://localhost:8080
```

**Python Server:**
```bash
# Make sure you have Python 3 installed
python3 server.py
# Then open http://localhost:8080
```

### Option 2: Using Built-in Commands

**Python:**
```bash
python3 -m http.server 8000
# Then open http://localhost:8000
```

**Node.js (npx):**
```bash
npx serve .
# Then open http://localhost:3000 (or check the port shown in terminal)
```

## Important Notes

- **Do NOT open `index.html` directly via `file://` protocol** as it will cause CORS and Service Worker errors
- The application now includes **graceful fallbacks** for `file://` protocol (manifest and service worker are disabled)
- For full PWA functionality (offline support, installation), use HTTP/HTTPS protocol via a local server
- Both server scripts support SPA routing and will serve `index.html` for any route

## PWA Features

- Service Worker for offline support (only on HTTP/HTTPS)
- Manifest for home screen installation (only on HTTP/HTTPS)
- Graceful degradation when opened via `file://` protocol
- Full functionality on localhost or HTTPS
