import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useBibleData } from '../hooks/useBible';
import { VERSIONS } from '../lib/bibleVersions';

export default function ProjectorPage() {
  const { bibleData, version, loading, changeVersion } = useBibleData();

  const books = useMemo(() => {
    if (!bibleData) return [];
    return Array.isArray(bibleData) ? bibleData : Object.values(bibleData);
  }, [bibleData]);

  const [bookIdx, setBookIdx] = useState(0);
  const [chapter, setChapter] = useState(0);
  const [verse, setVerse] = useState(0);
  const [fontSize, setFontSize] = useState(
    () => parseInt(localStorage.getItem('projector_font_size') || '56', 10)
  );
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimerRef = useRef(null);
  const containerRef = useRef(null);

  const book = books[bookIdx];
  const chapters = book?.chapters || [];
  const verses = chapters[chapter] || [];
  const verseText = verses[verse] || '';

  /* ── Fullscreen sync ── */
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  /* ── Auto-hide controls ── */
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 4000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => clearTimeout(hideTimerRef.current);
  }, [resetHideTimer]);

  /* ── Font size persist ── */
  useEffect(() => {
    localStorage.setItem('projector_font_size', String(fontSize));
  }, [fontSize]);

  /* ── Navigation ── */
  const goNext = useCallback(() => {
    if (!book) return;
    if (verse < verses.length - 1) {
      setVerse(v => v + 1);
    } else if (chapter < chapters.length - 1) {
      setChapter(c => c + 1);
      setVerse(0);
    } else if (bookIdx < books.length - 1) {
      setBookIdx(i => i + 1);
      setChapter(0);
      setVerse(0);
    }
  }, [book, verse, verses.length, chapter, chapters.length, bookIdx, books.length]);

  const goPrev = useCallback(() => {
    if (!book) return;
    if (verse > 0) {
      setVerse(v => v - 1);
    } else if (chapter > 0) {
      const prevChapter = chapter - 1;
      setChapter(prevChapter);
      setVerse((chapters[prevChapter] || []).length - 1);
    } else if (bookIdx > 0) {
      const prevBook = books[bookIdx - 1];
      const lastCh = prevBook.chapters.length - 1;
      setBookIdx(i => i - 1);
      setChapter(lastCh);
      setVerse(prevBook.chapters[lastCh].length - 1);
    }
  }, [book, verse, chapter, chapters, bookIdx, books]);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const handler = (e) => {
      resetHideTimer();
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          goPrev();
          break;
        case '+':
        case '=':
          setFontSize(s => Math.min(s + 4, 120));
          break;
        case '-':
          setFontSize(s => Math.max(s - 4, 20));
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
          setShowControls(s => !s);
          break;
        default: break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, resetHideTimer, toggleFullscreen]);

  if (loading) return (
    <div className="proj-loading">
      <i className="fas fa-spinner fa-spin" /> Carregando...
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`proj-container${showControls ? '' : ' controls-hidden'}`}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      onClick={(e) => {
        if (e.target.closest('.proj-toolbar, .proj-nav-btn, .proj-sidebar-select')) return;
        resetHideTimer();
      }}
    >
      {/* ── Top Toolbar ── */}
      <div className="proj-toolbar proj-toolbar-top">
        <div className="proj-toolbar-left">
          <select
            className="proj-select"
            value={bookIdx}
            onChange={e => { setBookIdx(+e.target.value); setChapter(0); setVerse(0); }}
          >
            {books.map((b, i) => (
              <option key={b.abbrev} value={i}>{b.name}</option>
            ))}
          </select>
          <select
            className="proj-select"
            value={chapter}
            onChange={e => { setChapter(+e.target.value); setVerse(0); }}
          >
            {chapters.map((_, i) => (
              <option key={i} value={i}>Cap. {i + 1}</option>
            ))}
          </select>
          <select
            className="proj-select"
            value={verse}
            onChange={e => setVerse(+e.target.value)}
          >
            {verses.map((_, i) => (
              <option key={i} value={i}>v. {i + 1}</option>
            ))}
          </select>
        </div>
        <div className="proj-toolbar-right">
          <select
            className="proj-select"
            value={version}
            onChange={e => changeVersion(e.target.value)}
          >
            {Object.entries(VERSIONS).map(([key, v]) => (
              <option key={key} value={key}>{v.label}</option>
            ))}
          </select>
          <button className="proj-icon-btn" onClick={() => setFontSize(s => Math.max(s - 4, 20))} title="Diminuir fonte">
            <i className="fas fa-minus" />
          </button>
          <span className="proj-font-label">{fontSize}px</span>
          <button className="proj-icon-btn" onClick={() => setFontSize(s => Math.min(s + 4, 120))} title="Aumentar fonte">
            <i className="fas fa-plus" />
          </button>
          <button className="proj-icon-btn" onClick={toggleFullscreen} title="Tela cheia (F)">
            <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`} />
          </button>
        </div>
      </div>

      {/* ── Verse Display ── */}
      <div className="proj-stage" onClick={(e) => {
        if (e.target.closest('.proj-nav-btn')) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x > rect.width / 2) goNext();
        else goPrev();
      }}>
        <button className="proj-nav-btn proj-nav-prev" onClick={goPrev} title="Anterior (←)">
          <i className="fas fa-chevron-left" />
        </button>

        <div className="proj-verse-area">
          <p className="proj-verse-text" style={{ fontSize: `${fontSize}px` }}>
            {verseText || '—'}
          </p>
          <div className="proj-verse-ref">
            {book?.name} {chapter + 1}:{verse + 1}
          </div>
        </div>

        <button className="proj-nav-btn proj-nav-next" onClick={goNext} title="Próximo (→)">
          <i className="fas fa-chevron-right" />
        </button>
      </div>

      {/* ── Bottom hint ── */}
      <div className="proj-toolbar proj-toolbar-bottom">
        <span className="proj-hint">
          ← → navegar &nbsp;|&nbsp; + − fonte &nbsp;|&nbsp; F tela cheia &nbsp;|&nbsp; Esc controles
        </span>
      </div>
    </div>
  );
}
