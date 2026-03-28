import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBibleData } from '../hooks/useBible';
import { onBibleDB } from '../lib/db';

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
  const [recentBooks, setRecentBooks] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [filterCat, setFilterCat] = useState(null);
  const searchBoxRef = useRef(null);
  const debounceRef = useRef(null);

  /* ── Verse of the Day ── */
  const verseOfDay = useMemo(() => {
    if (!bibleData) return null;
    const VOTD = [
      ['sl',118,24],['pv',3,5],['is',41,10],['jr',29,11],['sl',23,1],
      ['fp',4,13],['rm',8,28],['jo',3,16],['sl',46,1],['is',40,31],
      ['js',1,9],['mt',11,28],['rm',15,13],['sl',119,105],['pv',18,10],
      ['2tm',1,7],['sl',27,1],['is',26,3],['hb',11,1],['sl',37,4],
      ['rm',12,12],['mt',5,16],['sl',91,1],['ef',2,8],['sl',34,8],
      ['1co',16,13],['is',43,2],['sl',121,1],['pv',16,3],['mt',6,33],
      ['sl',139,14],['rm',8,31],['jo',14,27],['sl',56,3],['is',55,8],
      ['gl',5,22],['sl',100,4],['pv',22,6],['mt',7,7],['sl',62,1],
      ['ef',6,10],['is',12,2],['sl',143,8],['rm',5,8],['jo',8,32],
      ['sl',19,1],['pv',4,23],['mt',28,20],['sl',51,10],['is',53,5],
      ['1jo',4,19],['sl',103,1],['hb',13,8],['sl',40,1],['pv',3,6],
      ['cl',3,23],['sl',90,12],['is',41,13],['jo',10,10],['sl',145,18],
      ['rm',6,23],['mt',22,37],['sl',73,26],['pv',11,25],['ef',3,20],
      ['sl',16,11],['is',40,29],['jo',15,5],['sl',130,5],['pv',12,25],
      ['tg',1,17],['sl',84,11],['rm',12,2],['mt',5,6],['sl',147,3],
      ['1pe',5,7],['is',9,6],['jo',1,12],['sl',33,4],['pv',15,1],
      ['2co',12,9],['sl',46,10],['dt',31,6],['jo',16,33],['sl',25,4],
      ['rm',1,16],['mt',19,26],['sl',18,2],['pv',2,6],['ef',4,32],
      ['sl',36,5],['is',30,15],['jo',6,35],['sl',116,1],['1ts',5,16],
      ['sl',63,1],['mt',11,29],['pv',3,3],['rm',8,38],['sl',138,8],
      ['is',58,11],['jo',11,25],['sl',86,5],['hb',12,2],['pv',19,21],
      ['ap',21,4],['sl',28,7],['mt',5,9],['rm',10,17],['is',49,15],
      ['jo',4,14],['sl',71,5],['ef',2,10],['pv',10,22],['sl',32,8],
      ['mt',6,34],['rm',14,8],['is',61,1],['jo',13,34],['sl',48,14],
      ['cl',3,15],['pv',16,9],['sl',9,1],['1co',13,4],['is',46,4],
      ['jo',14,6],['sl',107,1],['mt',5,14],['rm',5,1],['pv',3,7],
      ['sl',104,33],['ef',1,3],['is',54,10],['jo',8,12],['sl',68,19],
      ['hb',4,16],['pv',14,26],['mt',7,12],['sl',117,1],['rm',12,21],
      ['jo',14,1],['sl',92,1],['is',40,8],['ef',6,18],['pv',27,1],
      ['sl',4,8],['mt',6,26],['rm',8,1],['jo',15,12],['1jo',4,8],
      ['sl',30,5],['is',6,8],['pv',1,7],['ef',5,2],['sl',8,1],
      ['mt',5,44],['rm',12,1],['jo',17,3],['sl',96,1],['pv',16,24],
      ['is',25,1],['sl',150,6],['hb',10,23],['jo',20,31],['sl',113,3],
      ['mt',5,3],['rm',11,33],['ef',4,2],['pv',31,30],['sl',149,1],
      ['1co',15,58],['is',12,5],['jo',21,17],['sl',135,3],['mt',5,8],
      ['rm',2,4],['pv',8,11],['ef',5,8],['sl',105,1],['is',1,18],
      ['jo',3,36],['sl',126,3],['hb',11,6],['pv',21,21],['mt',25,40],
      ['rm',3,23],['sl',111,10],['ef',4,26],['is',48,17],['jo',5,24],
      ['sl',66,1],['pv',23,17],['mt',4,4],['rm',13,8],['sl',77,11],
      ['1pe',2,9],['is',33,6],['jo',7,37],['sl',85,10],['ef',3,16],
      ['pv',24,16],['sl',42,1],['mt',18,20],['rm',8,26],['is',35,4],
      ['jo',12,46],['sl',57,1],['hb',13,5],['pv',28,13],['ef',1,7],
      ['sl',34,1],['mt',16,26],['rm',10,9],['is',32,17],['jo',6,47],
      ['sl',3,3],['pv',3,9],['1co',10,13],['ef',2,4],['sl',124,8],
      ['mt',11,30],['rm',15,4],['is',66,13],['jo',14,15],['sl',52,8],
      ['pv',17,17],['sl',131,2],['hb',12,11],['ef',5,15],['mt',6,21],
      ['rm',12,10],['is',40,11],['jo',9,25],['sl',31,24],['pv',2,3],
      ['sl',115,1],['1co',2,9],['ef',6,11],['jo',1,1],['sl',95,1],
      ['mt',5,48],['rm',4,20],['is',42,10],['pv',9,10],['sl',29,2],
      ['hb',6,10],['mt',10,31],['jo',15,16],['ef',4,15],['sl',65,4],
      ['rm',8,37],['pv',20,7],['is',45,22],['sl',144,1],['1jo',5,4],
    ];
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const entry = VOTD[dayOfYear % VOTD.length];
    const [abbrev, ch, v] = entry;
    const allBooks = Array.isArray(bibleData) ? bibleData : Object.values(bibleData);
    const book = allBooks.find(b => b.abbrev === abbrev);
    if (!book) return null;
    const text = book.chapters[ch - 1]?.[v - 1];
    if (!text) return null;
    return { abbrev, bookName: book.name, chapter: ch, verse: v, text };
  }, [bibleData]);

  const books = useMemo(() => {
    if (!bibleData) return [];
    return Array.isArray(bibleData) ? bibleData : Object.values(bibleData);
  }, [bibleData]);

  const bookNumber = useMemo(() => {
    const map = {};
    books.forEach((b, i) => { map[b.abbrev] = i + 1; });
    return map;
  }, [books]);

  // Load reading state from DB
  useEffect(() => {
    if (!bibleData) return;
    onBibleDB.reading_state.toArray().then(states => {
      const items = states
        .map(s => {
          const book = Object.values(bibleData).find(b => b.abbrev === s.book_abbrev);
          if (!book) return null;
          return { abbrev: s.book_abbrev, name: book.name, chapter: s.last_chapter, total: book.chapters.length };
        })
        .filter(Boolean);
      setRecentBooks(items);
    });
  }, [bibleData]);

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
            <i className="fas fa-search" /> Buscar na Bíblia
          </button>
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

      {/* ── Verse of the Day ── */}
      {verseOfDay && !search.trim() && (
        <div
          className="votd-card"
          onClick={() => navigate(`/book/${verseOfDay.abbrev}?c=${verseOfDay.chapter}`)}
          style={{ cursor: 'pointer' }}
        >
          <div className="votd-label">
            <i className="fas fa-sun" /> Versículo do Dia
          </div>
          <div className="votd-text">"{verseOfDay.text}"</div>
          <div className="votd-ref">
            — {verseOfDay.bookName} {verseOfDay.chapter}:{verseOfDay.verse}
          </div>
        </div>
      )}

      {/* Continue Reading */}
      {recentBooks.length > 0 && !search.trim() && (
        <>
          <div className="testament-divider">
            <i className="fas fa-book-reader" style={{ marginRight: '6px' }}></i>Continuar Leitura
          </div>
          <div className="recent-books">
            {recentBooks.map(r => (
              <Link key={r.abbrev} to={`/book/${r.abbrev}`} className="recent-book-card">
                <div className="recent-book-name">{r.name}</div>
                <div className="recent-book-chapter">
                  Capítulo {r.chapter} <span className="recent-book-of">/ {r.total}</span>
                </div>
                <div className="recent-book-progress">
                  <div className="recent-book-bar" style={{ width: `${Math.round((r.chapter / r.total) * 100)}%` }}></div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

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
