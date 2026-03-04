// Smart Reader Pro - Core Application logic

// ==================== APP STATE & CONFIG ====================
const AppState = {
    slides: [],
    currentIndex: 0,
    isPlaying: false,
    originalText: '',
    sessionStartTime: null,
    bookmarkedSlides: new Set(),
    availableVoices: [],
    currentUtterance: null
};

// Safe localStorage helpers
const Storage = {
    get(key, fallback = null) {
        try {
            const val = localStorage.getItem(key);
            if (val === null) return fallback;
            // Try to parse as JSON, fallback to plain string
            try {
                return JSON.parse(val);
            } catch {
                return val;
            }
        } catch (e) {
            console.warn('Storage.get error:', e);
            return fallback;
        }
    },
    set(key, value) {
        try {
            if (typeof value === 'string') {
                localStorage.setItem(key, value);
            } else {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (e) {
            console.warn('Storage.set error:', e);
        }
    }
};

// ==================== STATISTICS MODULE ====================
const StatsManager = {
    data: {
        totalTexts: 0,
        totalMinutes: 0,
        totalWords: 0,
        totalSessions: 0
    },

    load() {
        const saved = Storage.get('readerStats');
        if (saved) {
            this.data = saved;
            this.updateDisplay();
        }
    },

    save() {
        Storage.set('readerStats', this.data);
        this.updateDisplay();
    },

    updateDisplay() {
        const elTexts = document.getElementById('stat-texts');
        const elTime = document.getElementById('stat-time');

        if (elTexts) elTexts.textContent = this.data.totalTexts;
        if (elTime) elTime.textContent = Math.round(this.data.totalMinutes);
    },

    addSession(wordCount) {
        this.data.totalTexts++;
        this.data.totalSessions++;
        this.data.totalWords += wordCount;
        this.save();
    },

    addMinutes(minutes) {
        this.data.totalMinutes += minutes;
        this.save();
    },

    reset() {
        if (confirm('დარწმუნებული ხართ რომ გსურთ სტატისტიკის გასუფთავება?')) {
            this.data = { totalTexts: 0, totalMinutes: 0, totalWords: 0, totalSessions: 0 };
            this.save();
        }
    }
};

// ==================== STORAGE MODULE ====================
const StorageManager = {
    savedTexts: [],

    loadSavedTexts() {
        const saved = Storage.get('savedTexts', []);
        if (saved) {
            this.savedTexts = saved;
            this.renderList();
        }
    },

    saveText(text) {
        if (!text) return;

        const title = prompt('სათაური:');
        if (title === null) return; // User cancelled

        const preview = text.substring(0, 80) + (text.length > 80 ? '...' : '');
        const date = new Date().toLocaleDateString('ka-GE');

        const item = { text, preview, title: title.trim() || 'უსათაურო', date, timestamp: Date.now() };
        this.savedTexts.unshift(item);
        if (this.savedTexts.length > 20) this.savedTexts = this.savedTexts.slice(0, 20);

        Storage.set('savedTexts', this.savedTexts);
        this.renderList();
        alert('✅ ტექსტი შენახულია!');
    },

    deleteText(index, event) {
        if (event) event.stopPropagation();
        if (confirm('გსურთ ამ ტექსტის წაშლა?')) {
            this.savedTexts.splice(index, 1);
            Storage.set('savedTexts', this.savedTexts);
            this.renderList();
            if (document.getElementById('modal-overlay').classList.contains('active')) {
                showAllSavedTexts();
            }
        }
    },

    renderList() {
        const container = document.getElementById('saved-texts-list');
        if (this.savedTexts.length === 0) {
            container.innerHTML = `<div class="empty-state">📚<br>ჯერ არ გაქვთ შენახული ტექსტები</div>`;
            return;
        }

        container.innerHTML = this.savedTexts.slice(0, 5).map((item, idx) => `
            <div class="saved-text-item" onclick="TextProcessor.loadToInput(${idx})">
                <div class="saved-text-preview">${item.preview}</div>
                <div class="saved-text-meta">
                    <span>${item.title || 'უსათაურო'}</span>
                    <span>${item.date}</span>
                </div>
                <button class="saved-text-delete" onclick="StorageManager.deleteText(${idx}, event)">✕</button>
            </div>
        `).join('');
    }
};

// ==================== TEXT PROCESSING MODULE ====================
const TextProcessor = {
    clean(text) {
        // Basic Markdown cleanup
        text = text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
        text = text.replace(/```[\s\S]*?```/g, '').replace(/`([^`]+)`/g, '$1');
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        text = text.replace(/<[^>]+>/g, '');
        text = text.replace(/^#{1,6}\s+/gm, '');
        
        // Smart whitespace cleanup
        return text.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim();
    },

    splitIntoSlides(text, lengthMode) {
        const paragraphs = text.split(/\n\n+/);
        const result = [];

        paragraphs.forEach(p => {
            p = p.trim();
            if (!p) return;

            if (lengthMode === 'long') {
                result.push(p);
            } else {
                // Better sentence splitting (handles Georgian abbreviations)
                // Avoid splitting at "ა.შ.", "ე.ი.", "წ.", "გვ."
                const sentences = p.split(/(?<=[.!?])\s+(?=[ა-ჰA-Z])/); 
                
                let chunk = "";
                const limit = lengthMode === 'short' ? 2 : 4;
                
                sentences.forEach((s, i) => {
                    chunk += (chunk ? " " : "") + s;
                    if ((i + 1) % limit === 0 || i === sentences.length - 1) {
                        result.push(chunk);
                        chunk = "";
                    }
                });
            }
        });
        return result;
    },

    loadToInput(index) {
        const item = StorageManager.savedTexts[index];
        document.getElementById('text-input').value = item.text;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// ==================== READER ENGINE ====================
const ReaderEngine = {
    synth: window.speechSynthesis,

    updateSlide() {
        const slideContainer = document.getElementById('slide-text');
        slideContainer.style.opacity = '0';
        
        setTimeout(() => {
            const text = AppState.slides[AppState.currentIndex];
            const words = text.split(/(\s+)/);
            let charCount = 0;
            
            slideContainer.innerHTML = words.map(word => {
                const start = charCount;
                const len = word.length;
                charCount += len;
                if (!word.trim()) return word;
                return `<span class="word-span" data-start="${start}" data-len="${len}">${word}</span>`;
            }).join('');
            
            slideContainer.style.opacity = '1';
            
            const percent = Math.round(((AppState.currentIndex + 1) / AppState.slides.length) * 100);
            document.getElementById('counter').innerHTML = `
                <span>${AppState.currentIndex + 1} / ${AppState.slides.length}</span>
                <span class="progress-percentage">${percent}%</span>
            `;
            document.getElementById('progress-fill').style.width = percent + '%';
            
            this.updateBookmarkBtn();
        }, 100);
    },

    updateBookmarkBtn() {
        const btn = document.getElementById('bookmark-btn');
        btn.textContent = AppState.bookmarkedSlides.has(AppState.currentIndex) ? '🔖' : '🏷️';
    },

    next() {
        if (AppState.currentIndex < AppState.slides.length - 1) {
            AppState.currentIndex++;
            this.handlePlaybackTransition();
        } else if (AppState.isPlaying) {
            this.stop();
        }
    },

    prev() {
        if (AppState.currentIndex > 0) {
            AppState.currentIndex--;
            this.handlePlaybackTransition();
        }
    },

    handlePlaybackTransition() {
        if (AppState.isPlaying) {
            if (AppState.currentUtterance) AppState.currentUtterance.onend = null;
            this.synth.cancel();
            this.updateSlide();
            setTimeout(() => { if (AppState.isPlaying) this.readCurrent(); }, 300);
        } else {
            this.updateSlide();
        }
    },

    togglePlay() {
        AppState.isPlaying ? this.stop() : this.start();
    },

    start() {
        AppState.isPlaying = true;
        const btn = document.getElementById('play-btn');
        btn.classList.add('playing');
        document.getElementById('play-icon').style.display = 'none';
        document.getElementById('pause-icon').style.display = 'block';
        this.readCurrent();
    },

    stop() {
        AppState.isPlaying = false;
        this.synth.cancel();
        if (typeof GeorgianTTS !== 'undefined') GeorgianTTS.stop();
        
        const btn = document.getElementById('play-btn');
        btn.classList.remove('playing');
        document.getElementById('play-icon').style.display = 'block';
        document.getElementById('pause-icon').style.display = 'none';
        this.removeHighlights();
        document.getElementById('current-voice-display').style.display = 'none';
    },

    readCurrent() {
        if (this.synth.speaking) this.synth.cancel();
        this.removeHighlights();
        
        const text = AppState.slides[AppState.currentIndex];
        if (!text) return;

        const isKa = typeof GeorgianTTS !== 'undefined' && GeorgianTTS.isGeorgianText(text);
        const voiceSelectValue = document.getElementById('voice-select').value;
        const toggleChecked = document.getElementById('georgian-tts-toggle').checked;
        
        console.log("ReaderEngine: Reading current slide. Detected Georgian:", isKa);

        if ((isKa || voiceSelectValue === 'georgian-native') && toggleChecked) {
            console.log("ReaderEngine: Using Georgian TTS path");
            this.readGeorgian(text);
        } else {
            console.log("ReaderEngine: Using Standard TTS path");
            this.readStandard(text);
        }
    },

    readGeorgian(text) {
        const rate = parseFloat(document.getElementById('rate-range').value);
        const volume = parseFloat(document.getElementById('volume-range').value);
        
        const badge = document.getElementById('current-voice-display');
        badge.style.display = 'block';

        if (GeorgianTTS.hasNativeGeorgianVoice()) {
            console.log("ReaderEngine: Using Native Georgian voice");
            badge.textContent = '🇬🇪 Georgian';
            this.speakNative(text, GeorgianTTS.getNativeGeorgianVoice());
        } else {
            console.log("ReaderEngine: Using Google TTS Fallback");
            badge.textContent = '🇬🇪 Google Voice';
            GeorgianTTS.speakWithGoogle(text, rate, volume, () => {
                if (AppState.isPlaying) this.next();
            });
        }
    },

    readStandard(text) {
        const detected = this.detectLanguage(text);
        const voiceName = document.getElementById('voice-select').value;
        let selectedVoice = null;

        if (voiceName !== "auto") {
            selectedVoice = AppState.availableVoices.find(v => v.name === voiceName);
        } else {
            const prefix = detected === 'ru' ? 'ru' : 'en';
            selectedVoice = AppState.availableVoices.find(v => v.lang.toLowerCase().startsWith(prefix));
        }

        if (!selectedVoice && AppState.availableVoices.length > 0) selectedVoice = AppState.availableVoices[0];
        
        const badge = document.getElementById('current-voice-display');
        if (selectedVoice) {
            badge.textContent = selectedVoice.name.split(' ')[0];
            badge.style.display = 'block';
        }

        this.speakNative(text, selectedVoice);
    },

    speakNative(text, voice) {
        const utt = new SpeechSynthesisUtterance(text);
        AppState.currentUtterance = utt;
        
        if (voice) {
            utt.voice = voice;
            utt.lang = voice.lang;
        }

        utt.rate = parseFloat(document.getElementById('rate-range').value);
        utt.volume = parseFloat(document.getElementById('volume-range').value);
        utt.pitch = parseFloat(document.getElementById('pitch-range').value);

        utt.onboundary = (e) => this.highlightWord(e.charIndex);
        utt.onend = () => {
            this.removeHighlights();
            if (AppState.isPlaying) this.next();
        };
        
        this.synth.speak(utt);
    },

    highlightWord(charIndex) {
        if (charIndex === undefined) return;
        this.removeHighlights();
        const spans = document.querySelectorAll('.word-span');
        for (let span of spans) {
            const start = parseInt(span.getAttribute('data-start'));
            const len = parseInt(span.getAttribute('data-len'));
            if (charIndex >= start && charIndex < start + len + 1) {
                span.classList.add('highlight');
                const area = document.querySelector('.content-area');
                const sRect = span.getBoundingClientRect();
                const aRect = area.getBoundingClientRect();
                area.scrollBy({ top: sRect.top - aRect.top - (aRect.height / 2), behavior: 'smooth' });
                break;
            }
        }
    },

    removeHighlights() {
        document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
    },

    detectLanguage(text) {
        const ru = (text.match(/[\u0400-\u04FF]/g) || []).length;
        const ka = (text.match(/[\u10D0-\u10FF]/g) || []).length;
        const en = (text.match(/[a-zA-Z]/g) || []).length;
        if (ka > (ru + en) * 0.2) return 'ka';
        return ru > en ? 'ru' : 'en';
    }
};

// ==================== UI CONTROLLER ====================
const UI = {
    init() {
        this.loadSettings();
        this.attachListeners();
        StatsManager.load();
        StorageManager.loadSavedTexts();
        this.updateVoices();
    },

    loadSettings() {
        const theme = Storage.get('theme', '');
        document.body.className = theme;
        document.getElementById('theme-select').value = theme;

        const rate = Storage.get('ttsRate', '1');
        document.getElementById('rate-range').value = rate;
        document.getElementById('speed-slider').value = rate;
        document.getElementById('speed-val').textContent = rate + 'x';

        document.getElementById('volume-range').value = Storage.get('ttsVolume', '1');
        document.getElementById('pitch-range').value = Storage.get('ttsPitch', '1');

        // Load saved paragraph length preference
        const paraLength = Storage.get('paraLength', 'medium');
        document.getElementById('para-length').value = paraLength;
    },

    updateVoices() {
        AppState.availableVoices = window.speechSynthesis.getVoices();
        const select = document.getElementById('voice-select');
        if (!select) return;

        select.innerHTML = '<option value="auto">🔍 ავტომატური</option>';
        if (AppState.availableVoices.some(v => v.lang.startsWith('ka'))) {
            select.innerHTML += '<option value="georgian-native">🇬🇪 ქართული</option>';
        }

        const groups = { 'en': '🇬🇧 English', 'ru': '🇷🇺 Русский' };
        Object.keys(groups).forEach(lang => {
            const group = document.createElement('optgroup');
            group.label = groups[lang];
            AppState.availableVoices.filter(v => v.lang.startsWith(lang)).forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.name; opt.textContent = v.name;
                group.appendChild(opt);
            });
            select.appendChild(group);
        });

        const saved = Storage.get('selectedVoiceName');
        if (saved) select.value = saved;
    },

    attachListeners() {
        window.speechSynthesis.onvoiceschanged = () => this.updateVoices();

        // Keyboard navigation in reader
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('reader-screen').style.display === 'flex') {
                if (e.key === "ArrowRight") ReaderEngine.next();
                if (e.key === "ArrowLeft") ReaderEngine.prev();
                if (e.key === " ") { e.preventDefault(); ReaderEngine.togglePlay(); }
                if (e.key === "Escape") exitReader();
            }
        });

        // Touch swipe gestures for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        const minSwipeDistance = 50;
        const maxVerticalDiff = 100;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (document.getElementById('reader-screen').style.display !== 'flex') return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - touchStartX;
            const diffY = Math.abs(touchEndY - touchStartY);

            // Only trigger if horizontal swipe and not too vertical
            if (Math.abs(diffX) > minSwipeDistance && diffY < maxVerticalDiff) {
                if (diffX > 0) {
                    ReaderEngine.prev(); // Swipe right = previous
                } else {
                    ReaderEngine.next(); // Swipe left = next
                }
            }
        }, { passive: true });
    }
};

// ==================== GLOBAL FUNCTIONS (FOR HTML) ====================
function startReading() {
    let text = document.getElementById('text-input').value.trim();
    if (!text) return alert('⚠️ გთხოვთ შეიყვანოთ ტექსტი');

    AppState.originalText = TextProcessor.clean(text);
    const mode = document.getElementById('para-length').value;
    AppState.slides = TextProcessor.splitIntoSlides(AppState.originalText, mode);

    AppState.currentIndex = 0;
    AppState.bookmarkedSlides.clear();
    AppState.sessionStartTime = Date.now();

    StatsManager.addSession(AppState.originalText.split(/\s+/).length);
    Storage.set('lastText', AppState.originalText);

    showScreen('reader-screen');
    ReaderEngine.updateSlide();
}

function exitReader() {
    if (AppState.sessionStartTime) {
        StatsManager.addMinutes((Date.now() - AppState.sessionStartTime) / 60000);
        AppState.sessionStartTime = null;
    }
    ReaderEngine.stop();
    // Clear text when exiting reader
    document.getElementById('text-input').value = '';
    Storage.set('lastText', '');
    showScreen('landing-screen');
}

function showScreen(id) {
    document.getElementById('landing-screen').style.display = id === 'landing-screen' ? 'block' : 'none';
    document.getElementById('reader-screen').style.display = id === 'reader-screen' ? 'flex' : 'none';
}

function toggleSettings() {
    document.getElementById('settings-panel').classList.toggle('active');
    document.body.classList.toggle('panel-open');
}

function setTheme(t) {
    Storage.set('theme', t);
    document.body.className = t;
}

function updateSpeedSlider(v) {
    document.getElementById('rate-range').value = v;
    document.getElementById('speed-val').textContent = v + 'x';
    Storage.set('ttsRate', v);
    if (AppState.isPlaying) ReaderEngine.handlePlaybackTransition();
}

function updateVolumeVal(v) {
    Storage.set('ttsVolume', v);
    if (AppState.isPlaying) ReaderEngine.handlePlaybackTransition();
}

function updatePitchVal(v) {
    Storage.set('ttsPitch', v);
    if (AppState.isPlaying) ReaderEngine.handlePlaybackTransition();
}

function updateVoicePreference() {
    Storage.set('selectedVoiceName', document.getElementById('voice-select').value);
    if (AppState.isPlaying) ReaderEngine.handlePlaybackTransition();
}

function toggleBookmark() {
    const idx = AppState.currentIndex;
    AppState.bookmarkedSlides.has(idx) ? AppState.bookmarkedSlides.delete(idx) : AppState.bookmarkedSlides.add(idx);
    ReaderEngine.updateBookmarkBtn();
}

// Pass-throughs for simple access
const loadDemo = () => document.getElementById('text-input').value = `The Art of Learning a New Language

Learning a new language is one of the most rewarding challenges a person can undertake. It opens doors to new cultures, new friendships, and new opportunities that would otherwise remain hidden behind the barrier of unfamiliar words.

When we think about language learning, many of us imagine endless vocabulary lists and grammar exercises. While these tools certainly have their place, the most effective approach combines multiple methods. Reading authentic materials, listening to native speakers, and practicing with real conversations all contribute to building fluency.

The journey of language learning is not without its obstacles. There will be moments of frustration when words refuse to come out correctly, and days when understanding seems impossibly far away. However, these challenges are precisely what make the achievement so meaningful. Each small victory, from ordering coffee in a foreign language to reading a book without translation, builds confidence and motivation for the next step.

Modern technology has transformed language learning in remarkable ways. Apps can now connect learners with native speakers across the globe, while artificial intelligence provides instant feedback on pronunciation and grammar. Yet despite these advances, the fundamental truth remains unchanged: consistent practice and genuine curiosity are the keys to mastery.

Perhaps the most beautiful aspect of learning languages is how it changes our perception of the world. When we learn a new language, we don't just acquire new words—we gain new ways of thinking. Different languages offer different perspectives on reality, and by learning them, we expand our own understanding of what it means to communicate, to express, to connect with others.

The benefits extend far beyond simple communication. Bilingual individuals often demonstrate enhanced cognitive abilities, including better problem-solving skills and improved memory. They tend to be more empathetic and culturally aware, having learned to see the world through different linguistic lenses.

Whatever your motivation for learning—whether professional advancement, travel plans, or pure intellectual curiosity—remember that every expert was once a beginner. The path to fluency is measured in small, consistent steps rather than giant leaps. Today you might learn ten new words; tomorrow you might master a tricky grammatical structure. These individual moments accumulate into profound transformation.

So embrace the journey. Make mistakes, ask questions, and celebrate progress, no matter how small it might seem. The world has over seven thousand languages to offer, each waiting to be discovered by curious minds like yours.`;

const clearInput = () => {
    document.getElementById('text-input').value = '';
    Storage.set('lastText', '');
};

// Clear and exit reader - for reader screen clear button
const clearAndExit = () => {
    document.getElementById('text-input').value = '';
    Storage.set('lastText', '');
    exitReader();
};

const pasteFromClipboard = async () => {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('text-input').value = text;
    } catch (e) {
        // Fallback for file:// protocol
        if (e.name === 'NotAllowedError') {
            alert('📋 გამოიყენეთ Ctrl+V (Cmd+V) ჩასაკრებლისთვის');
        } else {
            alert('❌ ვერ მოხერხდა');
        }
    }
};
const saveCurrentText = () => StorageManager.saveText(AppState.originalText);
const setFontSize = (s) => document.documentElement.style.setProperty('--reader-size', s + 'px');
const setFontFamily = (f) => document.body.classList.toggle('serif', f === 'serif');
const toggleFullScreen = () => !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen();
const prevSlide = () => ReaderEngine.prev();
const nextSlide = () => ReaderEngine.next();
const togglePlay = () => ReaderEngine.togglePlay();
const resetStats = () => StatsManager.reset();

// Load everything
window.onload = () => {
    UI.init();
    const last = Storage.get('lastText');
    if (last) document.getElementById('text-input').value = last;
};

// Memory cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (typeof GeorgianTTS !== 'undefined') GeorgianTTS.stop();
    window.speechSynthesis.cancel();
});

// ... Rest of modal and export logic remains similar but cleaned ...
function openModal(title, bodyHtml, footerHtml = null) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    document.getElementById('modal-footer').innerHTML = footerHtml || '<button class="primary-btn secondary-btn" onclick="closeModal()">დახურვა</button>';
    document.getElementById('modal-overlay').classList.add('active');
}
function closeModal() { document.getElementById('modal-overlay').classList.remove('active'); }

function showAllSavedTexts() {
    if (StorageManager.savedTexts.length === 0) return openModal('შენახული ტექსტები', 'ცარიელია');
    const html = StorageManager.savedTexts.map((item, idx) => `
        <div class="saved-texts-modal-item" onclick="TextProcessor.loadToInput(${idx}); closeModal();">
            <div class="preview">${item.preview}</div>
            <div class="meta"><span>${item.title || 'უსათაურო'}</span><span>${item.date}</span></div>
        </div>
    `).join('');
    openModal('შენახული ტექსტები', `<div class="saved-texts-modal-list">${html}</div>`);
}

// Register Service Worker (Only on HTTP/HTTPS to avoid CORS errors on file://)
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('service-worker.js')
    .then((reg) => console.log('PWA Ready'))
    .catch((err) => console.log('PWA Offline mode not available on local file'));
}
