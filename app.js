/* Smart Reader Pro - Main Application (Refactored) */

const App = {
    // State
    state: {
        text: '',
        slides: [],
        currentSlide: 0,
        isPlaying: false,
        focusMode: false
    },

    // DOM elements
    elements: {},

    // Initialize app
    init() {
        // Cache DOM elements
        this.cacheElements();

        // Initialize modules
        Reader.init(this.elements);
        UI.init(this.elements);
        Handlers.init();

        // Initialize theme
        ThemeManager.init();
        UI.updateThemeIcons();

        // Initialize voices
        this.initVoices();

        // Bind events
        this.bindEvents();

        // Check for saved progress
        this.checkProgress();

        // Load history
        this.renderHistory();

        console.log('Smart Reader Pro initialized');
    },

    // Cache DOM elements
    cacheElements() {
        this.elements = {
            landing: document.getElementById('landing'),
            reader: document.getElementById('reader'),
            textInput: document.getElementById('text-input'),
            voiceSelect: document.getElementById('voice-select'),
            speedSlider: document.getElementById('speed-slider'),
            speedValue: document.getElementById('speed-value'),
            slideCounter: document.getElementById('slide-counter'),
            slideText: document.getElementById('slide-text'),
            progressBar: document.getElementById('progress-bar'),
            progressFill: document.getElementById('progress-fill'),
            playIcon: document.getElementById('play-icon'),
            pauseIcon: document.getElementById('pause-icon'),
            bookmarkBtn: document.getElementById('bookmark-btn'),
            focusBtn: document.getElementById('focus-btn'),
            themeToggle: document.getElementById('theme-toggle'),
            themeIconLight: document.getElementById('theme-icon-light'),
            themeIconDark: document.getElementById('theme-icon-dark'),
            continueCard: document.getElementById('continue-card'),
            continuePreview: document.getElementById('continue-preview'),
            continueProgress: document.getElementById('continue-progress'),
            historySection: document.getElementById('history-section'),
            historyList: document.getElementById('history-list'),
            toastContainer: document.getElementById('toast-container'),
            urlModal: document.getElementById('url-modal'),
            urlInput: document.getElementById('url-input'),
            fetchUrlBtn: document.getElementById('fetch-url-btn')
        };
    },

    // Initialize voices
    initVoices() {
        // Defer voice loading to not block initial render
        const populate = () => {
            if (TTS.getVoices().length > 0) {
                TTS.populateVoiceSelector(this.elements.voiceSelect);
            }
        };

        // Use requestIdleCallback for non-critical voice loading
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(populate, { timeout: 200 });
        } else {
            setTimeout(populate, 50);
        }

        // Also populate when voices are ready (Chrome async)
        if (TTS.getVoices().length > 0) {
            populate();
        }
    },

    // Bind all event listeners
    bindEvents() {
        // Progress bar click
        Handlers.setupProgressBar(this.elements.progressBar, this.elements.reader);

        // Speed slider
        Handlers.setupSpeedSlider(this.elements.speedSlider, this.elements.speedValue);

        // Theme toggle
        this.elements.themeToggle?.addEventListener('click', () => this.handleAction('toggleTheme'));
    },

    // Handle actions from handlers
    handleAction(action, data) {
        switch (action) {
            case 'togglePlay':
                this.togglePlay();
                break;
            case 'prevSlide':
                this.prevSlide();
                break;
            case 'nextSlide':
                this.nextSlide();
                break;
            case 'seekTo':
                this.seekToPosition(data);
                break;
            case 'toggleBookmark':
                this.toggleBookmark();
                break;
            case 'toggleFocusMode':
                this.toggleFocusMode();
                break;
            case 'toggleTheme':
                this.toggleTheme();
                break;
            case 'escape':
                if (Reader.state.focusMode) {
                    this.toggleFocusMode();
                } else {
                    this.exitReader();
                }
                break;
            case 'fetchUrl':
                this.fetchFromUrl();
                break;
            case 'closeUrlModal':
                UI.closeModal(this.elements.urlModal, this.elements.urlInput);
                break;
        }
    },

    // Theme
    toggleTheme() {
        const newTheme = ThemeManager.toggle();
        UI.updateThemeIcons();
        UI.showToast(newTheme === 'dark' ? 'მუქი თემა' : 'ღია თემა');
    },

    // Progress
    checkProgress() {
        if (ProgressManager.exists()) {
            const progress = ProgressManager.get();
            UI.showContinueCard(progress);
        } else {
            UI.showContinueCard(null);
        }
    },

    // Start reading - split text and show reader
    startReading(text = null) {
        const inputText = text || this.elements.textInput.value.trim();

        if (!inputText) {
            UI.showToast('შეიყვანეთ ტექსტი', 'error');
            return;
        }

        const result = Reader.start(inputText);

        if (!result.success) {
            UI.showToast(result.message, 'error');
            return;
        }

        // Add to history
        HistoryManager.add(Reader.state.text, TextProcessor.getWordCount(Reader.state.text));
        this.renderHistory();

        // Show reader view
        UI.showView('reader');

        // Render first slide
        this.renderCurrentSlide();
    },

    // Continue reading from saved progress
    continueReading() {
        const progress = Reader.continue();
        if (!progress) return;

        UI.showView('reader');
        this.renderCurrentSlide();
        UI.showToast('კითხვა გაგრძელდა');
    },

    // Render current slide
    renderCurrentSlide() {
        const text = Reader.getCurrentSlideText();
        UI.renderSlide(text);
        UI.updateSlideCounter(Reader.getCurrentSlideIndex(), Reader.getTotalSlides());
        UI.updateProgressBar(Reader.getProgressPercent());
        this.updateBookmarkButton();
        this.renderBookmarkIndicators();
    },

    // Navigation
    nextSlide() {
        const result = Reader.next();

        if (result === 'end') {
            this.stop();
            UI.showToast('დასრულდა');
            ProgressManager.clear();
        } else if (result) {
            this.handleSlideChange();
        }
    },

    prevSlide() {
        if (Reader.previous()) {
            this.handleSlideChange();
        }
    },

    goToSlide(index) {
        if (Reader.goTo(index)) {
            this.handleSlideChange();
        }
    },

    handleSlideChange() {
        Reader.saveProgress();

        if (Reader.state.isPlaying) {
            TTS.stop();
            this.renderCurrentSlide();
            setTimeout(() => {
                if (Reader.state.isPlaying) this.play();
            }, 300);
        } else {
            this.renderCurrentSlide();
        }
    },

    // Play/Stop controls
    togglePlay() {
        if (Reader.state.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    },

    play() {
        Reader.state.isPlaying = true;
        UI.updatePlayButton(true);

        const text = Reader.getCurrentSlideText();
        if (!text) return;

        const voiceName = this.elements.voiceSelect.value;
        const rate = parseFloat(this.elements.speedSlider.value);

        const options = {
            rate: rate,
            volume: 1,
            pitch: 1,
            onBoundary: (charIndex) => {
                UI.highlightWord(charIndex);
            }
        };

        if (voiceName !== 'auto') {
            options.voice = TTS.getVoiceByName(voiceName);
        } else {
            options.voice = TTS.autoSelectVoice(text);
        }

        TTS.speak(text, options, () => {
            if (Reader.state.isPlaying) {
                this.nextSlide();
            }
        });

        // Check if speech was blocked
        setTimeout(() => {
            if (Reader.state.isPlaying && !TTS.speaking()) {
                UI.showToast('ხმის დაკვრა დაბლოკილია. გამორთე Brave Shields ან სცადე სხვა ბრაუზერი.', 'error');
            }
        }, 1000);
    },

    stop() {
        Reader.state.isPlaying = false;
        TTS.stop();
        UI.updatePlayButton(false);
        UI.clearHighlights();
    },

    // Bookmarks
    toggleBookmark() {
        const bookmarks = BookmarkManager.toggle(Reader.state.text, Reader.state.currentSlide);
        this.updateBookmarkButton();
        this.renderBookmarkIndicators();
        const isBookmarked = bookmarks.includes(Reader.state.currentSlide);
        UI.showToast(isBookmarked ? 'სანიშნე დაემატა' : 'სანიშნე წაიშალა');
    },

    updateBookmarkButton() {
        const isBookmarked = BookmarkManager.isBookmarked(Reader.state.text, Reader.state.currentSlide);
        UI.updateBookmarkButton(isBookmarked);
    },

    renderBookmarkIndicators() {
        const bookmarks = BookmarkManager.get(Reader.state.text);
        UI.renderBookmarkIndicators(bookmarks, Reader.getTotalSlides());
    },

    // Focus mode
    toggleFocusMode() {
        const isActive = Reader.toggleFocusMode();
        UI.updateFocusButton(isActive);
        UI.showToast(isActive ? 'ფოკუს რეჟიმი' : 'ჩვეულებრივი რეჟიმი');
    },

    handleSlideContainerClick(e) {
        if (Reader.state.focusMode) {
            this.toggleFocusMode();
        }
    },

    // Seek to position in progress bar
    seekToPosition(percent) {
        const index = Math.floor(percent * Reader.getTotalSlides());
        this.goToSlide(Math.max(0, Math.min(index, Reader.getTotalSlides() - 1)));
    },

    // View switching
    exitReader() {
        this.stop();
        Reader.saveProgress();
        UI.showView('landing');
        this.checkProgress();
    },

    // Fullscreen
    toggleFullscreen() {
        UI.toggleFullscreen();
    },

    // History
    renderHistory() {
        const history = HistoryManager.getAll();
        UI.renderHistory(history);
    },

    // URL fetching
    async fetchFromUrl() {
        const url = this.elements.urlInput.value.trim();

        if (!url) {
            UI.showToast('შეიყვანეთ URL', 'error');
            return;
        }

        UI.setButtonState(this.elements.fetchUrlBtn, true, 'იტვირთება...');

        try {
            const text = await Handlers.fetchFromUrl(url);

            if (!text || text.length < 50) {
                throw new Error('No text found');
            }

            this.elements.textInput.value = text;
            UI.closeModal(this.elements.urlModal, this.elements.urlInput);
            UI.showToast('ტექსტი წარმატებით ამოღებულია');
        } catch (e) {
            console.error('URL fetch error:', e);
            UI.showToast('ვერ მოხერხდა ტექსტის ამოღება', 'error');
        } finally {
            UI.setButtonState(this.elements.fetchUrlBtn, false, 'წაკითხვა');
        }
    },

    // Global functions for HTML onclick handlers
    clearInput() {
        this.elements.textInput.value = '';
        this.elements.textInput.focus();
    },

    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            this.elements.textInput.value = text;
            UI.showToast('ტექსტი ჩაკრულია');
        } catch (e) {
            UI.showToast('ვერ მოხერხდა ჩაკრება', 'error');
        }
    },

    openUrlModal() {
        UI.openModal(this.elements.urlModal, this.elements.urlInput);
    },

    closeUrlModal() {
        UI.closeModal(this.elements.urlModal, this.elements.urlInput);
    },

    saveCurrentText() {
        if (!Reader.state.text) return;
        Reader.saveProgress();
        UI.showToast('პროგრესი შენახულია');
    },

    clearProgress() {
        ProgressManager.clear();
        UI.showContinueCard(null);
        UI.showToast('პროგრესი წაიშალა');
    },

    loadFromHistory(id) {
        const history = HistoryManager.getAll();
        const item = history.find(h => h.id === parseInt(id));

        if (item) {
            this.elements.textInput.value = item.text;
            UI.showToast('ტექსტი ჩატვირთულია');
        }
    },

    deleteHistoryItem(id) {
        HistoryManager.delete(parseInt(id));
        this.renderHistory();
        UI.showToast('წაიშალა');
    },

    clearHistory() {
        if (confirm('გსურთ მთელი ისტორიის წაშლა?')) {
            HistoryManager.clear();
            this.renderHistory();
            UI.showToast('ისტორია გასუფთავდა');
        }
    }
};

// Global wrapper functions for HTML onclick handlers
function startReading() {
    App.startReading();
}

function exitReader() {
    App.exitReader();
}

function togglePlay() {
    App.togglePlay();
}

function prevSlide() {
    App.prevSlide();
}

function nextSlide() {
    App.nextSlide();
}

function toggleBookmark() {
    App.toggleBookmark();
}

function toggleFocusMode() {
    App.toggleFocusMode();
}

function handleSlideContainerClick(event) {
    App.handleSlideContainerClick(event);
}

function toggleFullscreen() {
    App.toggleFullscreen();
}

function toggleTheme() {
    App.toggleTheme();
}

function seekToPosition(event) {
    const rect = App.elements.progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    App.seekToPosition(percent);
}

function clearInput() {
    App.clearInput();
}

function pasteFromClipboard() {
    App.pasteFromClipboard();
}

function openUrlModal() {
    App.openUrlModal();
}

function closeUrlModal() {
    App.closeUrlModal();
}

function fetchFromUrl() {
    App.fetchFromUrl();
}

function saveCurrentText() {
    App.saveCurrentText();
}

function clearProgress() {
    App.clearProgress();
}

function continueReading() {
    App.continueReading();
}

function loadFromHistory(id) {
    App.loadFromHistory(id);
}

function deleteHistoryItem(id) {
    App.deleteHistoryItem(id);
}

function clearHistory() {
    App.clearHistory();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    TTS.stop();
    if (Reader.state.text && Reader.state.currentSlide > 0) {
        Reader.saveProgress();
    }
});
