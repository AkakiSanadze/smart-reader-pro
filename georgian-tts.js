// Georgian TTS Module - Fixed Loop issue
const GeorgianTTS = (function() {
    let nativeVoice = null;
    let audioControl = new Audio();
    
    function init() {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            nativeVoice = voices.find(v => v.lang.toLowerCase().includes('ka'));
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }
    
    function isGeorgian(text) {
        return /[\u10D0-\u10FF]/.test(text);
    }

    function speakWithGoogle(text, rate, volume, onEnd) {
        console.log("GeorgianTTS: Attempting Google TTS...");
        
        // Speed must be between 0 and 1 for Google
        const speed = rate > 1 ? 1 : (rate < 0.5 ? 0.5 : rate);
        // client=gtx is often more stable for local files
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ka&client=gtx&q=${encodeURIComponent(text)}&ttsspeed=${speed}`;
        
        audioControl.pause();
        audioControl.src = url;
        audioControl.volume = volume;
        
        audioControl.onended = () => {
            console.log("GeorgianTTS: Finished playing");
            if (onEnd) onEnd();
        };
        
        audioControl.onerror = (e) => {
            console.error("GeorgianTTS: Audio Error (Google might be blocking)");
            // Don't call onEnd here to prevent skipping loop
        };

        const playPromise = audioControl.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.warn("GeorgianTTS: Playback blocked by browser. User must click PLAY.");
                // IMPORTANT: Do NOT call onEnd() here
            });
        }
    }

    function stop() {
        audioControl.pause();
        audioControl.src = "";
    }
    
    return {
        init,
        isGeorgianText: isGeorgian,
        hasNativeGeorgianVoice: () => nativeVoice !== null,
        getNativeGeorgianVoice: () => nativeVoice,
        speakWithGoogle,
        stop
    };
})();

GeorgianTTS.init();
