/* Reader Module - TTS and navigation controls */

const Reader = {
    // State
    state: {
        text: '',
        slides: [],
        currentSlide: 0,
        isPlaying: false,
        focusMode: false
    },

    // DOM elements (cached)
    elements: null,

    // Initialize with DOM elements
    init(elements) {
        this.elements = elements;
    },

    // Start reading - split text and show reader
    start(text) {
        if (!text || !text.trim()) {
            return { success: false, message: 'შეიყვანეთ ტექსტი' };
        }

        // Clean and split text
        this.state.text = TextProcessor.clean(text);
        this.state.slides = TextProcessor.splitIntoSlides(this.state.text);
        this.state.currentSlide = 0;
        this.state.isPlaying = false;
        this.state.focusMode = false;

        if (this.state.slides.length === 0) {
            return { success: false, message: 'ტექსტი ცარიელია' };
        }

        // Add to history
        const wordCount = TextProcessor.getWordCount(this.state.text);
        HistoryManager.add(this.state.text, wordCount);

        return { success: true };
    },

    // Continue reading from saved progress
    continue() {
        const progress = ProgressManager.get();
        if (!progress) return null;

        this.state.text = progress.text;
        this.state.slides = TextProcessor.splitIntoSlides(progress.text);
        this.state.currentSlide = progress.slideIndex;
        this.state.isPlaying = false;
        this.state.focusMode = false;

        return progress;
    },

    // Get current slide text
    getCurrentSlideText() {
        return this.state.slides[this.state.currentSlide] || '';
    },

    // Get current slide index (1-based for display)
    getCurrentSlideIndex() {
        return this.state.currentSlide + 1;
    },

    // Get total slides
    getTotalSlides() {
        return this.state.slides.length;
    },

    // Get progress percentage
    getProgressPercent() {
        const total = this.state.slides.length;
        const current = this.state.currentSlide + 1;
        return Math.round((current / total) * 100);
    },

    // Navigation
    next() {
        if (this.state.currentSlide < this.state.slides.length - 1) {
            this.state.currentSlide++;
            return true;
        } else if (this.state.isPlaying) {
            // End of text
            this.stop();
            return 'end';
        }
        return false;
    },

    previous() {
        if (this.state.currentSlide > 0) {
            this.state.currentSlide--;
            return true;
        }
        return false;
    },

    goTo(index) {
        if (index >= 0 && index < this.state.slides.length) {
            this.state.currentSlide = index;
            return true;
        }
        return false;
    },

    // Play/Stop controls
    play(voiceSelect, speedSlider, onBoundary) {
        const text = this.getCurrentSlideText();
        if (!text) return;

        this.state.isPlaying = true;

        const voiceName = voiceSelect.value;
        const rate = parseFloat(speedSlider.value);

        const options = {
            rate: rate,
            volume: 1,
            pitch: 1,
            onBoundary: onBoundary
        };

        if (voiceName !== 'auto') {
            options.voice = TTS.getVoiceByName(voiceName);
        } else {
            options.voice = TTS.autoSelectVoice(text);
        }

        TTS.speak(text, options, () => {
            if (this.state.isPlaying) {
                const result = this.next();
                if (result === 'end') {
                    ProgressManager.clear();
                    return 'end';
                } else if (result) {
                    // Continue to next slide
                    this.play(voiceSelect, speedSlider, onBoundary);
                }
            }
        });

        // Check if speech was blocked
        setTimeout(() => {
            if (this.state.isPlaying && !TTS.speaking()) {
                return 'blocked';
            }
        }, 1000);
    },

    stop() {
        this.state.isPlaying = false;
        TTS.stop();
    },

    togglePlay() {
        return this.state.isPlaying ? this.stop() : 'playing';
    },

    // Focus mode
    toggleFocusMode() {
        this.state.focusMode = !this.state.focusMode;
        document.body.classList.toggle('focus-mode', this.state.focusMode);
        return this.state.focusMode;
    },

    // Save progress
    saveProgress() {
        ProgressManager.save(
            this.state.text,
            this.state.currentSlide,
            this.state.slides.length
        );
    },

    // Check if has content
    hasContent() {
        return this.state.text && this.state.slides.length > 0;
    },

    // Check if at end
    isAtEnd() {
        return this.state.currentSlide >= this.state.slides.length - 1;
    },

    // Check if at start
    isAtStart() {
        return this.state.currentSlide === 0;
    }
};
