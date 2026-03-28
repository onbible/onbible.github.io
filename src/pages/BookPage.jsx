import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useBibleData } from '../hooks/useBible';
import { DB } from '../lib/db';
import ChapterCrossReferences from '../components/ChapterCrossReferences';

const HL_COLORS = ['yellow', 'green', 'blue', 'pink'];

export default function BookPage() {
  const { abbrev } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { bibleData, loading } = useBibleData();

  const [chapter, setChapter]       = useState(1);
  const [highlights, setHighlights] = useState({});
  const [notes, setNotes]           = useState({});
  const [popover, setPopover]       = useState(null); // { verse, x, y }
  const [availableImages, setAvailableImages] = useState([]);
  const [imageModal, setImageModal] = useState(null); // { src, title }
  const [noteModal, setNoteModal]   = useState(null); // { verse, text }
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected]     = useState(new Set());
  const noteTextRef = useRef(null);
  const popoverRef = useRef(null);

  const book = bibleData ? Object.values(bibleData).find(b => b.abbrev === abbrev) : null;
  const verses = book ? (book.chapters[chapter - 1] || []) : [];

  // Load verse image index
  useEffect(() => {
    fetch('/db/imgs/index.json')
      .then(r => r.json())
      .then(setAvailableImages)
      .catch(() => setAvailableImages([]));
  }, []);

  // Load chapter from query param or last visited
  useEffect(() => {
    const qc = searchParams.get('c');
    if (qc) {
      setChapter(+qc);
      DB.setChapter(abbrev, +qc);
    } else {
      DB.getChapter(abbrev, 1).then(setChapter);
    }
  }, [abbrev, searchParams]);

  // Scroll to verse from query param after chapter renders
  useEffect(() => {
    const qv = searchParams.get('v');
    if (!qv || loading) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`v-${qv}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('verse-flash');
        setTimeout(() => el.classList.remove('verse-flash'), 2000);
      }
      // Clear query params after navigating
      setSearchParams({}, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [chapter, loading, searchParams, setSearchParams]);

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

  // Exit select mode when chapter changes
  useEffect(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, [chapter]);

  // Enter select mode from popover
  const enterSelectMode = useCallback(() => {
    if (!popover) return;
    const { verse } = popover;
    setPopover(null);
    setSelectMode(true);
    setSelected(new Set([verse]));
  }, [popover]);

  // Toggle verse selection
  const toggleSelect = useCallback((verse) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(verse)) next.delete(verse);
      else next.add(verse);
      return next;
    });
  }, []);

  // Build share text
  const buildShareText = useCallback(() => {
    if (!book || selected.size === 0) return '';
    const sorted = [...selected].sort((a, b) => a - b);
    const lines = sorted.map(v => {
      const txt = verses[v - 1];
      return `${v} ${txt}`;
    });
    const range = sorted.length === 1
      ? `${sorted[0]}`
      : `${sorted[0]}-${sorted[sorted.length - 1]}`;
    return `📖 ${book.name} ${chapter}:${range}\n\n${lines.join('\n')}\n\n— Bíblia OnBible\nhttps://onbible.github.io/`;
  }, [book, chapter, selected, verses]);

  // Share to WhatsApp
  const shareWhatsApp = useCallback(() => {
    const text = buildShareText();
    if (!text) return;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }, [buildShareText]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    const text = buildShareText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setSelectMode(false);
    setSelected(new Set());
  }, [buildShareText]);

  // Cancel selection
  const cancelSelect = useCallback(() => {
    setSelectMode(false);
    setSelected(new Set());
  }, []);

  // Verse click
  const handleVerseClick = useCallback((e, verse) => {
    e.stopPropagation();
    if (selectMode) {
      toggleSelect(verse);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPopover({ verse, x: rect.left, y: rect.top });
  }, [selectMode, toggleSelect]);

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
    setNoteModal({ verse, text: existing || '' });
  }, [popover, abbrev, chapter]);

  // Focus textarea when note modal opens
  useEffect(() => {
    if (noteModal && noteTextRef.current) {
      noteTextRef.current.focus();
    }
  }, [noteModal]);

  const saveNote = useCallback(async () => {
    if (!noteModal) return;
    const { verse, text } = noteModal;
    if (text.trim() === '') {
      await DB.deleteNote(abbrev, chapter, verse);
      setNotes(prev => { const n = {...prev}; delete n[verse]; return n; });
    } else {
      await DB.setNote(abbrev, chapter, verse, text.trim());
      setNotes(prev => ({ ...prev, [verse]: text.trim() }));
    }
    setNoteModal(null);
  }, [noteModal, abbrev, chapter]);

  const deleteNote = useCallback(async () => {
    if (!noteModal) return;
    const { verse } = noteModal;
    await DB.deleteNote(abbrev, chapter, verse);
    setNotes(prev => { const n = {...prev}; delete n[verse]; return n; });
    setNoteModal(null);
  }, [noteModal, abbrev, chapter]);

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
            <i className="fas fa-chevron-left"></i> Anterior
          </button>
          <button
            onClick={() => goToChapter(Math.min(book.chapters.length, chapter + 1))}
            disabled={chapter === book.chapters.length}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)', cursor: 'pointer' }}
          >
            Próximo <i className="fas fa-chevron-right"></i>
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
              className={`verse-item${hlColor ? ` hl-${hlColor}` : ''}${selected.has(verse) ? ' verse-selected' : ''}${selectMode ? ' select-mode' : ''}`}
              onClick={(e) => handleVerseClick(e, verse)}
            >
              <sup className="verse-number">{verse}</sup>
              {notes[verse] && <span className="note-icon"><i className="fas fa-sticky-note"></i></span>}
              {availableImages.includes(`${abbrev}-${chapter}:${verse}.png`) && (
                <i
                  className="fas fa-image verse-image-icon"
                  title="Visualizar Ilustração"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageModal({
                      src: `/db/imgs/${abbrev}-${chapter}:${verse}.png`,
                      title: `${book.name} ${chapter}:${verse}`,
                    });
                  }}
                />
              )}
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

        {/* Book Media Section */}
        {(() => {
          const bookImages = availableImages.filter(img => img.startsWith(`${abbrev}-`));
          if (bookImages.length === 0) return null;
          return (
            <div className="book-media-panel">
              <div className="book-media-header">
                <h6 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-images" />
                  Mídias — {book.name}
                  <span className="cross-ref-badge">{bookImages.length}</span>
                </h6>
              </div>
              <div className="book-media-grid">
                {bookImages.map(img => {
                  const m = img.match(/^.+-(\d+):(\d+)\.png$/);
                  const ch = m ? +m[1] : null;
                  const vs = m ? +m[2] : null;
                  return (
                    <div
                      key={img}
                      className="book-media-thumb"
                      onClick={() => setImageModal({
                        src: `/db/imgs/${img}`,
                        title: `${book.name} ${ch}:${vs}`,
                      })}
                    >
                      <img src={`/db/imgs/${img}`} alt={`${book.name} ${ch}:${vs}`} loading="lazy" />
                      <span className="book-media-label">{ch}:{vs}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Image Modal */}
      {imageModal && (
        <div className="image-modal-overlay" onClick={() => setImageModal(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h5>Ilustração — {imageModal.title}</h5>
              <button onClick={() => setImageModal(null)}>&times;</button>
            </div>
            <div className="image-modal-body">
              <img src={imageModal.src} alt={`Ilustração - ${imageModal.title}`} />
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div className="note-modal-overlay" onClick={() => setNoteModal(null)}>
          <div className="note-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-header">
              <h5><i className="fas fa-sticky-note" style={{ color: '#f59e0b', marginRight: '8px' }} />Nota — Versículo {noteModal.verse}</h5>
              <button onClick={() => setNoteModal(null)}>&times;</button>
            </div>
            <div className="note-modal-body">
              <textarea
                ref={noteTextRef}
                className="note-modal-textarea"
                placeholder="Escreva sua nota aqui..."
                value={noteModal.text}
                onChange={(e) => setNoteModal(prev => ({ ...prev, text: e.target.value }))}
              />
            </div>
            <div className="note-modal-footer">
              {notes[noteModal.verse] && (
                <button className="note-modal-btn delete" onClick={deleteNote}>
                  <i className="fas fa-trash-alt" /> Remover
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button className="note-modal-btn cancel" onClick={() => setNoteModal(null)}>
                Cancelar
              </button>
              <button className="note-modal-btn save" onClick={saveNote}>
                <i className="fas fa-check" /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="hl-dot dot-share" title="Compartilhar" onClick={enterSelectMode}>
            <i className="fas fa-share-alt" />
          </div>
        </div>
      )}

      {/* Share floating bar */}
      {selectMode && (
        <div className="share-bar">
          <div className="share-bar-info">
            <i className="fas fa-check-circle" />
            <span>{selected.size} versículo{selected.size !== 1 ? 's' : ''}</span>
          </div>
          <div className="share-bar-actions">
            <button className="share-bar-btn whatsapp" onClick={shareWhatsApp} disabled={selected.size === 0}>
              <i className="fab fa-whatsapp" /> WhatsApp
            </button>
            <button className="share-bar-btn copy" onClick={copyToClipboard} disabled={selected.size === 0}>
              <i className="fas fa-copy" /> Copiar
            </button>
            <button className="share-bar-btn cancel" onClick={cancelSelect}>
              <i className="fas fa-times" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
