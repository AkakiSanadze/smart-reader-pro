/* TTS Module - Hybrid (Web Speech API + Google TTS fallback) */

const TTS = (function() {
    const synth = window.speechSynthesis;
    let voices = [];
    let currentAudio = null;
    let isSpeaking = false;
    let onEndCallback = null;

    // Initialize - deferred to not block DOMContentLoaded
    function init() {
        // Only set up the listener, don't block on getVoices()
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = loadVoices;
        }
        // Load voices asynchronously when browser is idle
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(loadVoices, { timeout: 100 });
        } else {
            setTimeout(loadVoices, 0);
        }
    }

    // Load available voices
    function loadVoices() {
        voices = synth.getVoices();
        return voices;
    }

    // Get voices for UI
    function getVoices() {
        return voices;
    }

    // Check if text contains Georgian characters
    function isGeorgian(text) {
        return /[\u10D0-\u10FF]/.test(text);
    }

    // Check if native Georgian voice exists
    function hasNativeGeorgianVoice() {
        return voices.some(v => v.lang.toLowerCase().includes('ka'));
    }

    // Get native Georgian voice
    function getNativeGeorgianVoice() {
        return voices.find(v => v.lang.toLowerCase().includes('ka'));
    }

    // Speak using Web Speech API
    function speakNative(text, options = {}, onEnd) {
        if (synth.speaking) {
            synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);

        // Apply options
        if (options.voice) {
            utterance.voice = options.voice;
            utterance.lang = options.voice.lang;
        }
        utterance.rate = options.rate || 1;
        utterance.volume = options.volume || 1;
        utterance.pitch = options.pitch || 1;

        // Events
        utterance.onstart = () => {
            isSpeaking = true;
        };

        utterance.onend = () => {
            isSpeaking = false;
            if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
            isSpeaking = false;
            // Don't call onEnd for canceled/interrupted - they're expected when stopping
            if (e.error === 'interrupted' || e.error === 'canceled') {
                return;
            }
            console.error('TTS error:', e);
            if (onEnd) onEnd();
        };

        // Boundary event for word highlighting
        utterance.onboundary = (e) => {
            if (options.onBoundary && e.charIndex !== undefined) {
                options.onBoundary(e.charIndex);
            }
        };

        synth.speak(utterance);
        return utterance;
    }

    // Speak using Google TTS (fallback for Georgian)
    function speakGoogle(text, rate = 1, onEnd) {
        // Stop any current audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }

        // Clamp rate between 0.5 and 1 for Google TTS
        const speed = Math.max(0.5, Math.min(1, rate));

        // Build URL
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ka&client=gtx&q=${encodeURIComponent(text)}&ttsspeed=${speed}`;

        currentAudio = new Audio(url);
        isSpeaking = true;

        currentAudio.onended = () => {
            isSpeaking = false;
            currentAudio = null;
            if (onEnd) onEnd();
        };

        currentAudio.onerror = (e) => {
            console.error('Google TTS error:', e);
            isSpeaking = false;
            currentAudio = null;
            if (onEnd) onEnd();
        };

        currentAudio.play().catch(err => {
            console.warn('Google TTS playback blocked:', err);
            isSpeaking = false;
        });

        return currentAudio;
    }

    // Main speak function - auto-detects language and chooses method
    function speak(text, options = {}, onEnd) {
        stop();
        onEndCallback = onEnd;

        const textIsGeorgian = isGeorgian(text);
        const hasNativeKa = hasNativeGeorgianVoice();

        // If Georgian text and we have native voice, use it
        if (textIsGeorgian && hasNativeKa && options.voice?.lang?.includes('ka')) {
            return speakNative(text, options, onEnd);
        }

        // If Georgian but no native voice, use Google
        if (textIsGeorgian && !hasNativeKa) {
            return speakGoogle(text, options.rate, onEnd);
        }

        // Otherwise use Web Speech API
        return speakNative(text, options, onEnd);
    }

    // Stop speaking
    function stop() {
        // Stop Web Speech
        if (synth.speaking) {
            synth.cancel();
        }

        // Stop Google TTS audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.src = '';
            currentAudio = null;
        }

        isSpeaking = false;
    }

    // Check if currently speaking
    function speaking() {
        return isSpeaking || synth.speaking;
    }

    // Auto-select voice based on text language
    function autoSelectVoice(text) {
        const lang = detectLanguage(text);

        // Try to find matching voice
        const voice = voices.find(v =>
            v.lang.toLowerCase().startsWith(lang)
        );

        return voice || voices[0];
    }

    // Detect language from text
    function detectLanguage(text) {
        const ka = (text.match(/[\u10D0-\u10FF]/g) || []).length;
        const ru = (text.match(/[\u0400-\u04FF]/g) || []).length;
        const en = (text.match(/[a-zA-Z]/g) || []).length;

        if (ka > (ru + en) * 0.3) return 'ka';
        if (ru > en) return 'ru';
        return 'en';
    }

    // Populate voice selector - only KA, RU, EN
    function populateVoiceSelector(selectElement) {
        // Clear existing options
        selectElement.innerHTML = '<option value="auto">🎯 ავტომატური ხმა</option>';

        // Helper to find best voice for a language
        const findBestVoice = (langPatterns) => {
            for (const pattern of langPatterns) {
                const found = voices.find(v =>
                    v.name.includes(pattern) || v.lang.includes(pattern)
                );
                if (found) return found;
            }
            return voices.find(v => v.lang.startsWith(langPatterns[0].slice(0, 2)));
        };

        // Add Georgian option if available
        if (hasNativeGeorgianVoice()) {
            const kaVoice = getNativeGeorgianVoice();
            const opt = document.createElement('option');
            opt.value = kaVoice.name;
            opt.textContent = `🇬🇪 ქართული`;
            selectElement.appendChild(opt);
        }

        // Add Russian voice
        const ruVoice = findBestVoice(['Milena', 'Mikhail', 'ru-RU', 'Russian']);
        if (ruVoice) {
            const opt = document.createElement('option');
            opt.value = ruVoice.name;
            opt.textContent = `🇷🇺 Русский`;
            selectElement.appendChild(opt);
        }

        // Add English voice
        const enVoice = findBestVoice(['Daniel', 'Samantha', 'Alex', 'Karen', 'en-US', 'en-GB']);
        if (enVoice) {
            const opt = document.createElement('option');
            opt.value = enVoice.name;
            opt.textContent = `🇬🇧 English`;
            selectElement.appendChild(opt);
        }

        // Add more voices option (collapsed)
        const moreGroup = document.createElement('optgroup');
        moreGroup.label = '── სხვა ხმები ──';

        // Get all voices for selected languages
        const langCodes = ['ka', 'ru', 'en'];
        langCodes.forEach(lang => {
            const langVoices = voices.filter(v => v.lang.startsWith(lang)).slice(0, 5);
            langVoices.forEach(voice => {
                const opt = document.createElement('option');
                opt.value = voice.name;
                opt.textContent = voice.name.length > 25 ?
                    voice.name.slice(0, 22) + '...' : voice.name;
                moreGroup.appendChild(opt);
            });
        });

        if (moreGroup.children.length > 0) {
            selectElement.appendChild(moreGroup);
        }
    }

    // Get voice by name
    function getVoiceByName(name) {
        return voices.find(v => v.name === name);
    }

    // Initialize on load
    init();

    // Public API
    return {
        init,
        getVoices,
        speak,
        stop,
        speaking,
        isGeorgian,
        hasNativeGeorgianVoice,
        getNativeGeorgianVoice,
        autoSelectVoice,
        detectLanguage,
        populateVoiceSelector,
        getVoiceByName
    };
})();