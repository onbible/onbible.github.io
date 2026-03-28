import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBibleData } from '../hooks/useBible';

const OT_BOOKS = ['gn','ex','lv','nm','dt','js','jz','rt','1sm','2sm','1rs','2rs','1cr','2cr','ed','ne','et','jó','sl','pv','ec','ct','is','jr','lm','ez','dn','os','jl','am','ob','jn','mq','na','hc','sf','ag','zc','ml'];

const MAX_RESULTS = 80;

// Categories for periodic-table coloring
const CATEGORY = {
  // Pentateuco
  gn:'law',ex:'law',lv:'law',nm:'law',dt:'law',
  // Históricos
  js:'hist',jz:'hist',rt:'hist','1sm':'hist','2sm':'hist','1rs':'hist','2rs':'hist','1cr':'hist','2cr':'hist',ed:'hist',ne:'hist',et:'hist',
  // Poéticos / Sabedoria
  'jó':'poet',sl:'poet',pv:'poet',ec:'poet',ct:'poet',
  // Profetas Maiores
  is:'pmaj',jr:'pmaj',lm:'pmaj',ez:'pmaj',dn:'pmaj',
  // Profetas Menores
  os:'pmin',jl:'pmin',am:'pmin',ob:'pmin',jn:'pmin',mq:'pmin',na:'pmin',hc:'pmin',sf:'pmin',ag:'pmin',zc:'pmin',ml:'pmin',
  // Evangelhos
  mt:'gosp',mc:'gosp',lc:'gosp',jo:'gosp',
  // Atos
  atos:'acts',
  // Cartas Paulinas
  rm:'paul','1co':'paul','2co':'paul',gl:'paul',ef:'paul',fp:'paul',cl:'paul','1ts':'paul','2ts':'paul','1tm':'paul','2tm':'paul',tt:'paul',fm:'paul',
  // Cartas Gerais
  hb:'gen',tg:'gen','1pe':'gen','2pe':'gen','1jo':'gen','2jo':'gen','3jo':'gen',jd:'gen',
  // Profecia / Apocalipse
  ap:'rev',
};

const BOOK_GROUPS = [
  { key: 'law',  label: 'Pentateuco',         icon: 'fas fa-scroll',        testament: 'AT' },
  { key: 'hist', label: 'Históricos',          icon: 'fas fa-landmark',      testament: 'AT' },
  { key: 'poet', label: 'Poéticos',            icon: 'fas fa-feather-alt',   testament: 'AT' },
  { key: 'pmaj', label: 'Profetas Maiores',    icon: 'fas fa-bullhorn',      testament: 'AT' },
  { key: 'pmin', label: 'Profetas Menores',    icon: 'fas fa-volume-down',   testament: 'AT' },
  { key: 'gosp', label: 'Evangelhos',           icon: 'fas fa-cross',         testament: 'NT' },
  { key: 'acts', label: 'Atos dos Apóstolos',  icon: 'fas fa-fire',          testament: 'NT' },
  { key: 'paul', label: 'Cartas Paulinas',     icon: 'fas fa-envelope',      testament: 'NT' },
  { key: 'gen',  label: 'Epístolas Gerais',    icon: 'fas fa-envelope-open', testament: 'NT' },
  { key: 'rev',  label: 'Apocalipse',          icon: 'fas fa-eye',           testament: 'NT' },
];

/* ── Passage reference parser ── */
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
  return {
    book: found,
    chapter,
    verse: v1 ? parseInt(v1) : null,
    verseTo: v2 ? parseInt(v2) : null,
  };
}

/* ── Text search across Bible ── */
function searchVerses(query, books) {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const results = [];
  for (const book of books) {
    for (let ci = 0; ci < book.chapters.length; ci++) {
      const chap = book.chapters[ci];
      for (let vi = 0; vi < chap.length; vi++) {
        const text = chap[vi];
        const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalized.includes(q)) {
          results.push({ book, chapter: ci + 1, verse: vi + 1, text });
          if (results.length >= MAX_RESULTS) return results;
        }
      }
    }
  }
  return results;
}

/* ── Highlight matched text helper ── */
function highlightMatch(text, query) {
  if (!query) return text;
  const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${q})`, 'ig'));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase()
      ? <mark key={i}>{p}</mark>
      : p
  );
}

export default function HomePage() {
  const { bibleData, loading, error } = useBibleData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchMode, setSearchMode] = useState('books'); // 'books' | 'bible'
  const [showResults, setShowResults] = useState(false);
  const [filterCat, setFilterCat] = useState(null);
  const searchBoxRef = useRef(null);
  const debounceRef = useRef(null);

  const books = useMemo(() => {
    if (!bibleData) return [];
    return Array.isArray(bibleData) ? bibleData : Object.values(bibleData);
  }, [bibleData]);

  const bookNumber = useMemo(() => {
    const map = {};
    books.forEach((b, i) => { map[b.abbrev] = i + 1; });
    return map;
  }, [books]);

  // Close results dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced Bible text search
  const [verseResults, setVerseResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const doBibleSearch = useCallback((q) => {
    if (!q || q.length < 3 || !books.length) {
      setVerseResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    // Use requestIdleCallback/setTimeout to avoid blocking UI
    const id = setTimeout(() => {
      setVerseResults(searchVerses(q, books));
      setSearching(false);
    }, 0);
    return () => clearTimeout(id);
  }, [books]);

  const handleSearch = useCallback((val) => {
    setSearch(val);
    if (val.trim()) setShowResults(true);
    else { setShowResults(false); setVerseResults([]); }

    if (searchMode === 'bible') {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doBibleSearch(val.trim()), 300);
    }
  }, [searchMode, doBibleSearch]);

  // Re-trigger bible search when mode switches
  useEffect(() => {
    if (searchMode === 'bible' && search.trim().length >= 3) {
      doBibleSearch(search.trim());
    }
  }, [searchMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Passage reference detected
  const passageRef = useMemo(() => {
    if (searchMode !== 'bible' || !search.trim()) return null;
    return parseRef(search, books);
  }, [search, books, searchMode]);

  // Book filter (only in books mode)
  const filtered = useMemo(() => {
    if (searchMode === 'bible') return books;
    if (!search.trim()) return books;
    const q = search.toLowerCase();
    return books.filter(b => b.name.toLowerCase().includes(q) || b.abbrev.toLowerCase().includes(q));
  }, [books, search, searchMode]);

  const displayBooks = useMemo(() => {
    if (!filterCat) return filtered;
    return filtered.filter(b => CATEGORY[b.abbrev] === filterCat);
  }, [filtered, filterCat]);

  const otBooks = displayBooks.filter(b => OT_BOOKS.includes(b.abbrev));
  const ntBooks = displayBooks.filter(b => !OT_BOOKS.includes(b.abbrev));

  const goToPassage = useCallback((abbrev, chapter, verse) => {
    const url = verse
      ? `/book/${abbrev}?c=${chapter}&v=${verse}`
      : `/book/${abbrev}?c=${chapter}`;
    navigate(url);
    setShowResults(false);
    setSearch('');
  }, [navigate]);

  if (loading) return (
    <div style={{ padding: '28px' }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${60 + Math.random()*30}%` }} />
      ))}
    </div>
  );

  if (error) return (
    <div style={{ padding: '28px', color: '#ef4444' }}>
      <i className="fas fa-exclamation-triangle" /> {error}
    </div>
  );

  return (
    <>
      <div className="page-header">
        <h1><i className="fas fa-bible" style={{ marginRight: '8px' }}></i>Bíblia</h1>
      </div>

      {/* ── Search Box ── */}
      <div className="search-wrapper" ref={searchBoxRef}>
        <div className="search-row">
          <div className="search-box">
            <i className="fas fa-search" />
            <input
              type="text"
              placeholder={searchMode === 'books' ? 'Buscar livro...' : 'Buscar na Bíblia... (ex: amor, João 3:16)'}
              value={search}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => { if (search.trim()) setShowResults(true); }}
            />
            {search && (
              <button className="search-clear" onClick={() => { setSearch(''); setVerseResults([]); setShowResults(false); }}>
                <i className="fas fa-times" />
              </button>
            )}
          </div>

          {/* Mode toggle */}
          <div className="search-mode-toggle">
            <button
              className={`search-mode-btn ${searchMode === 'books' ? 'active' : ''}`}
              onClick={() => { setSearchMode('books'); setShowResults(false); setVerseResults([]); }}
            >
              <i className="fas fa-book" /> Livros
            </button>
            <button
              className={`search-mode-btn ${searchMode === 'bible' ? 'active' : ''}`}
              onClick={() => setSearchMode('bible')}
            >
              <i className="fas fa-search" /> Buscar
            </button>
          </div>
        </div>

        {/* ── Bible Search Results Dropdown ── */}
        {searchMode === 'bible' && showResults && search.trim() && (
          <div className="bible-search-results">
            {/* Passage reference */}
            {passageRef && (
              <div className="search-section">
                <div className="search-section-title">
                  <i className="fas fa-map-marker-alt" /> Passagem encontrada
                </div>
                <button
                  className="search-passage-btn"
                  onClick={() => goToPassage(passageRef.book.abbrev, passageRef.chapter, passageRef.verse)}
                >
                  <span className="search-passage-ref">
                    {passageRef.book.name} {passageRef.chapter}
                    {passageRef.verse ? `:${passageRef.verse}` : ''}
                    {passageRef.verseTo ? `-${passageRef.verseTo}` : ''}
                  </span>
                  <i className="fas fa-arrow-right" />
                </button>
              </div>
            )}

            {/* Occurrences */}
            {search.trim().length >= 3 && (
              <div className="search-section">
                <div className="search-section-title">
                  <i className="fas fa-font" /> Ocorrências
                  {!searching && verseResults.length > 0 && (
                    <span className="search-count">
                      {verseResults.length >= MAX_RESULTS ? `${MAX_RESULTS}+` : verseResults.length} resultado{verseResults.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {searching ? (
                  <div className="search-loading">
                    <i className="fas fa-spinner fa-spin" /> Buscando...
                  </div>
                ) : verseResults.length === 0 ? (
                  <div className="search-empty">Nenhuma ocorrência encontrada.</div>
                ) : (
                  <div className="search-verse-list">
                    {verseResults.map((r, i) => (
                      <button
                        key={i}
                        className="search-verse-item"
                        onClick={() => goToPassage(r.book.abbrev, r.chapter, r.verse)}
                      >
                        <span className="search-verse-ref">
                          {r.book.name} {r.chapter}:{r.verse}
                        </span>
                        <span className="search-verse-text">
                          {highlightMatch(r.text, search.trim())}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {search.trim().length > 0 && search.trim().length < 3 && !passageRef && (
              <div className="search-empty">Digite ao menos 3 caracteres para buscar ocorrências.</div>
            )}
          </div>
        )}
      </div>

      {/* ── Category Filter Badges ── */}
      {!search.trim() && (
        <div className="cat-filter-bar">
          <button
            className={`cat-badge cat-badge-all${!filterCat ? ' active' : ''}`}
            onClick={() => setFilterCat(null)}
          >
            <i className="fas fa-bible" /> Todos
          </button>
          {BOOK_GROUPS.map(g => (
            <button
              key={g.key}
              className={`cat-badge cat-badge-${g.key}${filterCat === g.key ? ' active' : ''}`}
              onClick={() => setFilterCat(filterCat === g.key ? null : g.key)}
            >
              <i className={g.icon} /> {g.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Antigo Testamento ── */}
      {otBooks.length > 0 && (
        <>
          <div className="testament-divider">Antigo Testamento</div>
          <div className="book-grid">
            {otBooks.map(book => (
              <BookCard key={book.abbrev} book={book} number={bookNumber[book.abbrev]} />
            ))}
          </div>
        </>
      )}

      {/* ── Novo Testamento ── */}
      {ntBooks.length > 0 && (
        <>
          <div className="testament-divider">Novo Testamento</div>
          <div className="book-grid">
            {ntBooks.map(book => (
              <BookCard key={book.abbrev} book={book} number={bookNumber[book.abbrev]} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function BookCard({ book, number }) {
  const cat = CATEGORY[book.abbrev] || 'default';
  return (
    <Link
      to={`/book/${book.abbrev}`}
      className={`book-card pt-element cat-${cat}`}
      title={`${book.name}\n${number}º livro da Bíblia\n${book.chapters.length} capítulos`}
    >
      <div className="pt-top">
        <span className="pt-number" title={`${number}º livro da Bíblia`}>{number}</span>
        <span className="pt-chapters" title={`${book.chapters.length} capítulos`}>{book.chapters.length}</span>
      </div>
      <div className="pt-symbol">{book.abbrev.toUpperCase()}</div>
      <div className="pt-name">{book.name}</div>
    </Link>
  );
}
