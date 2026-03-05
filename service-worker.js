const CACHE_NAME = 'smart-reader-v2';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './tts.js',
    './storage.js',
    './manifest.json',
    './favicon.svg'
];

// Install Event - Cache all assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Smart Reader: Caching app assets');
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Skip external requests (fonts, TTS, etc)
    if (url.origin !== self.location.origin) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request);
            })
        );
        return;
    }

    // For navigation requests (HTML pages)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Cache the new version
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Network failed, return cached index.html
                    return caches.match('./index.html');
                })
        );
        return;
    }

    // For other requests (CSS, JS, images)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cache immediately if available
            if (cachedResponse) {
                // Fetch in background to update cache
                fetch(event.request)
                    .then((response) => {
                        if (response.ok) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, response);
                            });
                        }
                    })
                    .catch(() => {});

                return cachedResponse;
            }

            // Not in cache, fetch from network
            return fetch(event.request)
                .then((response) => {
                    // Cache successful responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Return offline fallback for HTML requests
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('./index.html');
                    }
                    return new Response('Offline', { status: 503 });
                });
        })
    );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});