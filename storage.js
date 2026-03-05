/* Storage Module - localStorage abstraction */

const Storage = {
    // Storage keys
    KEYS: {
        THEME: 'sr_theme',
        HISTORY: 'sr_history',
        SAVED: 'sr_saved',
        PROGRESS: 'sr_progress',
        BOOKMARKS: 'sr_bookmarks',
        SETTINGS: 'sr_settings'
    },

    // Limits
    LIMITS: {
        HISTORY: 50,
        SAVED: 20
    },

    // Get item from localStorage
    get(key, fallback = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            console.warn('Storage.get error:', e);
            return fallback;
        }
    },

    // Set item in localStorage
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Storage.set error:', e);
            return false;
        }
    },

    // Remove item from localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('Storage.remove error:', e);
            return false;
        }
    },

    // Clear all app data
    clear() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    },

    // Get storage usage info
    getUsage() {
        let total = 0;
        Object.values(this.KEYS).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                total += item.length * 2; // UTF-16 characters = 2 bytes
            }
        });
        return {
            bytes: total,
            kb: (total / 1024).toFixed(2),
            mb: (total / 1024 / 1024).toFixed(2)
        };
    }
};

// History Manager
const HistoryManager = {
    MAX_ITEMS: 50,

    // Add entry to history
    add(text, wordCount) {
        if (!text || text.trim().length < 10) return;

        const history = Storage.get(Storage.KEYS.HISTORY, []);

        // Check for duplicate
        const existingIndex = history.findIndex(h => h.text === text);
        if (existingIndex > -1) {
            // Move to front
            history.splice(existingIndex, 1);
        }

        // Add new entry
        history.unshift({
            id: Date.now(),
            preview: text.slice(0, 100) + (text.length > 100 ? '...' : ''),
            text: text,
            wordCount: wordCount,
            date: new Date().toISOString()
        });

        // Limit size
        if (history.length > this.MAX_ITEMS) {
            history.pop();
        }

        Storage.set(Storage.KEYS.HISTORY, history);
    },

    // Get all history
    getAll() {
        return Storage.get(Storage.KEYS.HISTORY, []);
    },

    // Delete entry
    delete(id) {
        const history = Storage.get(Storage.KEYS.HISTORY, []);
        const filtered = history.filter(h => h.id !== id);
        Storage.set(Storage.KEYS.HISTORY, filtered);
    },

    // Clear all history
    clear() {
        Storage.set(Storage.KEYS.HISTORY, []);
    }
};

// Progress Manager
const ProgressManager = {
    // Save reading progress
    save(text, slideIndex, totalSlides) {
        if (!text) return;

        Storage.set(Storage.KEYS.PROGRESS, {
            text: text,
            slideIndex: slideIndex,
            totalSlides: totalSlides,
            date: new Date().toISOString()
        });
    },

    // Get saved progress
    get() {
        return Storage.get(Storage.KEYS.PROGRESS, null);
    },

    // Clear progress
    clear() {
        Storage.remove(Storage.KEYS.PROGRESS);
    },

    // Check if progress exists
    exists() {
        const progress = this.get();
        return progress && progress.text && progress.slideIndex > 0;
    }
};

// Bookmark Manager
const BookmarkManager = {
    // Get bookmarks for current text
    get(text) {
        const all = Storage.get(Storage.KEYS.BOOKMARKS, {});
        const hash = this.hashText(text);
        return all[hash] || [];
    },

    // Toggle bookmark
    toggle(text, slideIndex) {
        const all = Storage.get(Storage.KEYS.BOOKMARKS, {});
        const hash = this.hashText(text);

        if (!all[hash]) {
            all[hash] = [];
        }

        const index = all[hash].indexOf(slideIndex);
        if (index > -1) {
            all[hash].splice(index, 1);
        } else {
            all[hash].push(slideIndex);
            all[hash].sort((a, b) => a - b);
        }

        Storage.set(Storage.KEYS.BOOKMARKS, all);
        return all[hash];
    },

    // Check if slide is bookmarked
    isBookmarked(text, slideIndex) {
        const bookmarks = this.get(text);
        return bookmarks.includes(slideIndex);
    },

    // Simple hash for text identification
    hashText(text) {
        let hash = 0;
        for (let i = 0; i < text.length && i < 1000; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
};

// Theme Manager
const ThemeManager = {
    // Get current theme
    get() {
        return Storage.get(Storage.KEYS.THEME, null);
    },

    // Set theme
    set(theme) {
        Storage.set(Storage.KEYS.THEME, theme);
        this.apply(theme);
    },

    // Apply theme to document
    apply(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    },

    // Initialize theme (from storage or system preference)
    init() {
        // Apply theme immediately from saved preference (fast path)
        const saved = this.get();
        if (saved) {
            this.apply(saved);
        }
        // Defer system preference check to not block DOMContentLoaded
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => this._initSystemTheme(saved), { timeout: 50 });
        } else {
            setTimeout(() => this._initSystemTheme(saved), 0);
        }
    },

    // Deferred system theme initialization
    _initSystemTheme(saved) {
        if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.apply('dark');
        }

        // Listen for system preference changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!this.get()) {
                    this.apply(e.matches ? 'dark' : 'light');
                }
            });
        }
    },

    // Toggle theme
    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        this.set(newTheme);
        return newTheme;
    }
};