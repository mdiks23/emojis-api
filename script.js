 (function() {
        const searchInput = document.getElementById('searchInput');
        const gridContainer = document.getElementById('emojiGridContainer');
        const countSpan = document.getElementById('countNumber');

        let masterEmojiList = [];
        let currentFiltered = [];
        async function fetchEmojiData() {
            const scriptUrl = 'https://akhil-06.github.io/emoji_project/emojiList.js';
            try {
                const response = await fetch(scriptUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const scriptText = await response.text();
                const getList = new Function(scriptText + '; return emojiList;');
                const emojiArray = getList();
                
                if (!Array.isArray(emojiArray) || emojiArray.length === 0) {
                    throw new Error('Extracted data is not a valid non-empty array');
                }
                return emojiArray;
            } catch (err) {
                console.error('Data fetch error:', err);
                throw new Error(`Failed to load emoji data: ${err.message}`);
            }
        }

        // ---------- FILTER LOGIC ----------
        function matchesSearch(emoji, queryLower) {
            if (emoji.name && emoji.name.toLowerCase().includes(queryLower)) return true;
            if (emoji.category && emoji.category.toLowerCase().includes(queryLower)) return true;
            if (emoji.tags) {
                if (Array.isArray(emoji.tags)) {
                    if (emoji.tags.some(tag => tag && tag.toLowerCase().includes(queryLower))) return true;
                } else if (typeof emoji.tags === 'string') {
                    if (emoji.tags.toLowerCase().includes(queryLower)) return true;
                }
            }
            return false;
        }

        function filterEmojis(emojiArray, query) {
            if (!query.trim()) return [...emojiArray];
            const lowerQuery = query.trim().toLowerCase();
            return emojiArray.filter(emoji => matchesSearch(emoji, lowerQuery));
        }

        // ---------- RENDER----------
        function renderEmojiCards(emojiArray) {
            gridContainer.innerHTML = '';
            if (!emojiArray.length) {
                const noResultDiv = document.createElement('div');
                noResultDiv.className = 'no-results';
                noResultDiv.innerHTML = '🌀 NO MATCHING EMOJIS \n TRY DIFFERENT KEYWORD 🌀';
                gridContainer.appendChild(noResultDiv);
                countSpan.innerText = '0';
                return;
            }

            const fragment = document.createDocumentFragment();
            let visibleCount = 0;

            for (const emoji of emojiArray) {
                let emojiChar = '🔮';
                if (emoji.emoji) emojiChar = emoji.emoji;
                else if (emoji.char) emojiChar = emoji.char;
                else if (emoji.htmlCode && Array.isArray(emoji.htmlCode) && emoji.htmlCode[0]) {
                    const temp = document.createElement('div');
                    temp.innerHTML = emoji.htmlCode[0];
                    emojiChar = temp.textContent || emoji.htmlCode[0];
                } else if (emoji.code) emojiChar = emoji.code;
                
                const nameDisplay = emoji.name || 'emoji';
                const categoryDisplay = emoji.category ? emoji.category.substring(0, 20) : '';

                const card = document.createElement('div');
                card.className = 'emoji-card';
                card.setAttribute('data-emoji-char', emojiChar);
                card.setAttribute('data-name', nameDisplay);

                const emojiSpan = document.createElement('div');
                emojiSpan.className = 'emoji-char';
                emojiSpan.textContent = emojiChar;
                
                const nameSpan = document.createElement('div');
                nameSpan.className = 'emoji-name';
                nameSpan.textContent = nameDisplay.length > 24 ? nameDisplay.slice(0, 21) + '...' : nameDisplay;
                
                card.appendChild(emojiSpan);
                card.appendChild(nameSpan);
                
                if (categoryDisplay) {
                    const catSpan = document.createElement('div');
                    catSpan.className = 'emoji-category';
                    catSpan.textContent = `# ${categoryDisplay.toLowerCase()}`;
                    card.appendChild(catSpan);
                }
                
                fragment.appendChild(card);
                visibleCount++;
            }
            
            gridContainer.appendChild(fragment);
            countSpan.innerText = visibleCount;
        }

        // ---------- SEARCH HANDLER ----------
        let rafId = null;
        function handleSearch() {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                if (!masterEmojiList.length) return;
                const filtered = filterEmojis(masterEmojiList, searchInput.value);
                currentFiltered = filtered;
                renderEmojiCards(filtered);
                rafId = null;
            });
        }

        // ---------- COPY TO CLIPBOARD + TOAST ----------
        function showToast(message) {
            const existing = document.querySelector('.toast-notify');
            if (existing) existing.remove();
            const toast = document.createElement('div');
            toast.className = 'toast-notify';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }

        async function copyEmoji(emojiChar, emojiName) {
            if (!emojiChar) return;
            try {
                await navigator.clipboard.writeText(emojiChar);
                showToast(`✅ COPIED! ${emojiChar}  —  ${emojiName || 'emoji'}`);
            } catch (err) {
                showToast(`⚠️ COPY FAILED: ${err.message || 'manual copy needed'}`);
            }
        }

        function onGridClick(e) {
            const card = e.target.closest('.emoji-card');
            if (!card) return;
            const emojiChar = card.getAttribute('data-emoji-char');
            const nameElem = card.querySelector('.emoji-name');
            const emojiName = nameElem ? nameElem.innerText : 'emoji';
            if (emojiChar) {
                copyEmoji(emojiChar, emojiName);
                card.style.transition = '0.05s linear';
                card.style.boxShadow = '0 0 0 2px #22d3ee';
                setTimeout(() => { if (card) card.style.boxShadow = ''; }, 150);
            }
        }
        async function init() {
            try {
                gridContainer.innerHTML = `<div class="loading-state">🌀 FETCHING EMOJI DATABASE ... 🌀</div>`;
                const emojiData = await fetchEmojiData();
                masterEmojiList = emojiData;
                currentFiltered = [...masterEmojiList];
                renderEmojiCards(currentFiltered);
                searchInput.addEventListener('input', handleSearch);
                gridContainer.addEventListener('click', onGridClick);
                console.log(`✅ Emoji engine ready: ${masterEmojiList.length} emojis`);
            } catch (error) {
                console.error(error);
                gridContainer.innerHTML = `<div class="no-results" style="border-left: 4px solid #f87171;">⚠️ DATA LOAD ERROR: ${error.message}<br>Check network or CORS. Refresh may help.</div>`;
                countSpan.innerText = '0';
            }
        }

        init();
    })();