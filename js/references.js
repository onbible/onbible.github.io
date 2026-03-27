// js/references.js

const ReferenceManager = {
    // Mapping of book names (pt-br) to English (used by TSK JSON)
    bookMap: {
        "gn": "Genesis", "ex": "Exodus", "lv": "Leviticus", "nm": "Numbers", "dt": "Deuteronomy",
        "js": "Joshua", "jz": "Judges", "rt": "Ruth", "1sm": "1 Samuel", "2sm": "2 Samuel",
        "1rs": "1 Kings", "2rs": "2 Kings", "1cr": "1 Chronicles", "2cr": "2 Chronicles",
        "ed": "Ezra", "ne": "Nehemiah", "et": "Esther", "jo": "Job", "sl": "Psalms",
        "pv": "Proverbs", "ec": "Ecclesiastes", "ct": "Song of Solomon", "is": "Isaiah",
        "jr": "Jeremiah", "lm": "Lamentations", "ez": "Ezekiel", "dn": "Daniel",
        "os": "Hosea", "jl": "Joel", "am": "Amos", "ob": "Obadiah", "jn": "Jonah",
        "mq": "Micah", "na": "Nahum", "hc": "Habakkuk", "sf": "Zephaniah", "ag": "Haggai",
        "zc": "Zechariah", "ml": "Malachi", "mt": "Matthew", "mc": "Mark", "lc": "Luke",
        "joa": "John", "at": "Acts", "rm": "Romans", "1co": "1 Corinthians", "2co": "2 Corinthians",
        "gl": "Galatians", "ef": "Ephesians", "fp": "Philippians", "cl": "Colossians",
        "1ts": "1 Thessalonians", "2ts": "2 Thessalonians", "1tm": "1 Timothy", "2tm": "2 Timothy",
        "tt": "Titus", "fm": "Philemon", "hb": "Hebrews", "tg": "James", "1pe": "1 Peter",
        "2pe": "2 Peter", "1jo": "1 John", "2jo": "2 John", "3jo": "3 John", "jd": "Jude", "ap": "Revelation"
    },

    // Mapping of index files in josephilipraja/Bible-Cross-Reference-JSON
    // Since it's split into 32 files, we need a way to find which file contains which book.
    // However, I will use a more direct source if possible.
    // Let's use a simpler mapping: each book has its own JSON in some repos.
    
    async loadReferences(bookAbbrev, chapter, verse) {
        const bookName = this.bookMap[bookAbbrev];
        if (!bookName) return [];

        const verseRef = `${bookName} ${chapter}:${verse}`;
        const container = document.getElementById('references-list');
        const countBadge = document.getElementById('references-count');
        
        container.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Buscando referências...</p></div>';
        countBadge.innerText = '0';

        try {
            // Using a slightly more organized TSK source that is per-book if possible, 
            // or we use the 1-32 mapping. For simplicity and reliability, 
            // I'll fetch a book-specific JSON from a known mirror.
            const url = `https://raw.githubusercontent.com/thiagobodruk/bible-references/master/json/${bookName}.json`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Não foi possível carregar as referências para este livro.");
            
            const data = await response.json();
            // Expected format: { "1": { "1": ["Ref 1", "Ref 2"] } }
            const refs = data[chapter] ? data[chapter][verse] : [];

            if (!refs || refs.length === 0) {
                container.innerHTML = '<div class="text-center p-4"><i class="fas fa-info-circle mb-2 fa-2x text-muted"></i><p>Nenhuma referência cruzada encontrada para este versículo.</p></div>';
                return;
            }

            countBadge.innerText = refs.length;
            container.innerHTML = '';
            
            refs.forEach(ref => {
                const item = document.createElement('div');
                item.className = 'reference-item p-3 mb-2 border rounded hover-bg-light';
                item.style.cursor = 'pointer';
                item.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <strong class="text-primary">${ref}</strong>
                        <i class="fas fa-chevron-right text-muted small"></i>
                    </div>
                    <div class="reference-preview mt-2 small text-muted italic" id="preview-${ref.replace(/[:\s]/g, '-')}">
                        Carregando versículo...
                    </div>
                `;
                item.onclick = () => this.showPreview(ref);
                container.appendChild(item);
                
                // Load preview text immediately
                this.loadRefPreview(ref);
            });

        } catch (e) {
            console.error("Reference load error", e);
            container.innerHTML = '<div class="alert alert-warning">Falha ao carregar referências. Verifique sua conexão.</div>';
        }
    },

    async loadRefPreview(ref) {
        const previewId = `preview-${ref.replace(/[:\s]/g, '-')}`;
        const previewEl = document.getElementById(previewId);
        
        try {
            // Parse reference (ex: "John 3:16" or "1 John 2:1")
            const parts = ref.match(/^(.+?)\s(\d+):(\d+)/);
            if (!parts) return;
            
            const bookName = parts[1];
            const chapter = parts[2];
            const verse = parts[3];

            // Map English book name back to our abbrev to find text
            const abbrev = Object.keys(this.bookMap).find(key => this.bookMap[key] === bookName);
            if (!abbrev) {
                previewEl.innerText = "(Texto não disponível)";
                return;
            }

            // Fetch the text from our current bible_url (main.js)
            const response = await fetch(bible_url);
            const data = await response.json();
            const bookData = Object.values(data).find(b => b.abbrev === abbrev);
            
            if (bookData && bookData.chapters[chapter-1] && bookData.chapters[chapter-1][verse-1]) {
                previewEl.innerText = bookData.chapters[chapter-1][verse-1];
            } else {
                previewEl.innerText = "(Versículo não encontrado na tradução atual)";
            }
        } catch (e) {
            previewEl.innerText = "(Erro ao carregar texto)";
        }
    },

    openPanel(book, chapter, verse) {
        // Trigger Bootstrap Offcanvas
        const offCanvasEl = document.getElementById('offcanvasReferences');
        const bsOffcanvas = new bootstrap.Offcanvas(offCanvasEl);
        
        document.getElementById('ref-title').innerText = `Referências: ${this.bookMap[book]} ${chapter}:${verse}`;
        bsOffcanvas.show();
        
        this.loadReferences(book, chapter, verse);
    }
};
