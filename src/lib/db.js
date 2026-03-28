import Dexie from 'dexie';

// ─── Schema ────────────────────────────────────────────────────────────────
export const onBibleDB = new Dexie('OnBibleDB');

onBibleDB.version(1).stores({
  preferences:   'key',
  reading_state: 'book_abbrev',
  notes:         '++id, book, chapter, verse, text',
  highlights:    '++id, book, chapter, verse, color',
});

onBibleDB.version(2).stores({
  preferences:    'key',
  reading_state:  'book_abbrev',
  notes:          '++id, book, chapter, verse, text',
  highlights:     '++id, book, chapter, verse, color',
  reading_plan:   'day_key',
});

onBibleDB.version(3).stores({
  preferences:    'key',
  reading_state:  'book_abbrev',
  notes:          '++id, book, chapter, verse, text',
  highlights:     '++id, book, chapter, verse, color',
  reading_plan:   'day_key',
  sermons:        '++id, title, created_at, updated_at, isPublic',
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

  // Reading Plan
  async getPlanDone(month, day) {
    const rec = await onBibleDB.reading_plan.get(`${month}-${day}`);
    return rec ? rec.done : false;
  },
  async setPlanDone(month, day, done) {
    await onBibleDB.reading_plan.put({ day_key: `${month}-${day}`, done });
  },
  async getAllPlanDone() {
    return onBibleDB.reading_plan.toArray();
  },

  // Sermons
  async getAllSermons() {
    return onBibleDB.sermons.orderBy('updated_at').reverse().toArray();
  },
  async getSermon(id) {
    return onBibleDB.sermons.get(id);
  },
  async createSermon(title, body, isPublic = false) {
    const now = Date.now();
    return onBibleDB.sermons.add({ title, body, isPublic, created_at: now, updated_at: now });
  },
  async updateSermon(id, title, body, isPublic) {
    const update = { title, body, updated_at: Date.now() };
    if (typeof isPublic === 'boolean') update.isPublic = isPublic;
    await onBibleDB.sermons.update(id, update);
  },
  async setSermonPrivacy(id, isPublic) {
    await onBibleDB.sermons.update(id, { isPublic });
  },
  async deleteSermon(id) {
    await onBibleDB.sermons.delete(id);
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
