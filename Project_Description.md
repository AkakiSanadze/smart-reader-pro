 Smart Reader Pro - პროექტის აღწერილობა

     მიმოხილვა                                                                                                                  
   
     Smart Reader Pro არის ინტერაქტიული ვებ-აპლიკაცია ტექსტის წასაკითხად და მოსასმენად. აპლიკაცია მხარს უჭერს მრავალენოვან      
     TTS-ს (Text-to-Speech), მათ შორის ქართულ ენას Google TTS API-ის მეშვეობით.

     ---
     ტექნოლოგიური სტაკი

     ┌────────────┬──────────────────────────────────────┐
     │ კატეგორია  │              ტექნოლოგია              │
     ├────────────┼──────────────────────────────────────┤
     │ Frontend   │ HTML5, CSS3, JavaScript (Vanilla)    │
     ├────────────┼──────────────────────────────────────┤
     │ Fonts      │ Google Fonts (Literata, DM Sans)     │
     ├────────────┼──────────────────────────────────────┤
     │ TTS        │ Web Speech API, Google Translate TTS │
     ├────────────┼──────────────────────────────────────┤
     │ Storage    │ localStorage                         │
     ├────────────┼──────────────────────────────────────┤
     │ PWA        │ Service Worker, Web App Manifest     │
     ├────────────┼──────────────────────────────────────┤
     │ Deployment │ Vercel (static)                      │
     └────────────┴──────────────────────────────────────┘

     ---
     არქიტექტურა

     ფაილთა სტრუქტურა

     Smart Reader/
     ├── index.html          # მთავარი HTML (ეკრანები, მოდალები, SVG icons)
     ├── Styles.css          # CSS სტილები (თემები, responsive, animations)
     ├── script.js           # მთავარი ლოგიკა (~1470 ხაზი)
     ├── georgian-tts.js     # ქართული TTS მოდული
     ├── manifest.json       # PWA manifest
     ├── service-worker.js   # Offline caching
     ├── favicon.svg         # აიკონი
     └── README.md           # დოკუმენტაცია

     ---
     ძირითადი ფუნქციონალი

     1. ტექსტის შეყვანა

     - ხელით შეყვანა - textarea ველში
     - ჩაკრება (Paste) - clipboard-დან
     - URL-დან - allorigins.win proxy-ს მეშვეობით
     - Demo ტექსტი - მაგალითის ჩატვირთვა
     - ისტორიიდან - წინა ტექსტებიდან არჩევა
     - შენახულიდან - saved texts-დან არჩევა

     2. ტექსტის დამუშავება

     TextProcessor.clean(text)         // Markdown/HTML გაწმენდა
     TextProcessor.splitIntoSlides()   // სლაიდებად დაყოფა

     დაყოფის რეჟიმები:
     - short - 1-2 წინადადება თითო სლაიდზე
     - medium - 3-5 წინადადება
     - long - მთელი პარაგრაფი

     3. Text-to-Speech (TTS)

     Web Speech API:
     ReaderEngine.speakNative(text, voice)  // სტანდარტული TTS

     ქართული TTS (GeorgianTTS Module):
     // Native ქართული ხმა (თუ არის დაინსტალირებული)
     GeorgianTTS.hasNativeGeorgianVoice()
     GeorgianTTS.getNativeGeorgianVoice()

     // Google TTS Fallback
     GeorgianTTS.speakWithGoogle(text, rate, volume, onEnd)
     // URL: https://translate.google.com/translate_tts?ie=UTF-8&tl=ka&client=gtx&q=...

     ხმის პარამეტრები:
     - rate - სიჩქარე (0.5 - 3.0)
     - volume - ხმის სიმძლავრე (0 - 1)
     - pitch - ტონალობა (0.5 - 2.0)

     Word Highlighting:
     - onboundary event - მიმდინარე სიტყვის გამოკვეთა
     - Auto-scroll - ტექსტის ავტომატური გადახვევა

     4. ეკრანები

     Landing Screen

     - Hero section (logo, title, subtitle)
     - ტექსტის შეყვანის არეალი
     - Quick actions (Demo, URL, Paste, Clear)
     - Continue reading card (პროგრესის აღდგენა)
     - სტატისტიკა (ტექსტების რაოდენობა, წუთები)
     - ისტორია (ბოლო 5)
     - შენახული ტექსტები (ბოლო 5)
     - Settings floating button

     Reader Screen

     - Top Navigation:
       - Home button
       - Save button
       - Clear button
       - Voice badge
       - Theme selector
       - Voice selector
       - Speed slider
     - Content Area:
       - Slide container
       - Word spans (highlighting-ისთვის)
     - Bottom Controls:
       - Navigation buttons (prev/play/next)
       - Progress bar (seekable)
       - Counter + bookmark button
       - Focus mode toggle
       - Fullscreen toggle

     5. მონაცემთა მენეჯმენტი

     Storage Module:
     Storage.get(key, fallback)
     Storage.set(key, value)

     დაცული მონაცემები:

     ┌───────────────────┬─────────┬──────────────────────────────────────────────────────────────────┐
     │        Key        │  Type   │                           Description                            │
     ├───────────────────┼─────────┼──────────────────────────────────────────────────────────────────┤
     │ readerStats       │ Object  │ სტატისტიკა (totalTexts, totalMinutes, totalWords, totalSessions) │
     ├───────────────────┼─────────┼──────────────────────────────────────────────────────────────────┤
     │ savedTexts        │ Array   │ შენახული ტექსტები (max 20)                                       │
     ├───────────────────┼─────────┼──────────────────────────────────────────────────────────────────┤
     │ readingHistory    │ Array   │ კითხვის ისტორია (max 50)                                         │
     ├───────────────────┼─────────┼──────────────────────────────────────────────────────────────────┤
     │ readingProgress   │ Object  │ მიმდინარე პროგრესი (text, index, bookmarks)                      │
     ├───────────────────┼─────────┼──────────────────────────────────────────────────────────────────┤
     │ lastText          │ String  │ ბოლო ტექსტი                                                      │
     ├───────────────────┼─────────┼──────────────────────────────────────────────────────────────────┤
     │ theme             │ String  │ თემა ('', 'dark', 'sepia')                                       │
     ├───────────────────┼─────────┼──────────────────────────────────────────────────────────────────┤
     │ ttsRate           │ Number  │ TTS სიჩქარე                                                      │
     ├───────────────────┼─────────┼──────────────────────────────────────────────────────────────────┤
     │ ttsVolume         │ Number  │ ხმის სიმძლავრე                                                   │
     ├───────────────────┼─────────┼──────────────────────────────────────────────────────────────────┤
     │ ttsPitch          │ Number  │ ტონალობა                                                         │
     ├───────────────────┼─────────┼──────────────────────────────────────────────────────────────────┤
     │ selectedVoiceName │ String  │ არჩეული ხმა                                                      │
     ├───────────────────┼─────────┼──────────────────────────────────────────────────────────────────┤
     │ paraLength        │ String  │ პარაგრაფის სიგრძე                                                │
     ├───────────────────┼─────────┼──────────────────────────────────────────────────────────────────┤
     │ focusMode         │ Boolean │ ფოკუს რეჟიმი                                                     │
     └───────────────────┴─────────┴──────────────────────────────────────────────────────────────────┘

     6. ისტორია და შენახული ტექსტები

     HistoryManager.add(text, wordCount)
     HistoryManager.getAll()
     HistoryManager.delete(id)
     HistoryManager.markComplete(id)

     StorageManager.saveText(text)
     StorageManager.deleteText(index)

     7. URL-დან წაკითხვა

     URLReader.fetch(url)       // allorigins.win proxy
     URLReader.extractText(html) // HTML-დან ტექსტის გამოყოფა

     გამოყოფის ლოგიკა:
     1. შემდეგი ელემენტების წაშლა: script, style, nav, footer, header, aside, .advertisement, .comments, .social
     2. მთავარი კონტენტის ძიება: article > main > .content > .article > body
     3. <p> ტეგებიდან ტექსტის ამოღება

     8. UI/UX Features

     თემები:
     - Light (default) - თეთრი ფონი, მუქი ტექსტი
     - Dark - მუქი ფონი, ღია ტექსტი
     - Sepia - თბილი კრემისფერი ფონი

     შრიფტები:
     - Literata (serif) - წასაკითხად
     - DM Sans (sans-serif) - UI-სთვის
     - ზომა: 20px - 36px

     Focus Mode:
     - UI ელემენტების დამალვა
     - მხოლოდ ტექსტის ჩვენება

     ანიმაციები:
     - Screen transitions (fade + slide)
     - Slide content fade
     - Button hover effects
     - Progress bar fill

     9. PWA Features

     // Service Worker
     CACHE_NAME = 'smart-reader-v4'
     ASSETS = ['./', 'index.html', 'Styles.css', 'script.js', 'georgian-tts.js', 'favicon.svg', 'manifest.json']

     // Strategy: Network first, fallback to cache

     Manifest:
     - Name: "Smart Reader Pro"
     - Display: standalone
     - Theme color: #4f46e5 (Indigo)
     - Icons: SVG (scalable)

     10. ინტერაქცია

     Keyboard Shortcuts:

     ┌────────┬───────────────────┐
     │  Key   │      Action       │
     ├────────┼───────────────────┤
     │ Space  │ Play/Pause        │
     ├────────┼───────────────────┤
     │ ←      │ Previous slide    │
     ├────────┼───────────────────┤
     │ →      │ Next slide        │
     ├────────┼───────────────────┤
     │ Escape │ Exit reader       │
     ├────────┼───────────────────┤
     │ F      │ Toggle focus mode │
     ├────────┼───────────────────┤
     │ B      │ Toggle bookmark   │
     └────────┴───────────────────┘

     Touch Gestures:
     - Swipe left → Next slide
     - Swipe right → Previous slide
     - Threshold: 50px

     Progress Bar:
     - Click to seek
     - Visual progress fill
     - Percentage display

     ---
     კოდის სტრუქტურა (script.js)

     მოდულები

     AppState          - გლობალური მდგომარეობა
     URLReader         - URL-დან ტექსტის წაკითხვა
     ProgressManager   - პროგრესის მენეჯმენტი
     HistoryManager    - ისტორიის მენეჯმენტი
     Storage           - localStorage helpers
     StatsManager      - სტატისტიკა
     StorageManager    - შენახული ტექსტები
     TextProcessor     - ტექსტის დამუშავება
     ReaderEngine      - TTS და slide navigation
     UI                - UI initialization
     SwipeGestures     - Touch gestures
     PageTransitions   - Screen transitions
     Toast             - Notifications

     გლობალური ფუნქციები (HTML onclick)

     startReading()
     exitReader()
     toggleSettings()
     setTheme()
     togglePlay()
     prevSlide()
     nextSlide()
     toggleBookmark()
     toggleFocusMode()
     toggleFullScreen()
     saveCurrentText()
     clearInput()
     pasteFromClipboard()
     loadDemo()
     factoryReset()
     exportData()
     importData()
     fetchFromUrl()
     openUrlModal()
     continueReading()
     showAllHistory()
     showAllSavedTexts()

     ---
     CSS სტრუქტურა

     CSS Variables

     :root {
       --bg-color
       --text-primary
       --text-secondary
       --accent-primary
       --accent-hover
       --accent-light
       --surface-color
       --surface-border
       --shadow-sm/md/lg
       --radius-sm/md/lg/full
       --font-ui
       --font-reader
       --reader-size
       --max-width
     }

     ძირითადი კლასები

     .screen           /* ეკრანები */
     .hero-section     /* მთავარი სექცია */
     .content-grid     /* კონტენტის grid */
     .input-section    /* ტექსტის შეყვანა */
     .sidebar          /* გვერდითა პანელი */
     .top-nav          /* ზედა ნავიგაცია */
     .content-area     /* ტექსტის არეალი */
     .bottom-controls  /* ქვედა კონტროლები */
     .settings-panel   /* პარამეტრების პანელი */
     .modal-overlay    /* მოდალი */
     .toast            /* შეტყობინებები */

     ---
     პრობლემები და შეზღუდვები

     1. Google TTS Rate Limit - მრავალჯერ გამოძახებაზე შეიძლება დაბლოკოს
     2. File:// Protocol - PWA არ მუშაობს (მხოლოდ HTTP/HTTPS)
     3. Clipboard API - file://-ზე არ მუშაობს
     4. Voice Detection - დამოკიდებულია ბრაუზერის voices-ზე
     5. No Backend - მონაცემები მხოლოდ localStorage-შია
     6. No Authentication - მომხმარებლის ავტორიზაცია არ არის
     7. No Sync - მონაცემები არ სინქრონიზირდება მოწყობილობებს შორის

     ---
     ახალი პროექტის გეგმა

     მოთხოვნები

     ┌─────────────┬────────────────────────────────────────┐
     │  პარამეტრი  │                არჩევანი                │
     ├─────────────┼────────────────────────────────────────┤
     │ ტექნოლოგია  │ Vanilla JS (HTML/CSS/JS)               │
     ├─────────────┼────────────────────────────────────────┤
     │ ფუნქციონალი │ MVP + extensible                       │
     ├─────────────┼────────────────────────────────────────┤
     │ TTS         │ ჰიბრიდული (Web Speech API + Google)    │
     ├─────────────┼────────────────────────────────────────┤
     │ UI          │ Minimalist                             │
     ├─────────────┼────────────────────────────────────────┤
     │ Core MVP    │ საბაზისო Reader (ტექსტის დაყოფა + TTS) │
     └─────────────┴────────────────────────────────────────┘

     MVP ფუნქციები (მინიმალური)

     1. ტექსტის შეყვანა - textarea
     2. ტექსტის დაყოფა - სლაიდებად (წინადადებებად)
     3. Slide Navigation - prev/next
     4. TTS Playback - play/pause
     5. ხმის არჩევა - voice selector
     6. სიჩქარის კონტროლი - speed slider
     7. ქართული TTS - Web Speech + Google fallback

     არ შედის MVP-ში (შეიძლება მოგვიანებით)

     - ❌ ისტორია
     - ❌ პროგრესის შენახვა
     - ❌ URL Reader
     - ❌ PWA
     - ❌ სტატისტიკა
     - ❌ შენახული ტექსტები
     - ❌ თემები
     - ❌ Bookmarks
     - ❌ Focus Mode

     ---
     არქიტექტურა

     ფაილთა სტრუქტურა

     smart-reader-v2/
     ├── index.html      # HTML structure
     ├── styles.css      # Minimal CSS
     ├── app.js          # Main application
     └── tts.js          # TTS module (extensible)

     კოდის სტრუქტურა

     // app.js
     const App = {
       state: {
         text: '',
         slides: [],
         currentSlide: 0,
         isPlaying: false
       },

       init() {},
       setText(text) {},
       splitIntoSlides(text) {},
       renderSlide() {},
       nextSlide() {},
       prevSlide() {},
       togglePlay() {}
     };

     // tts.js
     const TTS = {
       synth: window.speechSynthesis,
       voices: [],

       init() {},
       getVoices() {},
       speak(text, options, onEnd) {},
       stop() {},
       detectLanguage(text) {},

       // Georgian fallback
       speakGeorgian(text, onEnd) {}
     };

     UI Layout (Minimalist)

     ┌────────────────────────────────────┐
     │  [≡]  Smart Reader          [⚙️ ]  │  <- header (optional)
     ├────────────────────────────────────┤
     │                                    │
     │                                    │
     │      ტექსტის შეყვანის არეალი       │
     │         (textarea)                 │
     │                                    │
     │                                    │
     │         [დაწყება]                   │
     │                                    │
     ├────────────────────────────────────┤
     │  Voice: [▼ auto]   Speed: [──●──] │
     └────────────────────────────────────┘

                ↓ დაწყების შემდეგ ↓

     ┌────────────────────────────────────┐
     │  [←]                         [→]  │
     ├────────────────────────────────────┤
     │                                    │
     │                                    │
     │      მიმდინარე სლაიდის ტექსტი       │
     │         (centered)                 │
     │                                    │
     │                                    │
     ├────────────────────────────────────┤
     │  [◀]  [▶/⏸]  [▶]    3/15  [25%]  │
     │       progress bar                 │
     └────────────────────────────────────┘

     ---
     განხორციელების გეგმა

     ნაბიჯი 1: HTML სტრუქტურა

     - Landing view (textarea + start button)
     - Reader view (slide display + controls)
     - Voice selector + speed slider

     ნაბიჯი 2: CSS სტილები

     - Minimal, clean design
     - CSS variables for theming potential
     - Basic responsive layout
     - Smooth transitions

     ნაბიჯი 3: Core JS Logic

     - State management (simple object)
     - Text splitting into slides
     - Slide rendering
     - Navigation (prev/next)

     ნაბიჯი 4: TTS Module

     - Web Speech API integration
     - Voice loading and selection
     - Play/pause/stop controls
     - Georgian language detection
     - Google TTS fallback for Georgian

     ნაბიჯი 5: Integration

     - Connect UI to logic
     - Keyboard shortcuts (Space, ←, →, Escape)
     - Touch swipe gestures
     - Progress display

     ნაბიჯი 6: Polish

     - Word highlighting during speech
     - Error handling
     - Final testing

     ---
     გაფართოების წერტილები (Extensible)

     არქიტექტურა უნდა იყოს მზად შემდეგი ფუნქციებისთვის:

     // Plugin system for future features
     const Plugins = {
       history: null,    // Future: reading history
       progress: null,   // Future: save/restore progress
       urlReader: null,  // Future: fetch from URL
       pwa: null,        // Future: offline support
       themes: null,     // Future: dark/sepia modes
       bookmarks: null   // Future: slide bookmarks
     };

     // Event bus for plugin communication
     const Events = {
       on(event, callback) {},
       emit(event, data) {}
     };

     ---
     შემოწმება

     1. ტექსტის შეყვანა → textarea-ში წერა
     2. დაყოფა → "დაწყება" ღილაკზე დაჭერა, სლაიდების გენერაცია
     3. ნავიგაცია → ღილაკებით/swipe-ით გადასვლა
     4. TTS → play ღილაკი, ხმის დაკვრა
     5. ქართული → ქართული ტექსტის გამოცნობა და Google TTS-ით დაკვრა
     6. სიჩქარე → slider-ით რეგულირება

     ---
     დასკვნა

     ეს არის კარგად დაგეგმილი, მაგრამ მარტივი არქიტექტურის მქონე აპლიკაცია. მთავარი ძლიერი მხარეები:
     - ქართული TTS მხარდაჭერა
     - კარგი UI/UX
     - PWA მხარდაჭერა
     - Offline მუშაობა

     მთავარი სისუსტები:
     - No backend/sync
     - No user accounts
     - Rate limiting issues with Google TTS