/* Handlers Module - Keyboard, touch, and URL handlers */

const Handlers = {
    // Configuration
    touchThreshold: 50,

    // Touch state
    touchState: {
        startX: 0,
        startY: 0
    },

    // Initialize
    init() {
        this.setupKeyboard();
        this.setupTouch();
        this.setupURLInput();
    },

    // Keyboard shortcuts
    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Only handle if reader view is visible
            const reader = document.getElementById('reader');
            if (!reader || reader.classList.contains('hidden')) return;

            // Ignore if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    App.handleAction('togglePlay');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    App.handleAction('prevSlide');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    App.handleAction('nextSlide');
                    break;
                case 'Escape':
                    e.preventDefault();
                    App.handleAction('escape');
                    break;
                case 'KeyB':
                    e.preventDefault();
                    App.handleAction('toggleBookmark');
                    break;
                case 'KeyF':
                    e.preventDefault();
                    App.handleAction('toggleFocusMode');
                    break;
                case 'KeyT':
                    e.preventDefault();
                    App.handleAction('toggleTheme');
                    break;
            }
        });
    },

    // Touch gestures
    setupTouch() {
        const container = document.getElementById('reader');
        if (!container) return;

        container.addEventListener('touchstart', (e) => {
            this.touchState.startX = e.touches[0].clientX;
            this.touchState.startY = e.touches[0].clientY;
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            const reader = document.getElementById('reader');
            if (!reader || reader.classList.contains('hidden')) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const diffX = touchEndX - this.touchState.startX;
            const diffY = Math.abs(touchEndY - this.touchState.startY);

            // Only trigger if horizontal swipe is dominant
            if (Math.abs(diffX) > this.touchThreshold && Math.abs(diffX) > diffY) {
                if (diffX > 0) {
                    App.handleAction('prevSlide');
                } else {
                    App.handleAction('nextSlide');
                }
            }
        }, { passive: true });
    },

    // URL input handling
    setupURLInput() {
        const urlInput = document.getElementById('url-input');
        if (urlInput) {
            urlInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    App.handleAction('fetchUrl');
                }
            });
        }

        const urlModal = document.getElementById('url-modal');
        if (urlModal) {
            urlModal.addEventListener('click', (e) => {
                if (e.target === urlModal) {
                    App.handleAction('closeUrlModal');
                }
            });
        }
    },

    // Progress bar seeking
    setupProgressBar(progressBar, reader) {
        if (!progressBar) return;

        progressBar.addEventListener('click', (e) => {
            if (reader.classList.contains('hidden')) return;

            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            App.handleAction('seekTo', percent);
        });
    },

    // Speed slider
    setupSpeedSlider(speedSlider, speedValue) {
        if (speedSlider && speedValue) {
            speedSlider.addEventListener('input', (e) => {
                speedValue.textContent = e.target.value + 'x';
            });
        }
    },

    // Extract text from HTML
    extractTextFromHtml(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Remove unwanted elements
        const remove = ['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript'];
        remove.forEach(tag => {
            doc.querySelectorAll(tag).forEach(el => el.remove());
        });

        // Try to find main content
        const contentSelectors = [
            'article',
            '[role="main"]',
            'main',
            '.content',
            '.article',
            '.post',
            '#content',
            '#article'
        ];

        let content = null;
        for (const selector of contentSelectors) {
            content = doc.querySelector(selector);
            if (content) break;
        }

        if (!content) {
            content = doc.body;
        }

        // Extract text from paragraphs
        const paragraphs = content.querySelectorAll('p');
        if (paragraphs.length > 0) {
            return Array.from(paragraphs)
                .map(p => p.textContent.trim())
                .filter(t => t.length > 20)
                .join('\n\n');
        }

        // Fallback to all text
        return content.textContent
            .replace(/\s+/g, ' ')
            .trim();
    },

    // Fetch content from URL
    async fetchFromUrl(url) {
        const proxy = 'https://api.allorigins.win/raw?url=';
        const response = await fetch(proxy + encodeURIComponent(url));

        if (!response.ok) throw new Error('Failed to fetch');

        const html = await response.text();
        return this.extractTextFromHtml(html);
    }
};
