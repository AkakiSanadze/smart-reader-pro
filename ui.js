/* UI Module - View management and toast notifications */

const UI = {
    // DOM elements
    elements: null,

    // Initialize with DOM elements
    init(elements) {
        this.elements = elements;
    },

    // View switching
    showView(viewName) {
        if (viewName === 'reader') {
            this.elements.landing.classList.add('hidden');
            this.elements.reader.classList.remove('hidden');
        } else {
            this.elements.reader.classList.add('hidden');
            this.elements.landing.classList.remove('hidden');
        }
    },

    // Render current slide
    renderSlide(text) {
        // Fade out
        this.elements.slideText.style.opacity = '0';

        setTimeout(() => {
            // Split text into word spans for highlighting
            const words = text.split(/(\s+)/);
            let charIndex = 0;

            this.elements.slideText.innerHTML = words.map(word => {
                if (!word.trim()) return word;

                const start = charIndex;
                const len = word.length;
                charIndex += len;

                return `<span class="word" data-start="${start}" data-len="${len}">${word}</span>`;
            }).join('');

            // Fade in
            this.elements.slideText.style.opacity = '1';
        }, 150);
    },

    // Update slide counter
    updateSlideCounter(current, total) {
        this.elements.slideCounter.textContent = `${current} / ${total}`;
    },

    // Update progress bar
    updateProgressBar(percent) {
        this.elements.progressFill.style.width = percent + '%';
    },

    // Update play button
    updatePlayButton(isPlaying) {
        this.elements.playIcon.style.display = isPlaying ? 'none' : 'block';
        this.elements.pauseIcon.style.display = isPlaying ? 'block' : 'none';
    },

    // Update theme icons
    updateThemeIcons() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (this.elements.themeIconLight) {
            this.elements.themeIconLight.style.display = isDark ? 'none' : 'block';
        }
        if (this.elements.themeIconDark) {
            this.elements.themeIconDark.style.display = isDark ? 'block' : 'none';
        }
    },

    // Update bookmark button
    updateBookmarkButton(isBookmarked) {
        if (this.elements.bookmarkBtn) {
            this.elements.bookmarkBtn.classList.toggle('active', isBookmarked);
        }
    },

    // Update focus button
    updateFocusButton(isActive) {
        if (this.elements.focusBtn) {
            this.elements.focusBtn.classList.toggle('active', isActive);
        }
    },

    // Render bookmark indicators on progress bar
    renderBookmarkIndicators(bookmarks, total) {
        // Remove existing indicators
        if (this.elements.progressBar) {
            this.elements.progressBar.querySelectorAll('.progress-bookmark').forEach(el => el.remove());

            bookmarks.forEach(index => {
                const percent = (index / total) * 100;
                const indicator = document.createElement('div');
                indicator.className = 'progress-bookmark';
                indicator.style.left = percent + '%';
                this.elements.progressBar.appendChild(indicator);
            });
        }
    },

    // Highlight word during TTS
    highlightWord(charIndex) {
        if (!this.elements.slideText) return;

        // Remove previous highlights
        this.elements.slideText.querySelectorAll('.highlight').forEach(el => {
            el.classList.remove('highlight');
        });

        // Find and highlight current word
        const words = this.elements.slideText.querySelectorAll('.word');
        for (const word of words) {
            const start = parseInt(word.dataset.start);
            const len = parseInt(word.dataset.len);

            if (charIndex >= start && charIndex < start + len + 1) {
                word.classList.add('highlight');

                // Scroll into view if needed
                const container = this.elements.slideText.parentElement;
                const wordRect = word.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                if (wordRect.top < containerRect.top || wordRect.bottom > containerRect.bottom) {
                    word.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                break;
            }
        }
    },

    // Clear highlights
    clearHighlights() {
        if (this.elements.slideText) {
            this.elements.slideText.querySelectorAll('.highlight').forEach(el => {
                el.classList.remove('highlight');
            });
        }
    },

    // Toast notifications
    showToast(message, type = 'success') {
        if (!this.elements.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        this.elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2500);
    },

    // Continue card
    showContinueCard(progress) {
        if (!this.elements.continueCard) return;

        if (progress) {
            this.elements.continuePreview.textContent = progress.text.slice(0, 60) + '...';
            this.elements.continueProgress.textContent = `${progress.slideIndex + 1} / ${progress.totalSlides} სლაიდი`;
            this.elements.continueCard.classList.remove('hidden');
        } else {
            this.elements.continueCard.classList.add('hidden');
        }
    },

    // Render history
    renderHistory(history) {
        if (!this.elements.historySection || !this.elements.historyList) return;

        if (history.length === 0) {
            this.elements.historySection.classList.add('hidden');
            return;
        }

        this.elements.historySection.classList.remove('hidden');

        this.elements.historyList.innerHTML = history.slice(0, 5).map(item => `
            <div class="history-item" onclick="loadFromHistory('${item.id}')">
                <span class="preview">${TextProcessor.escapeHtml(item.preview)}</span>
                <span class="meta">${item.wordCount} სიტყვა</span>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteHistoryItem('${item.id}')" aria-label="წაშლა">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        `).join('');
    },

    // Fullscreen
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    },

    // Modal controls
    openModal(modalElement, inputElement = null) {
        if (modalElement) {
            modalElement.classList.add('active');
            if (inputElement) {
                inputElement.focus();
            }
        }
    },

    closeModal(modalElement, inputElement = null) {
        if (modalElement) {
            modalElement.classList.remove('active');
            if (inputElement) {
                inputElement.value = '';
            }
        }
    },

    // Update button state
    setButtonState(button, disabled, text) {
        if (button) {
            button.disabled = disabled;
            if (text) {
                button.textContent = text;
            }
        }
    }
};
