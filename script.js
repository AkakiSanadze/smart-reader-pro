// Smart Reader Pro - JavaScript

// Global variables
let slides = [];
let currentIndex = 0;
let isPlaying = false;
let originalText = '';
const synth = window.speechSynthesis;
let currentUtterance = null;
let availableVoices = [];
let sessionStartTime = null;
let bookmarkedSlides = new Set();

// Stats
let stats = {
    totalTexts: 0,
    totalMinutes: 0,
    totalWords: 0,
    totalSessions: 0
};

// Saved texts
let savedTexts = [];

// Load stats from localStorage
function loadStats() {
    const saved = localStorage.getItem('readerStats');
    if (saved) {
        stats = JSON.parse(saved);
        updateStatsDisplay();
    }
}

// Save stats to localStorage
function saveStats() {
    localStorage.setItem('readerStats', JSON.stringify(stats));
    updateStatsDisplay();
}

// Update stats display on page
function updateStatsDisplay() {
    document.getElementById('stat-texts').textContent = stats.totalTexts;
    document.getElementById('stat-time').textContent = Math.round(stats.totalMinutes);
    document.getElementById('stat-words').textContent = stats.totalWords.toLocaleString();
    document.getElementById('stat-sessions').textContent = stats.totalSessions;
}

// Load saved texts from localStorage
function loadSavedTexts() {
    const saved = localStorage.getItem('savedTexts');
    if (saved) {
        savedTexts = JSON.parse(saved);
        renderSavedTexts();
    }
}

// Render saved texts list
function renderSavedTexts() {
    const container = document.getElementById('saved-texts-list');
    if (savedTexts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 48px; margin-bottom: 12px;">📚</div>
                <div>ჯერ არ გაქვთ შენახული ტექსტები</div>
            </div>
        `;
        return;
    }

    container.innerHTML = savedTexts.slice(0, 5).map((item, idx) => `
        <div class="saved-text-item" onclick="loadSavedText(${idx})">
            <div class="saved-text-preview">${item.preview}</div>
            <div class="saved-text-meta">
                <span>${item.date}</span>
                <span>${item.words} სიტყვა</span>
            </div>
            <button class="saved-text-delete" onclick="deleteSavedText(${idx}, event)">✕</button>
        </div>
    `).join('');
}

// Save current text to localStorage
function saveCurrentText() {
    if (!originalText) return;
    
    const preview = originalText.substring(0, 80) + (originalText.length > 80 ? '...' : '');
    const words = originalText.split(/\s+/).length;
    const date = new Date().toLocaleDateString('ka-GE');
    
    const savedItem = {
        text: originalText,
        preview: preview,
        words: words,
        date: date,
        timestamp: Date.now()
    };

    savedTexts.unshift(savedItem);
    if (savedTexts.length > 20) savedTexts = savedTexts.slice(0, 20);
    
    localStorage.setItem('savedTexts', JSON.stringify(savedTexts));
    renderSavedTexts();
    
    alert('✅ ტექსტი შენახულია!');
}

// Load a saved text
function loadSavedText(index) {
    const item = savedTexts[index];
    document.getElementById('text-input').value = item.text;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Load demo text
function loadDemo() {
    const demoText = `საქართველო არის ქვეყანა კავკასიაში, რომელიც ცნობილია თავისი მდიდარი ისტორიით და კულტურით. 

ქართული ენა ერთ-ერთი უძველესი ენაა მსოფლიოში და აქვს საკუთარი უნიკალური დამწერლობა. ქართული ალფაბეტი შედგება 33 ასოსგან და დაახლოებით 1500 წლის ისტორია აქვს.

თბილისი, საქართველოს დედაქალაქი, არის ულამაზესი ქალაქი, სადაც თანამედროვე არქიტექტურა ხვდება ძველ ისტორიულ შენობებს. ქალაქი განთავსებულია მტკვრის ნაპირებზე და ცნობილია თავისი თბილი ამბავით და სტუმართმოყვარეობით.

ქართული კუჰნია ერთ-ერთი ყველაზე საინტერესოა მსოფლიოში. ხინკალი, ხაჭაპური, და ლობიო მხოლოდ რამდენიმე მაგალითია იმ გემრიელი კერძებისა, რომლებიც საქართველოს ცნობილს ხდის.`;
    
    document.getElementById('text-input').value = demoText;
}

// Paste text from clipboard
async function pasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('text-input').value = text;
    } catch (err) {
        alert('❌ ბუფერიდან წაკითხვა ვერ მოხერხდა');
    }
}

// Load available TTS voices
function loadVoices() {
    availableVoices = synth.getVoices();
    const select = document.getElementById('voice-select');
    select.innerHTML = '<option value="auto">🔍 ავტომატური (English/Russian)</option>';
    
    // Filter and group voices by language (English/Russian only)
    const enVoices = availableVoices.filter(v => v.lang.toLowerCase().startsWith('en'));
    const ruVoices = availableVoices.filter(v => v.lang.toLowerCase().startsWith('ru'));
    const otherVoices = availableVoices.filter(v => {
        const lang = v.lang.toLowerCase();
        return !lang.startsWith('en') && !lang.startsWith('ru');
    });
    
    // Add English voices
    if (enVoices.length > 0) {
        const enGroup = document.createElement('optgroup');
        enGroup.label = '🇬🇧 English';
        enVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = voice.name;
            enGroup.appendChild(option);
        });
        select.appendChild(enGroup);
    }
    
    // Add Russian voices
    if (ruVoices.length > 0) {
        const ruGroup = document.createElement('optgroup');
        ruGroup.label = '🇷🇺 Русский';
        ruVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = voice.name;
            ruGroup.appendChild(option);
        });
        select.appendChild(ruGroup);
    }
    
    // Add other voices (collapsed)
    if (otherVoices.length > 0) {
        const otherGroup = document.createElement('optgroup');
        otherGroup.label = '🌍 Other Languages';
        otherVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            otherGroup.appendChild(option);
        });
        select.appendChild(otherGroup);
    }
    
    const saved = localStorage.getItem('selectedVoiceName');
    if (saved) select.value = saved;
}

// Initialize voices
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
}

// Clean markdown from text
function cleanMarkdown(text) {
    // Remove bold and italic markdown
    text = text.replace(/\*\*(.+?)\*\*/g, '$1'); // **bold**
    text = text.replace(/\*(.+?)\*/g, '$1');     // *italic*
    text = text.replace(/__(.+?)__/g, '$1');     // __bold__
    text = text.replace(/_(.+?)_/g, '$1');       // _italic_
    
    // Remove code blocks and inline code
    text = text.replace(/```[\s\S]*?```/g, '');  // ```code blocks```
    text = text.replace(/`([^`]+)`/g, '$1');     // `inline code`
    
    // Remove links but keep text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // [text](url)
    text = text.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1'); // [text][ref]
    
    // Remove images
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, ''); // ![alt](url)
    
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, '');
    
    // Remove headings markers
    text = text.replace(/^#{1,6}\s+/gm, ''); // # Heading
    
    // Remove blockquotes
    text = text.replace(/^>\s*/gm, '');
    
    // Remove horizontal rules
    text = text.replace(/^(---|___|\*\*\*)\s*$/gm, '');
    
    // Remove strikethrough
    text = text.replace(/~~(.+?)~~/g, '$1');
    
    // Clean up multiple spaces and empty lines
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]+/g, ' ');
    
    return text.trim();
}

// Start reading
function startReading() {
    let text = document.getElementById('text-input').value.trim();
    if (!text) {
        alert('⚠️ გთხოვთ შეიყვანოთ ტექსტი');
        return;
    }

    // Clean markdown from text
    text = cleanMarkdown(text);
    
    originalText = text;
    const paraLength = document.getElementById('para-length').value;
    const paragraphs = text.split(/\n\n+/);
    
    slides = [];
    paragraphs.forEach(p => {
        p = p.trim();
        if (!p) return;

        if (paraLength === 'short') {
            const sentences = p.match(/[^.!?]+[.!?]+/g) || [p];
            sentences.forEach((s, i) => {
                if (i % 2 === 0) {
                    const chunk = sentences.slice(i, i + 2).join(' ').trim();
                    if (chunk) slides.push(chunk);
                }
            });
        } else if (paraLength === 'medium') {
            const sentences = p.match(/[^.!?]+[.!?]+/g) || [p];
            let chunk = '';
            sentences.forEach((s, i) => {
                if (chunk && (i % 4 === 0)) {
                    slides.push(chunk.trim());
                    chunk = s;
                } else {
                    chunk += s;
                }
            });
            if (chunk) slides.push(chunk.trim());
        } else {
            slides.push(p);
        }
    });

    currentIndex = 0;
    bookmarkedSlides.clear();
    sessionStartTime = Date.now();
    
    stats.totalTexts++;
    stats.totalSessions++;
    stats.totalWords += text.split(/\s+/).length;
    saveStats();
    
    localStorage.setItem('lastText', originalText);
    showScreen('reader-screen');
    updateSlide();
}

// Update current slide
function updateSlide() {
    const slideContainer = document.getElementById('slide-text');
    slideContainer.style.opacity = '0';
    
    setTimeout(() => {
        const text = slides[currentIndex];
        const words = text.split(/(\s+)/);
        let charCount = 0;
        
        const html = words.map(word => {
            const start = charCount;
            const len = word.length;
            charCount += len;
            if (!word.trim()) return word;
            return `<span class="word-span" data-start="${start}" data-len="${len}">${word}</span>`;
        }).join('');
        
        slideContainer.innerHTML = html;
        slideContainer.style.opacity = '1';
        
        // Update counter with percentage
        const percent = Math.round(((currentIndex + 1) / slides.length) * 100);
        document.getElementById('counter').innerHTML = `
            <span>${currentIndex + 1} / ${slides.length}</span>
            <span class="progress-percentage">${percent}%</span>
        `;
        
        document.getElementById('progress-fill').style.width = percent + '%';
        
        updateBookmarkButton();
    }, 100);
}

// Go to next slide
function nextSlide() {
    if (currentIndex < slides.length - 1) {
        currentIndex++;
        if (isPlaying) {
            if (currentUtterance) currentUtterance.onend = null;
            synth.cancel();
            updateSlide();
            setTimeout(() => { if (isPlaying) readCurrentSlide(); }, 300);
        } else {
            updateSlide();
        }
    } else if (isPlaying) {
        stopPlayback();
    }
}

// Go to previous slide
function prevSlide() {
    if (currentIndex > 0) {
        currentIndex--;
        if (isPlaying) {
            if (currentUtterance) currentUtterance.onend = null;
            synth.cancel();
            updateSlide();
            setTimeout(() => { if (isPlaying) readCurrentSlide(); }, 300);
        } else {
            updateSlide();
        }
    }
}

// Seek to position in slides
function seekToPosition(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const newIndex = Math.floor(percent * slides.length);
    
    if (newIndex !== currentIndex) {
        currentIndex = Math.max(0, Math.min(newIndex, slides.length - 1));
        if (isPlaying) {
            if (currentUtterance) currentUtterance.onend = null;
            synth.cancel();
            updateSlide();
            setTimeout(() => { if (isPlaying) readCurrentSlide(); }, 300);
        } else {
            updateSlide();
        }
    }
}

// Update progress tooltip
function updateProgressTooltip(event) {
    const tooltip = document.getElementById('progress-tooltip');
    const rect = event.currentTarget.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const slideNum = Math.floor(percent * slides.length) + 1;
    const clampedSlide = Math.max(1, Math.min(slideNum, slides.length));
    
    tooltip.textContent = `Slide ${clampedSlide} / ${slides.length}`;
    tooltip.style.left = `${event.clientX - rect.left}px`;
    tooltip.classList.add('visible');
}

// Hide progress tooltip
function hideProgressTooltip() {
    const tooltip = document.getElementById('progress-tooltip');
    tooltip.classList.remove('visible');
}

// Toggle bookmark
function toggleBookmark() {
    if (bookmarkedSlides.has(currentIndex)) {
        bookmarkedSlides.delete(currentIndex);
    } else {
        bookmarkedSlides.add(currentIndex);
    }
    updateBookmarkButton();
}

// Update bookmark button
function updateBookmarkButton() {
    const btn = document.getElementById('bookmark-btn');
    btn.textContent = bookmarkedSlides.has(currentIndex) ? '🔖' : '🏷️';
}

// Show screen
function showScreen(id) {
    document.getElementById('landing-screen').style.display = id === 'landing-screen' ? 'block' : 'none';
    document.getElementById('reader-screen').style.display = id === 'reader-screen' ? 'flex' : 'none';
}

// Exit reader
function exitReader() {
    if (sessionStartTime) {
        const sessionMinutes = (Date.now() - sessionStartTime) / 60000;
        stats.totalMinutes += sessionMinutes;
        saveStats();
        sessionStartTime = null;
    }
    
    stopPlayback();
    showScreen('landing-screen');
}

// Toggle settings panel
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('active');
    
    // Prevent body scroll on mobile when panel is open
    if (panel.classList.contains('active')) {
        document.body.classList.add('panel-open');
    } else {
        document.body.classList.remove('panel-open');
    }
}

// Set theme
function setTheme(t) {
    localStorage.setItem('theme', t);
    document.body.className = t;
}

// Update theme buttons
function updateThemeButtons(btn) {
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// Set font size
function setFontSize(s) {
    document.documentElement.style.setProperty('--font-size', s);
}

// Set font family
function setFontFamily(f) {
    document.body.classList.toggle('serif', f === 'serif');
}

// Toggle fullscreen
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Set TTS speed
function setSpeed(val) {
    // Update hidden input
    document.getElementById('rate-range').value = val;
    
    // Update slider value if it exists
    const slider = document.getElementById('speed-slider');
    if (slider) {
        slider.value = val;
        updateSpeedDisplay(val);
    }
    
    localStorage.setItem('ttsRate', val);
    
    if (isPlaying) {
        if (currentUtterance) currentUtterance.onend = null;
        synth.cancel();
        readCurrentSlide();
    }
}

// Update speed slider display
function updateSpeedSlider(val) {
    const speedVal = parseFloat(val);
    document.getElementById('rate-range').value = speedVal;
    updateSpeedDisplay(speedVal);
    localStorage.setItem('ttsRate', speedVal);
    
    if (isPlaying) {
        if (currentUtterance) currentUtterance.onend = null;
        synth.cancel();
        readCurrentSlide();
    }
}

// Update speed display value
function updateSpeedDisplay(val) {
    const display = document.getElementById('speed-val');
    if (display) {
        // Round to 2 decimal places, but remove trailing zeros
        const formatted = parseFloat(val).toFixed(val % 1 === 0 ? 0 : 2);
        display.textContent = formatted + 'x';
    }
}

// Update speed value (legacy)
function updateSpeedVal(val) {
    setSpeed(parseFloat(val));
}

// Update volume value
function updateVolumeVal(val) {
    document.getElementById('volume-val').innerText = Math.round(val * 100);
    localStorage.setItem('ttsVolume', val);
    if (isPlaying) {
        if (currentUtterance) currentUtterance.onend = null;
        synth.cancel();
        readCurrentSlide();
    }
}

// Update pitch value
function updatePitchVal(val) {
    document.getElementById('pitch-val').innerText = val;
    localStorage.setItem('ttsPitch', val);
    if (isPlaying) {
        if (currentUtterance) currentUtterance.onend = null;
        synth.cancel();
        readCurrentSlide();
    }
}

// Update voice preference
function updateVoicePreference() {
    const val = document.getElementById('voice-select').value;
    localStorage.setItem('selectedVoiceName', val);
    if (isPlaying) {
        if (currentUtterance) currentUtterance.onend = null;
        synth.cancel();
        readCurrentSlide();
    }
}

// Toggle play/pause
function togglePlay() {
    if (isPlaying) {
        stopPlayback();
    } else {
        startPlayback();
    }
}

// Start playback
function startPlayback() {
    isPlaying = true;
    document.getElementById('play-btn').classList.add('playing');
    document.getElementById('play-icon').style.display = 'none';
    document.getElementById('pause-icon').style.display = 'block';
    readCurrentSlide();
}

// Stop playback
function stopPlayback() {
    isPlaying = false;
    synth.cancel();
    document.getElementById('play-btn').classList.remove('playing');
    document.getElementById('play-icon').style.display = 'block';
    document.getElementById('pause-icon').style.display = 'none';
    removeHighlights();
    
    // Hide voice badge
    const voiceBadge = document.getElementById('current-voice-display');
    if (voiceBadge) voiceBadge.style.display = 'none';
}

// Detect language
function detectLanguage(text) {
    const ruCount = (text.match(/[\u0400-\u04FF]/g) || []).length;
    const enCount = (text.match(/[a-zA-Z]/g) || []).length;
    const total = ruCount + enCount;
    
    if (total === 0) return 'en';
    
    const ruRatio = ruCount / total;
    const enRatio = enCount / total;
    
    // Return Russian if more than 30% Cyrillic chars
    if (ruRatio > 0.3) return 'ru';
    // Default to English
    return 'en';
}

// Remove word highlights
function removeHighlights() {
    document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
}

// Read current slide with TTS
function readCurrentSlide() {
    if (synth.speaking) synth.cancel();
    removeHighlights();
    
    const text = slides[currentIndex];
    currentUtterance = new SpeechSynthesisUtterance(text);

    const savedVoiceName = document.getElementById('voice-select').value;
    let selectedVoice = null;
    let finalLang = 'en-US';

    // Detect language (English or Russian only)
    const detected = detectLanguage(text);

    if (savedVoiceName !== "auto") {
        // Use saved voice preference
        selectedVoice = availableVoices.find(v => v.name === savedVoiceName);
        if (selectedVoice) finalLang = selectedVoice.lang;
    } else {
        // Auto-select voice based on detected language
        const langPrefix = detected === 'ru' ? 'ru' : 'en';
        const langCode = detected === 'ru' ? 'ru-RU' : 'en-US';
        
        // Try to find best matching voice
        selectedVoice = availableVoices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
        
        // Fallback to any voice if no match found
        if (!selectedVoice && availableVoices.length > 0) {
            selectedVoice = availableVoices[0];
        }
        
        finalLang = selectedVoice ? selectedVoice.lang : langCode;
    }

    if (selectedVoice) currentUtterance.voice = selectedVoice;
    currentUtterance.lang = finalLang;
    currentUtterance.rate = parseFloat(document.getElementById('rate-range').value);
    currentUtterance.volume = parseFloat(document.getElementById('volume-range').value);
    currentUtterance.pitch = parseFloat(document.getElementById('pitch-range').value);

    // Show current voice badge
    const voiceBadge = document.getElementById('current-voice-display');
    if (voiceBadge && selectedVoice) {
        voiceBadge.textContent = selectedVoice.name.split(' ')[0]; // Short name
        voiceBadge.style.display = 'block';
    }

    currentUtterance.onboundary = (event) => {
        if (event.charIndex !== undefined) {
            removeHighlights();
            const spans = document.querySelectorAll('.word-span');
            for (let span of spans) {
                const start = parseInt(span.getAttribute('data-start'));
                const len = parseInt(span.getAttribute('data-len'));
                if (event.charIndex >= start && event.charIndex < start + len + 1) {
                    span.classList.add('highlight');
                    // Smooth scroll word to center of viewport
                    const contentArea = document.querySelector('.content-area');
                    const spanRect = span.getBoundingClientRect();
                    const contentRect = contentArea.getBoundingClientRect();
                    const scrollTop = spanRect.top - contentRect.top - (contentRect.height / 2) + (spanRect.height / 2);
                    contentArea.scrollBy({ top: scrollTop, behavior: 'smooth' });
                    break;
                }
            }
        }
    };

    currentUtterance.onend = () => {
        removeHighlights();
        if (isPlaying) {
            if (currentIndex < slides.length - 1) {
                currentIndex++;
                updateSlide();
                setTimeout(() => { if (isPlaying) readCurrentSlide(); }, 500);
            } else {
                stopPlayback();
            }
        }
    };

    currentUtterance.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') return;
        console.error("TTS Error:", e);
        stopPlayback();
    };

    synth.speak(currentUtterance);
}

// Reset stats
function resetStats() {
    if (confirm('დარწმუნებული ხართ რომ გსურთ სტატისტიკის გასუფთავება?')) {
        stats = {
            totalTexts: 0,
            totalMinutes: 0,
            totalWords: 0,
            totalSessions: 0
        };
        saveStats();
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (document.getElementById('reader-screen').style.display === 'flex') {
        if (e.key === "ArrowRight") nextSlide();
        if (e.key === "ArrowLeft") prevSlide();
        if (e.key === " ") { e.preventDefault(); togglePlay(); }
        if (e.key === "Escape") exitReader();
        if (e.key === "b" || e.key === "B") toggleBookmark();
    }
});

// Initialize on page load
window.onload = () => {
    loadStats();
    loadSavedTexts();
    
    const saved = localStorage.getItem('lastText');
    if (saved) document.getElementById('text-input').value = saved;
    
    const savedTheme = localStorage.getItem('theme') || '';
    document.getElementById('theme-select').value = savedTheme;
    setTheme(savedTheme);
    
    // Load audio settings
    const savedRate = localStorage.getItem('ttsRate') || '1';
    const rate = parseFloat(savedRate);
    document.getElementById('rate-range').value = rate;
    
    // Initialize slider and display
    const speedSlider = document.getElementById('speed-slider');
    if (speedSlider) {
        speedSlider.value = rate;
        updateSpeedDisplay(rate);
    }
    
    const savedVolume = localStorage.getItem('ttsVolume');
    if (savedVolume) {
        document.getElementById('volume-range').value = savedVolume;
        document.getElementById('volume-val').innerText = Math.round(savedVolume * 100);
    }
    
    const savedPitch = localStorage.getItem('ttsPitch');
    if (savedPitch) {
        document.getElementById('pitch-range').value = savedPitch;
        document.getElementById('pitch-val').innerText = savedPitch;
    }
    
    loadVoices();
};

// ==================== DATA MANAGEMENT FUNCTIONS ====================

// Modal functions
function openModal(title, bodyHtml, footerHtml = null) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHtml;
    if (footerHtml) {
        document.getElementById('modal-footer').innerHTML = footerHtml;
    } else {
        document.getElementById('modal-footer').innerHTML = '<button class="primary-btn secondary-btn" onclick="closeModal()">დახურვა</button>';
    }
    document.getElementById('modal-overlay').classList.add('active');
}

function closeModal(event) {
    if (!event || event.target === document.getElementById('modal-overlay') || event.target.classList.contains('modal-close') || event.target.textContent === 'დახურვა') {
        document.getElementById('modal-overlay').classList.remove('active');
    }
}

// Show all saved texts modal
function showAllSavedTexts() {
    if (savedTexts.length === 0) {
        openModal('შენახული ტექსტები', '<div class="bookmark-empty">📚<br><br>ჯერ არ გაქვთ შენახული ტექსტები</div>');
        return;
    }

    const listHtml = savedTexts.map((item, idx) => `
        <div class="saved-texts-modal-item" onclick="loadSavedText(${idx}); closeModal();">
            <div class="preview">${item.preview}</div>
            <div class="meta">
                <span>${item.date}</span>
                <span>${item.words} სიტყვა</span>
            </div>
        </div>
    `).join('');

    openModal('შენახული ტექსტები (' + savedTexts.length + ')', 
        '<div class="saved-texts-modal-list">' + listHtml + '</div>',
        '<button class="primary-btn danger-btn" onclick="clearAllSavedTexts()"><span>🗑️</span><span>ყველას წაშლა</span></button>'
    );
}

// Delete single saved text
function deleteSavedText(index, event) {
    event.stopPropagation();
    if (confirm('გსურთ ამ ტექსტის წაშლა?')) {
        savedTexts.splice(index, 1);
        localStorage.setItem('savedTexts', JSON.stringify(savedTexts));
        renderSavedTexts();
        // Refresh modal if open
        if (document.getElementById('modal-overlay').classList.contains('active')) {
            showAllSavedTexts();
        }
    }
}

// Clear all saved texts
function clearAllSavedTexts() {
    if (savedTexts.length === 0) {
        alert('📚 შენახული ტექსტები არ არის');
        return;
    }
    if (confirm('გსურთ ყველა შენახული ტექსტის წაშლა?\nთქვენ გაქვთ ' + savedTexts.length + ' ტექსტი.')) {
        savedTexts = [];
        localStorage.removeItem('savedTexts');
        renderSavedTexts();
        closeModal();
        alert('✅ ყველაფერი წაიშალა');
    }
}

// Show bookmarks manager
function showBookmarksManager() {
    if (!originalText || bookmarkedSlides.size === 0) {
        openModal('სანიშნეები', '<div class="bookmark-empty">🔖<br><br>სანიშნეები არ არის<br><br>გამოიყენეთ B ღილაკი სანიშნის დასაყენებლად</div>');
        return;
    }

    const bookmarksArray = Array.from(bookmarkedSlides).sort((a, b) => a - b);
    const listHtml = bookmarksArray.map(slideNum => `
        <div class="bookmark-item" onclick="goToBookmark(${slideNum})">
            <span>Slide ${slideNum + 1}</span>
            <span class="slide-num">📄 ${slides[slideNum] ? slides[slideNum].substring(0, 30) + '...' : '---'}</span>
        </div>
    `).join('');

    openModal('სანიშნეები (' + bookmarkedSlides.size + ')', 
        '<div class="bookmarks-list">' + listHtml + '</div>',
        '<button class="primary-btn danger-btn" onclick="clearAllBookmarks()"><span>🗑️</span><span>ყველას წაშლა</span></button>'
    );
}

// Go to specific bookmark
function goToBookmark(slideNum) {
    currentIndex = slideNum;
    updateSlide();
    closeModal();
}

// Clear all bookmarks
function clearAllBookmarks() {
    if (confirm('გსურთ ყველა სანიშნის წაშლა?')) {
        bookmarkedSlides.clear();
        updateBookmarkButton();
        closeModal();
        alert('✅ სანიშნეები წაიშალა');
    }
}

// Show stats modal
function showStatsModal() {
    loadStats(); // Refresh stats
    const html = `
        <div class="stats-modal-grid">
            <div class="stats-modal-item">
                <div class="value">${stats.totalTexts}</div>
                <div class="label">ტექსტი</div>
            </div>
            <div class="stats-modal-item">
                <div class="value">${Math.round(stats.totalMinutes)}</div>
                <div class="label">წუთი</div>
            </div>
            <div class="stats-modal-item">
                <div class="value">${stats.totalWords.toLocaleString()}</div>
                <div class="label">სიტყვა</div>
            </div>
            <div class="stats-modal-item">
                <div class="value">${stats.totalSessions}</div>
                <div class="label">სესია</div>
            </div>
        </div>
    `;
    openModal('სტატისტიკა', html);
}

// Export data to JSON file
function exportData() {
    const data = {
        stats: stats,
        savedTexts: savedTexts,
        settings: {
            theme: localStorage.getItem('theme') || '',
            ttsRate: localStorage.getItem('ttsRate') || '1',
            ttsVolume: localStorage.getItem('ttsVolume') || '1',
            ttsPitch: localStorage.getItem('ttsPitch') || '1',
            selectedVoiceName: localStorage.getItem('selectedVoiceName') || 'auto',
            fontSize: localStorage.getItem('fontSize') || '28px',
            fontFamily: localStorage.getItem('fontFamily') || 'sans',
            paraLength: localStorage.getItem('paraLength') || 'medium'
        },
        exportDate: new Date().toISOString(),
        version: 'Smart Reader Pro v3'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smart-reader-backup-' + new Date().toISOString().split('T')[0] + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('✅ მონაცემები გადაკეთდა ფაილად!');
}

// Import data from JSON file
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data
            if (!data.version || !data.version.includes('Smart Reader')) {
                if (!confirm('⚠️ ეს ფაილი არ არის Smart Reader-ის რეზერვული ასლი. მაინც გსურთ იმპორტი?')) {
                    return;
                }
            }

            // Import stats
            if (data.stats) {
                stats = data.stats;
                saveStats();
            }

            // Import saved texts
            if (data.savedTexts && Array.isArray(data.savedTexts)) {
                savedTexts = data.savedTexts;
                localStorage.setItem('savedTexts', JSON.stringify(savedTexts));
                renderSavedTexts();
            }

            // Import settings
            if (data.settings) {
                Object.keys(data.settings).forEach(key => {
                    localStorage.setItem(key, data.settings[key]);
                });
            }

            alert('✅ მონაცემები აღდგენილია!\n\nგთხოვთ გადატვირთეთ გვერდი.');
            location.reload();

        } catch (err) {
            console.error('Import error:', err);
            alert('❌ ფაილის წაკითხვა ვერ მოხერხდა. შეამოწმეთ ფაილის ფორმატი.');
        }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
}

// Factory reset - clear all data
function factoryReset() {
    const message = '⚠️ ყველაფრის წაშლა\n\n' +
        'ეს წაშლის:\n' +
        '- სტატისტიკას\n' +
        '- შენახულ ტექსტებს\n' +
        '- სანიშნეებს\n' +
        '- ყველა პარამეტრს\n\n' +
        'დარწმუნებული ხართ?';

    if (!confirm(message)) return;

    if (!confirm('ნამდვილად გსურთ ყველაფრის წაშლა? ეს ოპერაცია შეუქცევადია!')) return;

    // Clear all localStorage
    const keys = ['readerStats', 'savedTexts', 'theme', 'ttsRate', 'ttsVolume', 
                 'ttsPitch', 'selectedVoiceName', 'fontSize', 'fontFamily', 
                 'paraLength', 'lastText'];
    
    keys.forEach(key => localStorage.removeItem(key));

    // Reset variables
    stats = { totalTexts: 0, totalMinutes: 0, totalWords: 0, totalSessions: 0 };
    savedTexts = [];
    bookmarkedSlides.clear();

    // Update UI
    updateStatsDisplay();
    renderSavedTexts();

    alert('✅ ყველაფერი წაიშალა!\n\nგთხოვთ გადატვირთეთ გვერდი.');
    location.reload();
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then((registration) => {
      console.log('Service Worker registered:', registration);
    })
    .catch((error) => {
      console.log('Service Worker registration failed:', error);
    });
}
