# Smart Reader Pro

Interactive text-to-speech reader with Georgian language support.

![License](https://img.shields.io/github/license/AkakiSanadze/smart-reader-pro)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

## Features

- **Text-to-Speech** - Web Speech API with Georgian language support
- **Slide-based Reading** - Text split into digestible slides
- **Speed Control** - Adjustable reading speed (0.5x - 2x)
- **Voice Selection** - Choose from available system voices
- **Dark/Light Theme** - Toggle between themes
- **Focus Mode** - Distraction-free reading
- **Bookmarks** - Mark important slides
- **Reading History** - Track your reading
- **URL Import** - Fetch text from any URL
- **PWA Support** - Install as app, works offline

## Screenshots

<!-- Add screenshots here -->
<!--
![Landing Screen](screenshots/landing.png)
![Reader View](screenshots/reader.png)
-->

## Live Demo

[smart-reader-pro.vercel.app](https://smart-reader-pro.vercel.app)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Previous slide |
| `→` | Next slide |
| `Escape` | Exit reader |
| `F` | Toggle focus mode |
| `B` | Toggle bookmark |

## Running Locally

### Option 1: Using Built-in Server Scripts (Recommended)

**Node.js Server:**
```bash
node server.js
# Then open http://localhost:8080
```

**Python Server:**
```bash
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
# Then open http://localhost:3000
```

## Important Notes

- **Do NOT open `index.html` directly via `file://` protocol** - it will cause CORS and Service Worker errors
- For full PWA functionality (offline support, installation), use HTTP/HTTPS via a local server
- Both server scripts support SPA routing and serve `index.html` for any route

## Project Structure

```
Smart Reader/
├── index.html          # Main HTML
├── styles.css          # CSS styles (themes, responsive)
├── app.js              # Main application logic
├── tts.js              # Text-to-speech module
├── text-processor.js   # Text processing utilities
├── reader.js           # Reader engine
├── ui.js               # UI components
├── handlers.js         # Event handlers
├── storage.js          # localStorage management
├── service-worker.js   # Offline caching
├── manifest.json       # PWA manifest
├── server.js           # Node.js server
├── server.py           # Python server
└── favicon.svg         # App icon
```

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **TTS**: Web Speech API, Google Translate TTS (fallback for Georgian)
- **Storage**: localStorage
- **PWA**: Service Worker, Web App Manifest
- **Deployment**: Vercel (static)

## License

MIT License - feel free to use and modify.