/* db.js - Configuração do Banco de Dados via Dexie.js e Migração de Estado */
var onBibleDB = window.onBibleDB || new Dexie('OnBibleDB');

onBibleDB.version(1).stores({
    preferences: 'key',           // ex: {key: 'bible_version', value: 'pt_aa'}
    reading_state: 'book_abbrev', // ex: {book_abbrev: 'gn', last_chapter: 1}
    notes: '++id, book, chapter, verse, text',
    highlights: '++id, book, chapter, verse, color'
});

var DB = {
    async getPref(key, defaultVal) {
        try {
            const data = await onBibleDB.preferences.get(key);
            return data ? data.value : defaultVal;
        } catch(e) {
            console.error("Dexie getPref error", e);
            return defaultVal;
        }
    },
    async setPref(key, val) {
        try {
            await onBibleDB.preferences.put({ key: key, value: val });
        } catch(e) {
            console.error("Dexie setPref error", e);
        }
    },
    async getChapter(abbrev, defaultVal) {
        try {
            const data = await onBibleDB.reading_state.get(abbrev);
            return data ? data.last_chapter : defaultVal;
        } catch(e) {
            console.error("Dexie getChapter error", e);
            return defaultVal;
        }
    },
    async setChapter(abbrev, num) {
        try {
            await onBibleDB.reading_state.put({ book_abbrev: abbrev, last_chapter: num });
        } catch(e) {
            console.error("Dexie setChapter error", e);
        }
    },

    // --- Highlights methods ---
    async getHighlights(book, chapter) {
        try {
            return await onBibleDB.highlights
                .where({ book: book, chapter: parseInt(chapter) })
                .toArray();
        } catch(e) {
            console.error("Dexie getHighlights error", e);
            return [];
        }
    },
    async setHighlight(book, chapter, verse, color) {
        try {
            // Check if exists
            const existing = await onBibleDB.highlights
                .where({ book: book, chapter: parseInt(chapter), verse: parseInt(verse) })
                .first();
            
            if (existing) {
                await onBibleDB.highlights.update(existing.id, { color: color });
            } else {
                await onBibleDB.highlights.add({
                    book: book,
                    chapter: parseInt(chapter),
                    verse: parseInt(verse),
                    color: color
                });
            }
        } catch(e) {
            console.error("Dexie setHighlight error", e);
        }
    },
    async deleteHighlight(book, chapter, verse) {
        try {
            await onBibleDB.highlights
                .where({ book: book, chapter: parseInt(chapter), verse: parseInt(verse) })
                .delete();
        } catch(e) {
            console.error("Dexie deleteHighlight error", e);
        }
    },

    // --- All Highlights methods ---
    async getAllHighlights() {
        try {
            return await onBibleDB.highlights.toArray();
        } catch(e) {
            console.error("Dexie getAllHighlights error", e);
            return [];
        }
    },

    // --- Notes methods ---
    async getNote(book, chapter, verse) {
        try {
            const data = await onBibleDB.notes
                .where({ book: book, chapter: parseInt(chapter), verse: parseInt(verse) })
                .first();
            return data ? data.text : null;
        } catch(e) {
            console.error("Dexie getNote error", e);
            return null;
        }
    },
    async setNote(book, chapter, verse, text) {
        try {
            const existing = await onBibleDB.notes
                .where({ book: book, chapter: parseInt(chapter), verse: parseInt(verse) })
                .first();
            
            if (existing) {
                await onBibleDB.notes.update(existing.id, { text: text });
            } else {
                await onBibleDB.notes.add({
                    book: book,
                    chapter: parseInt(chapter),
                    verse: parseInt(verse),
                    text: text
                });
            }
        } catch(e) {
            console.error("Dexie setNote error", e);
        }
    },
    async deleteNote(book, chapter, verse) {
        try {
            await onBibleDB.notes
                .where({ book: book, chapter: parseInt(chapter), verse: parseInt(verse) })
                .delete();
        } catch(e) {
            console.error("Dexie deleteNote error", e);
        }
    },
    async getAllNotes() {
        try {
            return await onBibleDB.notes.toArray();
        } catch(e) {
            console.error("Dexie getAllNotes error", e);
            return [];
        }
    },

    async getNotesForChapter(book, chapter) {
        try {
            return await onBibleDB.notes
                .where({ book: book, chapter: parseInt(chapter) })
                .toArray();
        } catch(e) {
            console.error("Dexie getNotesForChapter error", e);
            return [];
        }
    },

    async init() {
        try {
            if (localStorage.getItem('migrated_to_dexie') !== 'true') {
                console.log("Migrando dados antigos do localStorage para IndexedDB...");
                
                let bv = localStorage.getItem('bible_version');
                if (bv) await this.setPref('bible_version', bv);
                
                let fs = localStorage.getItem('reading_font_size');
                if (fs) await this.setPref('reading_font_size', parseInt(fs));

                for (let i = 0; i < localStorage.length; i++) {
                    let key = localStorage.key(i);
                    if (key && key.startsWith('last_chapter_')) {
                        let abbrev = key.replace('last_chapter_', '');
                        let chap = parseInt(localStorage.getItem(key));
                        if (!isNaN(chap)) await this.setChapter(abbrev, chap);
                    }
                }
                
                localStorage.setItem('migrated_to_dexie', 'true');
                console.log("Migração concluída com sucesso.");
            }
        } catch(e) {
            console.error("Erro na migração de banco", e);
        }
    }
};

window.dbInitialized = DB.init();
