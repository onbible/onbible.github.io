import Dexie from 'dexie';

// ─── Schema ────────────────────────────────────────────────────────────────
export const onBibleDB = new Dexie('OnBibleDB');

onBibleDB.version(1).stores({
  preferences:   'key',
  reading_state: 'book_abbrev',
  notes:         '++id, book, chapter, verse, text',
  highlights:    '++id, book, chapter, verse, color',
});

// ─── DB API ────────────────────────────────────────────────────────────────
export const DB = {
  // Preferences
  async getPref(key, defaultVal) {
    try {
      const data = await onBibleDB.preferences.get(key);
      return data ? data.value : defaultVal;
    } catch { return defaultVal; }
  },
  async setPref(key, val) {
    await onBibleDB.preferences.put({ key, value: val });
  },

  // Reading state
  async getChapter(abbrev, defaultVal = 1) {
    try {
      const data = await onBibleDB.reading_state.get(abbrev);
      return data ? data.last_chapter : defaultVal;
    } catch { return defaultVal; }
  },
  async setChapter(abbrev, num) {
    await onBibleDB.reading_state.put({ book_abbrev: abbrev, last_chapter: num });
  },

  // Highlights
  async getHighlights(book, chapter) {
    return onBibleDB.highlights.where({ book, chapter: parseInt(chapter) }).toArray();
  },
  async setHighlight(book, chapter, verse, color) {
    const existing = await onBibleDB.highlights
      .where({ book, chapter: parseInt(chapter), verse: parseInt(verse) }).first();
    if (existing) {
      await onBibleDB.highlights.update(existing.id, { color });
    } else {
      await onBibleDB.highlights.add({ book, chapter: parseInt(chapter), verse: parseInt(verse), color });
    }
  },
  async deleteHighlight(book, chapter, verse) {
    await onBibleDB.highlights
      .where({ book, chapter: parseInt(chapter), verse: parseInt(verse) }).delete();
  },
  async getAllHighlights() {
    return onBibleDB.highlights.toArray();
  },

  // Notes
  async getNote(book, chapter, verse) {
    const data = await onBibleDB.notes
      .where({ book, chapter: parseInt(chapter), verse: parseInt(verse) }).first();
    return data ? data.text : null;
  },
  async setNote(book, chapter, verse, text) {
    const existing = await onBibleDB.notes
      .where({ book, chapter: parseInt(chapter), verse: parseInt(verse) }).first();
    if (existing) {
      await onBibleDB.notes.update(existing.id, { text });
    } else {
      await onBibleDB.notes.add({ book, chapter: parseInt(chapter), verse: parseInt(verse), text });
    }
  },
  async deleteNote(book, chapter, verse) {
    await onBibleDB.notes
      .where({ book, chapter: parseInt(chapter), verse: parseInt(verse) }).delete();
  },
  async getAllNotes() {
    return onBibleDB.notes.toArray();
  },
  async getNotesForChapter(book, chapter) {
    return onBibleDB.notes.where({ book, chapter: parseInt(chapter) }).toArray();
  },

  // Migration guard
  async init() {
    if (localStorage.getItem('migrated_to_dexie') !== 'true') {
      const bv = localStorage.getItem('bible_version');
      if (bv) await this.setPref('bible_version', bv);
      const fs = localStorage.getItem('reading_font_size');
      if (fs) await this.setPref('reading_font_size', parseInt(fs));
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('last_chapter_')) {
          const abbrev = k.replace('last_chapter_', '');
          const chap = parseInt(localStorage.getItem(k));
          if (!isNaN(chap)) await this.setChapter(abbrev, chap);
        }
      }
      localStorage.setItem('migrated_to_dexie', 'true');
    }
  },
};
