import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBibleData } from '../hooks/useBible';
import { DB } from '../lib/db';
import ChapterCrossReferences from '../components/ChapterCrossReferences';

const HL_COLORS = ['yellow', 'green', 'blue', 'pink'];

export default function BookPage() {
  const { abbrev } = useParams();
  const navigate = useNavigate();
  const { bibleData, loading } = useBibleData();

  const [chapter, setChapter]       = useState(1);
  const [highlights, setHighlights] = useState({});
  const [notes, setNotes]           = useState({});
  const [popover, setPopover]       = useState(null); // { verse, x, y }
  const popoverRef = useRef(null);

  const book = bibleData ? Object.values(bibleData).find(b => b.abbrev === abbrev) : null;

  // Load last chapter
  useEffect(() => {
    DB.getChapter(abbrev, 1).then(setChapter);
  }, [abbrev]);

  // Load highlights and notes when chapter changes
  useEffect(() => {
    if (!abbrev) return;
    async function load() {
      const hls  = await DB.getHighlights(abbrev, chapter);
      const hlMap = {};
      hls.forEach(h => { hlMap[h.verse] = h.color; });
      setHighlights(hlMap);

      const ns  = await DB.getNotesForChapter(abbrev, chapter);
      const nMap = {};
      ns.forEach(n => { nMap[n.verse] = n.text; });
      setNotes(nMap);
    }
    load();
  }, [abbrev, chapter]);

  // Save chapter
  const goToChapter = useCallback((ch) => {
    setChapter(ch);
    DB.setChapter(abbrev, ch);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [abbrev]);

  // Verse click
  const handleVerseClick = useCallback((e, verse) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({ verse, x: rect.left, y: rect.top });
  }, []);

  // Close popover on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopover(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Highlight
  const saveHighlight = useCallback(async (color) => {
    if (!popover) return;
    const { verse } = popover;
    setPopover(null);
    if (color === 'clear') {
      await DB.deleteHighlight(abbrev, chapter, verse);
      setHighlights(prev => { const n = {...prev}; delete n[verse]; return n; });
    } else {
      await DB.setHighlight(abbrev, chapter, verse, color);
      setHighlights(prev => ({ ...prev, [verse]: color }));
    }
  }, [popover, abbrev, chapter]);

  // Note
  const showNoteModal = useCallback(async () => {
    if (!popover) return;
    const { verse } = popover;
    setPopover(null);
    const existing = await DB.getNote(abbrev, chapter, verse);
    const text = window.prompt(`Nota — versículo ${verse}:\n\n(Deixe vazio para remover)`, existing || '');
    if (text === null) return; // cancelled
    if (text.trim() === '') {
      await DB.deleteNote(abbrev, chapter, verse);
      setNotes(prev => { const n = {...prev}; delete n[verse]; return n; });
    } else {
      await DB.setNote(abbrev, chapter, verse, text.trim());
      setNotes(prev => ({ ...prev, [verse]: text.trim() }));
    }
  }, [popover, abbrev, chapter]);

  // Cross references (from popover)
  const showRefs = useCallback(() => {
    if (!popover) return;
    setPopover(null);
    document.getElementById('cross-ref-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [popover]);

  if (loading || !book) {
    return (
      <div style={{ padding: '28px' }}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="skeleton-line" style={{ width: `${55 + (i % 3) * 15}%` }} />
        ))}
      </div>
    );
  }

  const verses = book.chapters[chapter - 1] || [];

  return (
    <>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button onClick={() => navigate('/')} style={{ border:'none',background:'none',color:'var(--text-muted)',cursor:'pointer',marginRight:'8px' }}>
            <i className="fas fa-arrow-left" />
          </button>
          <h1 style={{ display: 'inline', fontSize: '18px' }}>{book.name}</h1>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px' }}>Capítulo {chapter}</span>
        </div>

        {/* Prev / Next */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => goToChapter(Math.max(1, chapter - 1))}
            disabled={chapter === 1}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', cursor: 'pointer' }}
          >
            <i className="fas fa-chevron-left" />
          </button>
          <button
            onClick={() => goToChapter(Math.min(book.chapters.length, chapter + 1))}
            disabled={chapter === book.chapters.length}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', cursor: 'pointer' }}
          >
            <i className="fas fa-chevron-right" />
          </button>
        </div>
      </div>

      {/* Chapter picker */}
      <div className="chapter-picker">
        {book.chapters.map((_, i) => (
          <button
            key={i + 1}
            className="chapter-btn"
            onClick={() => goToChapter(i + 1)}
            style={chapter === i + 1 ? { borderColor: 'var(--primary)', color: 'var(--primary)', background: 'rgba(79,70,229,0.08)' } : {}}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Bible text */}
      <div className="bible-text">
        {verses.map((text, i) => {
          const verse = i + 1;
          const hlColor = highlights[verse];
          return (
            <span
              key={verse}
              id={`v-${verse}`}
              className={`verse-item${hlColor ? ` hl-${hlColor}` : ''}`}
              onClick={(e) => handleVerseClick(e, verse)}
            >
              <sup className="verse-number">{verse}</sup>
              {notes[verse] && <span className="note-icon">📝</span>}
              {text}{' '}
            </span>
          );
        })}

        {/* Cross References Panel — always visible */}
        <ChapterCrossReferences
          bookAbbrev={abbrev}
          chapter={chapter}
          bibleData={bibleData}
        />
      </div>

      {/* Highlight Popover */}
      {popover && (
        <div
          ref={popoverRef}
          className="hl-popover"
          style={{
            left: Math.min(popover.x, window.innerWidth - 250) + 'px',
            top:  Math.max(popover.y - 60, 8) + 'px',
          }}
        >
          {HL_COLORS.map(c => (
            <div key={c} className={`hl-dot dot-${c}`} title={c} onClick={() => saveHighlight(c)} />
          ))}
          <div className="hl-dot dot-clear" title="Remover" onClick={() => saveHighlight('clear')}>
            <i className="fas fa-eraser" />
          </div>
          <div className="hl-dot dot-note" title="Nota" onClick={showNoteModal}>
            <i className="fas fa-sticky-note" />
          </div>
          <div className="hl-dot dot-ref" title="Referências" onClick={showRefs}>
            <i className="fas fa-link" />
          </div>
        </div>
      )}
    </>
  );
}
