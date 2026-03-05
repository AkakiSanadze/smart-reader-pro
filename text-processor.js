/* Text Processor Module - Handles text cleaning and slide splitting */

const TextProcessor = {
    // Clean text - remove markdown, HTML, extra whitespace
    clean(text) {
        // Remove HTML tags
        text = text.replace(/<[^>]+>/g, '');

        // Remove markdown formatting
        text = text.replace(/\*\*(.+?)\*\*/g, '$1');
        text = text.replace(/\*(.+?)\*/g, '$1');
        text = text.replace(/`([^`]+)`/g, '$1');
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        text = text.replace(/^#{1,6}\s+/gm, '');

        // Clean whitespace
        text = text.replace(/\n{3,}/g, '\n\n');
        text = text.replace(/[ \t]+/g, ' ');
        text = text.trim();

        return text;
    },

    // Split text into slides (sentences)
    splitIntoSlides(text) {
        const paragraphs = text.split(/\n\n+/);
        const slides = [];

        paragraphs.forEach(para => {
            para = para.trim();
            if (!para) return;

            // Split into sentences
            const sentences = para.split(/(?<=[.!?])\s+(?=[ა-ჰA-Z])/);

            // Group 2-3 sentences per slide
            let chunk = '';
            sentences.forEach((s, i) => {
                chunk += (chunk ? ' ' : '') + s;
                if ((i + 1) % 2 === 0 || i === sentences.length - 1) {
                    slides.push(chunk);
                    chunk = '';
                }
            });
        });

        return slides;
    },

    // Get word count
    getWordCount(text) {
        return text.split(/\s+/).length;
    },

    // Escape HTML for safe display
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
