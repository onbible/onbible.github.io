import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useBibleData, loadBibleVersion } from '../hooks/useBible';
import { VERSIONS, DEFAULT_VERSION } from '../lib/bibleVersions';
import { DB } from '../lib/db';
import { searchStrongs, lookupStrong } from '../lib/strongs';

/* ── Reference helpers ── */
function formatRefLabel(bookName, chapter, verse, verseTo) {
  let label = `${bookName} ${chapter}`;
  if (verse) label += `:${verse}`;
  if (verseTo) label += `-${verseTo}`;
  return label;
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── Bible book categories (for coloring) ── */
const CATEGORY = {
  gn:'law',ex:'law',lv:'law',nm:'law',dt:'law',
  js:'hist',jz:'hist',rt:'hist','1sm':'hist','2sm':'hist','1rs':'hist','2rs':'hist','1cr':'hist','2cr':'hist',ed:'hist',ne:'hist',et:'hist',
  jo:'poet',sl:'poet',pv:'poet',ec:'poet',ct:'poet',
  is:'pmaj',jr:'pmaj',lm:'pmaj',ez:'pmaj',dn:'pmaj',
  os:'pmin',jl:'pmin',am:'pmin',ob:'pmin',jn:'pmin',mq:'pmin',na:'pmin',hc:'pmin',sf:'pmin',ag:'pmin',zc:'pmin',ml:'pmin',
  mt:'gosp',mc:'gosp',lc:'gosp',joa:'gosp',
  at:'acts',
  rm:'paul','1co':'paul','2co':'paul',gl:'paul',ef:'paul',fp:'paul',cl:'paul','1ts':'paul','2ts':'paul','1tm':'paul','2tm':'paul',tt:'paul',fm:'paul',
  hb:'gen',tg:'gen','1pe':'gen','2pe':'gen','1jo':'gen','2jo':'gen','3jo':'gen',jd:'gen',
  ap:'rev',
};

const REF_RE = /^(.+?)\s+(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?$/;

function parseRef(query, books) {
  const m = query.trim().match(REF_RE);
  if (!m) return null;
  const [, rawBook, ch, v1, v2] = m;
  const q = rawBook.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const found = books.find(b => {
    const name = b.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const abbr = b.abbrev.toLowerCase();
    return name === q || name.startsWith(q) || abbr === q;
  });
  if (!found) return null;
  const chapter = parseInt(ch);
  if (chapter < 1 || chapter > found.chapters.length) return null;
  return { book: found, chapter, verse: v1 ? parseInt(v1) : null, verseTo: v2 ? parseInt(v2) : null };
}

function getVerseText(ref) {
  const chap = ref.book.chapters[ref.chapter - 1];
  if (!chap) return '';
  if (ref.verse && ref.verseTo) {
    return Array.from({ length: ref.verseTo - ref.verse + 1 }, (_, i) => {
      const v = ref.verse + i;
      return `${v} ${chap[v - 1] || ''}`;
    }).join('\n');
  }
  if (ref.verse) return `${ref.verse} ${chap[ref.verse - 1] || ''}`;
  return chap.map((t, i) => `${i + 1} ${t}`).join('\n');
}

/* ── Formatting helpers ── */
const FORMAT_ACTIONS = [
  { key: 'bold',      icon: 'fa-bold',           title: 'Negrito',         wrap: ['**', '**'],       placeholder: 'texto em negrito' },
  { key: 'italic',    icon: 'fa-italic',          title: 'Itálico',         wrap: ['*', '*'],         placeholder: 'texto em itálico' },
  { key: 'underline', icon: 'fa-underline',       title: 'Sublinhado',      wrap: ['__', '__'],       placeholder: 'texto sublinhado' },
  { key: 'strike',    icon: 'fa-strikethrough',   title: 'Tachado',         wrap: ['~~', '~~'],       placeholder: 'texto tachado' },
  { key: 'sep1' },
  { key: 'h1',        icon: 'fa-heading',         title: 'Título',          prefix: '## ',            placeholder: 'Título' },
  { key: 'h2',        icon: 'fa-heading',         title: 'Subtítulo',       prefix: '### ',           placeholder: 'Subtítulo', small: true },
  { key: 'sep2' },
  { key: 'ul',        icon: 'fa-list-ul',         title: 'Lista',           prefix: '- ',             placeholder: 'item da lista' },
  { key: 'ol',        icon: 'fa-list-ol',         title: 'Lista numerada',  prefix: '1. ',            placeholder: 'item da lista' },
  { key: 'quote',     icon: 'fa-quote-right',     title: 'Citação',         prefix: '> ',             placeholder: 'citação' },
  { key: 'sep3' },
  { key: 'hr',        icon: 'fa-minus',           title: 'Separador',       insert: '\n---\n' },
];

/* ── Bible Panel sub-component ── */
function BiblePanel({ version, onChangeVersion, bibleData, bibleStep, selBookAbbrev, selChapter, onNavigate, selVerses, setSelVerses, onInsert, scrollRef, onScroll }) {
  const books = useMemo(() => {
    if (!bibleData) return [];
    return Array.isArray(bibleData) ? bibleData : Object.values(bibleData);
  }, [bibleData]);
  const selBook = useMemo(() => {
    if (!selBookAbbrev || !books.length) return null;
    return books.find(b => b.abbrev === selBookAbbrev) || null;
  }, [selBookAbbrev, books]);
  const verses = selBook && selChapter ? (selBook.chapters[selChapter - 1] || []) : [];

  const resetBible = () => { onNavigate('books', null, null); setSelVerses([]); };
  const pickBook = (book) => { onNavigate('chapters', book.abbrev, null); setSelVerses([]); };
  const pickChapter = (ch) => { onNavigate('verses', selBookAbbrev, ch); setSelVerses([]); };
  const toggleVerse = (vNum) => {
    setSelVerses(prev => prev.includes(vNum) ? prev.filter(v => v !== vNum) : [...prev, vNum].sort((a, b) => a - b));
  };

  return (
    <div className="sermon-bible">
      {/* Version selector */}
      <div className="sermon-bible-version-bar">
        <select value={version} onChange={e => onChangeVersion(e.target.value)}>
          {Object.entries(VERSIONS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Breadcrumb */}
      <div className="sermon-bible-nav">
        <button className={bibleStep === 'books' ? 'active' : ''} onClick={resetBible}>
          <i className="fas fa-book" /> Livros
        </button>
        {selBook && (
          <>
            <i className="fas fa-chevron-right" style={{ fontSize: '10px', color: 'var(--text-muted)' }} />
            <button className={bibleStep === 'chapters' ? 'active' : ''} onClick={() => { onNavigate('chapters', selBookAbbrev, null); setSelVerses([]); }}>
              {selBook.name}
            </button>
          </>
        )}
        {selChapter && (
          <>
            <i className="fas fa-chevron-right" style={{ fontSize: '10px', color: 'var(--text-muted)' }} />
            <button className="active">Cap. {selChapter}</button>
          </>
        )}
      </div>

      {/* Books grid */}
      {bibleStep === 'books' && (
        <div className="sermon-bible-books">
          {books.map(b => (
            <button key={b.abbrev} className={`sermon-bible-book cat-${CATEGORY[b.abbrev] || 'law'}`} onClick={() => pickBook(b)}>
              <span className="abbrev">{b.abbrev.toUpperCase()}</span>
              <span className="name">{b.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chapters grid */}
      {bibleStep === 'chapters' && selBook && (
        <div className="sermon-bible-chapters">
          {selBook.chapters.map((_, i) => (
            <button key={i} className="sermon-bible-chapter" onClick={() => pickChapter(i + 1)}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Verses list */}
      {bibleStep === 'verses' && selBook && selChapter && (
        <>
          {selVerses.length > 0 && (
            <div className="sermon-bible-sel-bar">
              <span>{selVerses.length} versículo{selVerses.length > 1 ? 's' : ''} selecionado{selVerses.length > 1 ? 's' : ''}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="sermon-bible-sel-clear" onClick={() => setSelVerses([])}>Limpar</button>
                <button className="sermon-bible-sel-insert" onClick={() => onInsert(selBook, selChapter, selVerses, setSelVerses)}>
                  <i className="fas fa-plus" /> Inserir
                </button>
              </div>
            </div>
          )}
          <div className="sermon-bible-verses" ref={scrollRef} onScroll={onScroll}>
            {verses.map((text, i) => {
              const vNum = i + 1;
              const selected = selVerses.includes(vNum);
              return (
                <div key={i} className={`sermon-bible-verse${selected ? ' selected' : ''}`} onClick={() => toggleVerse(vNum)}>
                  <span className="sermon-bible-verse-num">{vNum}</span>
                  <span className="sermon-bible-verse-text">{text}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function SermonsPage() {
  const { bibleData: globalBibleData, version: globalVersion } = useBibleData();
  const [sermons, setSermons] = useState([]);
  const [view, setView] = useState(() => {
    return sessionStorage.getItem('sermon_editId') ? 'editor' : 'list';
  });
  const [editId, setEditId] = useState(() => {
    const saved = sessionStorage.getItem('sermon_editId');
    return saved && saved !== 'new' ? Number(saved) : null;
  });
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [expandedRefs, setExpandedRefs] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showBible, setShowBible] = useState(false);
  const [showBible2, setShowBible2] = useState(false);
  const bodyRef = useRef(null);
  const scrollRef1 = useRef(null);
  const scrollRef2 = useRef(null);
  const isSyncingScroll = useRef(false);

  /* ── Strong's Dictionary state ── */
  const [strongsOpen, setStrongsOpen]       = useState(false);
  const [strongsQuery, setStrongsQuery]     = useState('');
  const [strongsLang, setStrongsLang]       = useState('all');
  const [strongsResults, setStrongsResults] = useState([]);
  const [strongsDetail, setStrongsDetail]   = useState(null);
  const [strongsLoading, setStrongsLoading] = useState(false);
  const strongsTimerRef = useRef(null);

  /* ── Bible panel versions ── */
  const [bible1Ver, setBible1Ver] = useState(null); // null = follow global
  const [bible1Data, setBible1Data] = useState(null);
  const [bible2Ver, setBible2Ver] = useState('pt_acf');
  const [bible2Data, setBible2Data] = useState(null);

  /* ── Shared navigation (synced across both panels) ── */
  const [bibleStep, setBibleStep] = useState('books');
  const [selBookAbbrev, setSelBookAbbrev] = useState(null);
  const [selChapter, setSelChapter] = useState(null);

  /* ── Independent verse selection per panel ── */
  const [selVerses, setSelVerses] = useState([]);
  const [selVerses2, setSelVerses2] = useState([]);

  /* ── Bible data for reference rendering (uses global version) ── */
  const books = useMemo(() => {
    if (!globalBibleData) return [];
    return Array.isArray(globalBibleData) ? globalBibleData : Object.values(globalBibleData);
  }, [globalBibleData]);

  /* ── Sync panel 1 data with global version on mount ── */
  useEffect(() => {
    if (globalBibleData && globalVersion) {
      if (!bible1Ver) { setBible1Ver(globalVersion); setBible1Data(globalBibleData); }
    }
  }, [globalBibleData, globalVersion, bible1Ver]);

  /* ── Load Bible data when panel versions change ── */
  useEffect(() => {
    if (!bible1Ver) return;
    loadBibleVersion(bible1Ver).then(setBible1Data).catch(() => {});
  }, [bible1Ver]);

  useEffect(() => {
    if (!bible2Ver) return;
    loadBibleVersion(bible2Ver).then(setBible2Data).catch(() => {});
  }, [bible2Ver]);

  useEffect(() => { DB.getAllSermons().then(setSermons); }, []);
  useEffect(() => { DB.getPref('sermon_bible_open', false).then(v => setShowBible(v)); }, []);
  useEffect(() => { DB.getPref('sermon_bible2_open', false).then(v => setShowBible2(v)); }, []);

  // Restore editor state on refresh
  useEffect(() => {
    const savedId = sessionStorage.getItem('sermon_editId');
    if (savedId && savedId !== 'new') {
      DB.getSermon(Number(savedId)).then(s => {
        if (s) { setTitle(s.title); setBody(s.body || ''); }
        else { setView('list'); sessionStorage.removeItem('sermon_editId'); }
      });
    }
  }, []);

  /* ── Sermon CRUD ── */
  const openNew = useCallback(() => {
    setEditId(null); setTitle(''); setBody('');
    setView('editor');
    sessionStorage.setItem('sermon_editId', 'new');
    resetBible();
  }, []);

  const openEdit = useCallback(async (id) => {
    const s = await DB.getSermon(id);
    if (!s) return;
    setEditId(s.id); setTitle(s.title); setBody(s.body || '');
    setView('editor');
    sessionStorage.setItem('sermon_editId', String(s.id));
    resetBible();
  }, []);

  const save = useCallback(async () => {
    const t = title.trim() || 'Sermão sem título';
    if (editId) await DB.updateSermon(editId, t, body);
    else await DB.createSermon(t, body);
    setSermons(await DB.getAllSermons());
    setView('list');
    sessionStorage.removeItem('sermon_editId');
  }, [editId, title, body]);

  const confirmDelete = useCallback((id) => setDeleteConfirm(id), []);

  const doDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    await DB.deleteSermon(deleteConfirm);
    setSermons(prev => prev.filter(s => s.id !== deleteConfirm));
    setDeleteConfirm(null);
    if (editId === deleteConfirm) setView('list');
  }, [deleteConfirm, editId]);

  const goBack = useCallback(() => { setView('list'); sessionStorage.removeItem('sermon_editId'); }, []);

  /* ── Synchronized scroll between Bible panels ── */
  const handleScroll1 = useCallback(() => {
    if (isSyncingScroll.current) return;
    const src = scrollRef1.current;
    const dst = scrollRef2.current;
    if (!src || !dst) return;
    isSyncingScroll.current = true;
    const ratio = src.scrollTop / (src.scrollHeight - src.clientHeight || 1);
    dst.scrollTop = ratio * (dst.scrollHeight - dst.clientHeight || 1);
    requestAnimationFrame(() => { isSyncingScroll.current = false; });
  }, []);

  const handleScroll2 = useCallback(() => {
    if (isSyncingScroll.current) return;
    const src = scrollRef2.current;
    const dst = scrollRef1.current;
    if (!src || !dst) return;
    isSyncingScroll.current = true;
    const ratio = src.scrollTop / (src.scrollHeight - src.clientHeight || 1);
    dst.scrollTop = ratio * (dst.scrollHeight - dst.clientHeight || 1);
    requestAnimationFrame(() => { isSyncingScroll.current = false; });
  }, []);

  /* ── Shared navigation callback (syncs both panels) ── */
  const navigateBible = useCallback((step, bookAbbrev, chapter) => {
    setBibleStep(step);
    setSelBookAbbrev(bookAbbrev);
    setSelChapter(chapter);
  }, []);

  function resetBible() {
    setBibleStep('books'); setSelBookAbbrev(null); setSelChapter(null);
    setSelVerses([]); setSelVerses2([]);
  }

  /* ── Strong's search with debounce ── */
  useEffect(() => {
    if (!strongsOpen) return;
    if (!strongsQuery.trim()) {
      setStrongsResults([]); setStrongsDetail(null); return;
    }
    clearTimeout(strongsTimerRef.current);
    strongsTimerRef.current = setTimeout(async () => {
      setStrongsLoading(true);
      try {
        const res = await searchStrongs(strongsQuery, strongsLang);
        setStrongsResults(res);
        if (res.length === 1 && res[0].id.toLowerCase() === strongsQuery.toLowerCase().trim()) {
          setStrongsDetail(res[0]);
        } else {
          setStrongsDetail(null);
        }
      } catch { setStrongsResults([]); }
      finally { setStrongsLoading(false); }
    }, 300);
    return () => clearTimeout(strongsTimerRef.current);
  }, [strongsQuery, strongsLang, strongsOpen]);

  const openStrongsDetail = useCallback(async (id) => {
    const entry = await lookupStrong(id);
    if (entry) setStrongsDetail(entry);
  }, []);

  const closeStrongs = useCallback(() => {
    setStrongsOpen(false); setStrongsQuery(''); setStrongsResults([]); setStrongsDetail(null);
  }, []);

  const insertSelectedVerses = useCallback((book, chapter, verses, clearVerses) => {
    if (!book || !chapter || !verses.length) return;
    const sorted = [...verses].sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0], end = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) { end = sorted[i]; }
      else { ranges.push([start, end]); start = sorted[i]; end = sorted[i]; }
    }
    ranges.push([start, end]);

    const tags = ranges.map(([s, e]) => {
      const label = formatRefLabel(book.name, chapter, s, e > s ? e : null);
      return `【${label}】`;
    }).join(' ');

    const ta = bodyRef.current;
    if (ta) {
      const pos = ta.selectionStart;
      const newBody = body.slice(0, pos) + tags + body.slice(ta.selectionEnd);
      setBody(newBody);
      setTimeout(() => { ta.focus(); const p = pos + tags.length; ta.setSelectionRange(p, p); }, 0);
    } else {
      setBody(prev => prev + tags);
    }
    clearVerses([]);
  }, [body]);

  /* ── Text formatting ── */
  const applyFormat = useCallback((action) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = body.slice(start, end);

    let newBody, cursorPos;

    if (action.insert) {
      // Insert a fixed string (e.g. ---) 
      newBody = body.slice(0, start) + action.insert + body.slice(end);
      cursorPos = start + action.insert.length;
    } else if (action.wrap) {
      // Wrap selection: **text**
      const text = sel || action.placeholder;
      const wrapped = action.wrap[0] + text + action.wrap[1];
      newBody = body.slice(0, start) + wrapped + body.slice(end);
      if (sel) {
        cursorPos = start + wrapped.length;
      } else {
        cursorPos = start + action.wrap[0].length;
      }
    } else if (action.prefix) {
      // Line prefix: ensure we're at start of line
      const lineStart = body.lastIndexOf('\n', start - 1) + 1;
      const text = sel || action.placeholder;
      // If at start of line or selection starts a line
      if (start === lineStart) {
        newBody = body.slice(0, start) + action.prefix + text + body.slice(end);
        cursorPos = start + action.prefix.length + text.length;
      } else {
        newBody = body.slice(0, start) + '\n' + action.prefix + text + body.slice(end);
        cursorPos = start + 1 + action.prefix.length + text.length;
      }
    }

    setBody(newBody);
    setTimeout(() => {
      ta.focus();
      if (!sel && action.wrap) {
        // Select placeholder text
        const selStart = cursorPos;
        const selEnd = cursorPos + (action.placeholder || '').length;
        ta.setSelectionRange(selStart, selEnd);
      } else {
        ta.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  }, [body]);

  /* ── Render body with inline references + markdown ── */
  const renderBody = useCallback((text) => {
    // First split by reference tags
    const parts = text.split(/(【[^】]+】)/g);

    const renderFormattedLine = (line) => {
      // Apply inline formatting: **bold**, *italic*, __underline__, ~~strike~~
      const tokens = [];
      // Use a regex that captures formatting markers
      const inlineRe = /(\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|~~(.+?)~~)/g;
      let last = 0;
      let match;
      while ((match = inlineRe.exec(line)) !== null) {
        if (match.index > last) tokens.push(line.slice(last, match.index));
        if (match[2]) tokens.push(<strong key={`b${match.index}`}>{match[2]}</strong>);
        else if (match[3]) tokens.push(<em key={`i${match.index}`}>{match[3]}</em>);
        else if (match[4]) tokens.push(<u key={`u${match.index}`}>{match[4]}</u>);
        else if (match[5]) tokens.push(<s key={`s${match.index}`}>{match[5]}</s>);
        last = match.index + match[0].length;
      }
      if (last < line.length) tokens.push(line.slice(last));
      return tokens.length ? tokens : [line];
    };

    const elements = [];
    let partKey = 0;

    for (const part of parts) {
      const refMatch = part.match(/^【(.+)】$/);
      if (refMatch && books.length) {
        const refStr = refMatch[1];
        const ref = parseRef(refStr, books);
        if (ref) {
          const key = `${partKey}-${refStr}`;
          const isExpanded = expandedRefs[key];
          elements.push(
            <span key={partKey} className="sermon-ref-inline">
              <button className="sermon-ref-tag"
                onClick={() => setExpandedRefs(prev => ({ ...prev, [key]: !prev[key] }))}
                title="Clique para expandir/recolher">
                <i className="fas fa-bible" /> {refStr}
                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: '9px', marginLeft: '4px' }} />
              </button>
              {isExpanded && <span className="sermon-ref-expanded">{getVerseText(ref)}</span>}
            </span>
          );
          partKey++;
          continue;
        }
      }

      // Process markdown blocks line by line
      const lines = part.split('\n');
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];

        // Horizontal rule
        if (/^---+$/.test(line.trim())) {
          elements.push(<hr key={partKey++} className="sermon-fmt-hr" />);
          i++; continue;
        }
        // Headings
        if (/^### (.+)/.test(line)) {
          elements.push(<h4 key={partKey++} className="sermon-fmt-h3">{renderFormattedLine(line.replace(/^### /, ''))}</h4>);
          i++; continue;
        }
        if (/^## (.+)/.test(line)) {
          elements.push(<h3 key={partKey++} className="sermon-fmt-h2">{renderFormattedLine(line.replace(/^## /, ''))}</h3>);
          i++; continue;
        }
        // Block quote (collect consecutive > lines)
        if (/^> (.*)/.test(line)) {
          const quoteLines = [];
          while (i < lines.length && /^> (.*)/.test(lines[i])) {
            quoteLines.push(lines[i].replace(/^> /, ''));
            i++;
          }
          elements.push(
            <blockquote key={partKey++} className="sermon-fmt-quote">
              {quoteLines.map((ql, qi) => <span key={qi}>{renderFormattedLine(ql)}{qi < quoteLines.length - 1 && <br />}</span>)}
            </blockquote>
          );
          continue;
        }
        // Unordered list (collect consecutive - lines)
        if (/^- (.+)/.test(line)) {
          const items = [];
          while (i < lines.length && /^- (.+)/.test(lines[i])) {
            items.push(lines[i].replace(/^- /, ''));
            i++;
          }
          elements.push(
            <ul key={partKey++} className="sermon-fmt-ul">
              {items.map((item, ii) => <li key={ii}>{renderFormattedLine(item)}</li>)}
            </ul>
          );
          continue;
        }
        // Ordered list (collect consecutive N. lines)
        if (/^\d+\.\s+(.+)/.test(line)) {
          const items = [];
          while (i < lines.length && /^\d+\.\s+(.+)/.test(lines[i])) {
            items.push(lines[i].replace(/^\d+\.\s+/, ''));
            i++;
          }
          elements.push(
            <ol key={partKey++} className="sermon-fmt-ol">
              {items.map((item, ii) => <li key={ii}>{renderFormattedLine(item)}</li>)}
            </ol>
          );
          continue;
        }
        // Normal line
        if (line === '') {
          elements.push(<br key={partKey++} />);
        } else {
          elements.push(<span key={partKey++}>{renderFormattedLine(line)}<br /></span>);
        }
        i++;
      }
    }
    return elements;
  }, [books, expandedRefs]);

  const extractedRefs = useMemo(() => {
    if (!body || !books.length) return [];
    const matches = [...body.matchAll(/【([^】]+)】/g)];
    const refs = []; const seen = new Set();
    for (const m of matches) {
      if (seen.has(m[1])) continue;
      seen.add(m[1]);
      const ref = parseRef(m[1], books);
      if (ref) refs.push({ label: m[1], ref });
    }
    return refs;
  }, [body, books]);

  /* ═══════════════ LIST VIEW ═══════════════ */
  if (view === 'list') {
    return (
      <>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1><i className="fas fa-scroll" style={{ marginRight: '8px' }} />Sermões</h1>
          <button className="sermon-new-btn" onClick={openNew}><i className="fas fa-plus" /> Novo Sermão</button>
        </div>
        <div className="sermons-list">
          {sermons.length === 0 ? (
            <div className="sermons-empty">
              <i className="fas fa-scroll" />
              <p>Nenhum sermão ainda.</p>
              <p>Crie seu primeiro sermão e referêncie passagens bíblicas facilmente!</p>
            </div>
          ) : sermons.map(s => (
            <div key={s.id} className="sermon-card" onClick={() => openEdit(s.id)}>
              <div className="sermon-card-header">
                <h3>{s.title || 'Sem título'}</h3>
                <button className="sermon-card-delete" onClick={e => { e.stopPropagation(); confirmDelete(s.id); }} title="Excluir">
                  <i className="fas fa-trash-alt" />
                </button>
              </div>
              <p className="sermon-card-preview">
                {(s.body || '').replace(/【[^】]+】/g, '').slice(0, 120)}{(s.body || '').length > 120 ? '...' : ''}
              </p>
              <div className="sermon-card-meta">
                <span><i className="fas fa-clock" /> {formatDate(s.updated_at)}</span>
                {(() => { const cnt = [...(s.body || '').matchAll(/【[^】]+】/g)].length; return cnt > 0 ? <span><i className="fas fa-bible" /> {cnt} ref.</span> : null; })()}
              </div>
            </div>
          ))}
        </div>

        {deleteConfirm && (
          <div className="note-modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="note-modal-content" onClick={e => e.stopPropagation()}>
              <div className="note-modal-header">
                <h5><i className="fas fa-exclamation-triangle" style={{ color: '#ef4444', marginRight: '8px' }} />Excluir Sermão</h5>
                <button onClick={() => setDeleteConfirm(null)}>&times;</button>
              </div>
              <div className="note-modal-body" style={{ padding: '16px', textAlign: 'center' }}>
                <p>Tem certeza que deseja excluir este sermão? Esta ação não pode ser desfeita.</p>
              </div>
              <div className="note-modal-footer">
                <div style={{ flex: 1 }} />
                <button className="note-modal-btn cancel" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                <button className="note-modal-btn delete" onClick={doDelete}><i className="fas fa-trash-alt" /> Excluir</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ═══════════════ EDITOR VIEW — up to 3 columns ═══════════════ */

  const layoutClass = `sermon-layout${showBible ? ' bible-open' : ''}${showBible2 ? ' bible2-open' : ''}`;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={goBack} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <i className="fas fa-arrow-left" />
          </button>
          <h1 style={{ fontSize: '18px', margin: 0 }}>{editId ? 'Editar Sermão' : 'Novo Sermão'}</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="sermon-toolbar-btn"
            onClick={() => setStrongsOpen(true)}
            title="Dicionário Strong"
          >
            <i className="fas fa-language" /> Strong
          </button>
          <button
            className={`sermon-toolbar-btn${showBible ? ' active' : ''}`}
            onClick={() => setShowBible(p => { const next = !p; DB.setPref('sermon_bible_open', next); return next; })}
            title="Abrir/fechar Bíblia 1"
          >
            <i className="fas fa-bible" /> Bíblia 1
          </button>
          <button
            className={`sermon-toolbar-btn${showBible2 ? ' active' : ''}`}
            onClick={() => setShowBible2(p => { const next = !p; DB.setPref('sermon_bible2_open', next); return next; })}
            title="Abrir/fechar Bíblia 2"
          >
            <i className="fas fa-columns" /> Bíblia 2
          </button>
          <button className="sermon-save-btn" onClick={save}><i className="fas fa-check" /> Salvar</button>
        </div>
      </div>

      <div className={layoutClass}>
        {/* ── Left: Editor ── */}
        <div className="sermon-editor">
          <input className="sermon-title-input" type="text" placeholder="Título do Sermão" value={title} onChange={e => setTitle(e.target.value)} />

          {/* Formatting toolbar */}
          <div className="sermon-fmt-toolbar">
            {FORMAT_ACTIONS.map(a => {
              if (a.key.startsWith('sep')) return <span key={a.key} className="sermon-fmt-sep" />;
              return (
                <button key={a.key} className="sermon-fmt-btn" title={a.title} onClick={() => applyFormat(a)}>
                  <i className={`fas ${a.icon}`} style={a.small ? { fontSize: '10px' } : undefined} />
                  {a.small && <span style={{ fontSize: '9px', marginLeft: '1px' }}>2</span>}
                </button>
              );
            })}
          </div>

          <textarea ref={bodyRef} className="sermon-body-textarea"
            placeholder={"Escreva o conteúdo do sermão aqui...\n\nAbra a Bíblia ao lado para selecionar versículos e inseri-los."}
            value={body} onChange={e => setBody(e.target.value)} />

          {extractedRefs.length > 0 && (
            <div className="sermon-refs-summary">
              <div className="sermon-refs-summary-title"><i className="fas fa-bible" /> Referências utilizadas ({extractedRefs.length})</div>
              <div className="sermon-refs-chips">
                {extractedRefs.map((r, i) => <span key={i} className="sermon-ref-chip">{r.label}</span>)}
              </div>
            </div>
          )}

          {body.trim() && (
            <div className="sermon-preview">
              <div className="sermon-preview-title"><i className="fas fa-eye" /> Pré-visualização</div>
              <div className="sermon-preview-body">
                {title && <h2>{title}</h2>}
                <div className="sermon-preview-text">{renderBody(body)}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Bible 1 ── */}
        {showBible && (
          <BiblePanel
            version={bible1Ver || DEFAULT_VERSION}
            onChangeVersion={setBible1Ver}
            bibleData={bible1Data}
            bibleStep={bibleStep}
            selBookAbbrev={selBookAbbrev}
            selChapter={selChapter}
            onNavigate={navigateBible}
            selVerses={selVerses}
            setSelVerses={setSelVerses}
            onInsert={insertSelectedVerses}
            scrollRef={scrollRef1}
            onScroll={handleScroll1}
          />
        )}

        {/* ── Bible 2 ── */}
        {showBible2 && (
          <BiblePanel
            version={bible2Ver}
            onChangeVersion={setBible2Ver}
            bibleData={bible2Data}
            bibleStep={bibleStep}
            selBookAbbrev={selBookAbbrev}
            selChapter={selChapter}
            onNavigate={navigateBible}
            selVerses={selVerses2}
            setSelVerses={setSelVerses2}
            onInsert={insertSelectedVerses}
            scrollRef={scrollRef2}
            onScroll={handleScroll2}
          />
        )}
      </div>

      {/* Strong's Dictionary Modal */}
      {strongsOpen && (
        <div className="strongs-overlay" onClick={closeStrongs}>
          <div className="strongs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="strongs-modal-header">
              <h5><i className="fas fa-language" style={{ marginRight: '8px', color: 'var(--primary)' }} />Dicionário Strong</h5>
              <button onClick={closeStrongs}>&times;</button>
            </div>

            <div className="strongs-search-bar">
              <div className="strongs-search-input-wrap">
                <i className="fas fa-search strongs-search-icon" />
                <input
                  type="text"
                  className="strongs-search-input"
                  placeholder="Buscar por número (H430, G26), transliteração ou palavra..."
                  value={strongsQuery}
                  onChange={(e) => setStrongsQuery(e.target.value)}
                  autoFocus
                />
                {strongsQuery && (
                  <button className="strongs-search-clear" onClick={() => { setStrongsQuery(''); setStrongsResults([]); setStrongsDetail(null); }}>
                    <i className="fas fa-times" />
                  </button>
                )}
              </div>
              <div className="strongs-lang-tabs">
                {[['all','Todos'],['hebrew','Hebraico'],['greek','Grego']].map(([val, label]) => (
                  <button
                    key={val}
                    className={`strongs-lang-tab${strongsLang === val ? ' active' : ''}`}
                    onClick={() => setStrongsLang(val)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="strongs-modal-body">
              {strongsDetail && (
                <div className="strongs-detail-card">
                  <button className="strongs-detail-back" onClick={() => setStrongsDetail(null)}>
                    <i className="fas fa-arrow-left" /> Voltar aos resultados
                  </button>
                  <div className="strongs-detail-head">
                    <span className={`strongs-badge ${strongsDetail.lang === 'Hebraico' ? 'heb' : 'grk'}`}>
                      {strongsDetail.id}
                    </span>
                    <span className="strongs-detail-lang">{strongsDetail.lang}</span>
                  </div>
                  <div className="strongs-detail-lemma">{strongsDetail.lemma}</div>
                  <div className="strongs-detail-row">
                    <span className="strongs-detail-label">Transliteração:</span>
                    <span className="strongs-detail-value">{strongsDetail.translit}</span>
                  </div>
                  <div className="strongs-detail-row">
                    <span className="strongs-detail-label">Pronúncia:</span>
                    <span className="strongs-detail-value strongs-pron">{strongsDetail.pron}</span>
                  </div>
                  <div className="strongs-detail-def">
                    <span className="strongs-detail-label">Definição:</span>
                    <p>{strongsDetail.def}</p>
                  </div>
                </div>
              )}

              {!strongsDetail && strongsLoading && (
                <div className="strongs-loading">
                  <i className="fas fa-spinner fa-spin" /> Buscando...
                </div>
              )}

              {!strongsDetail && !strongsLoading && strongsQuery && strongsResults.length === 0 && (
                <div className="strongs-empty">
                  <i className="fas fa-search" style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.4 }} />
                  <p>Nenhum resultado para "<strong>{strongsQuery}</strong>"</p>
                </div>
              )}

              {!strongsDetail && !strongsLoading && strongsResults.length > 0 && (
                <div className="strongs-results-list">
                  {strongsResults.map((entry) => (
                    <div key={entry.id} className="strongs-result-item" onClick={() => openStrongsDetail(entry.id)}>
                      <div className="strongs-result-top">
                        <span className={`strongs-badge sm ${entry.lang === 'Hebraico' ? 'heb' : 'grk'}`}>
                          {entry.id}
                        </span>
                        <span className="strongs-result-lemma">{entry.lemma}</span>
                        <span className="strongs-result-translit">({entry.translit})</span>
                      </div>
                      <div className="strongs-result-def">{entry.def.length > 100 ? entry.def.slice(0, 100) + '…' : entry.def}</div>
                    </div>
                  ))}
                </div>
              )}

              {!strongsDetail && !strongsQuery && (
                <div className="strongs-welcome">
                  <div className="strongs-welcome-icon">
                    <i className="fas fa-book-open" />
                  </div>
                  <h6>Léxico Bíblico Strong</h6>
                  <p>Pesquise raízes etimológicas em Hebraico (AT) e Grego (NT).</p>
                  <div className="strongs-examples">
                    <span onClick={() => setStrongsQuery('H430')}>H430 — Elohim</span>
                    <span onClick={() => setStrongsQuery('H3068')}>H3068 — YHWH</span>
                    <span onClick={() => setStrongsQuery('G26')}>G26 — Agapē</span>
                    <span onClick={() => setStrongsQuery('G5485')}>G5485 — Charis</span>
                    <span onClick={() => setStrongsQuery('G3056')}>G3056 — Logos</span>
                    <span onClick={() => setStrongsQuery('H7965')}>H7965 — Shalom</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
