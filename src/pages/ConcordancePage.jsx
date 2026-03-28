import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AVAILABLE_LETTERS = 'ABCDEFGHIJLMNOPQRSTY'.split('');
const MAX_VISIBLE = 80;

/* referenceToLink: converts "Gênesis 1.2" → { abbrev, chapter } for navigation */
const bookMap = {
  'gênesis': 'gn', 'êxodo': 'ex', 'levítico': 'lv', 'números': 'nm',
  'deuteronômio': 'dt', 'josué': 'js', 'juízes': 'jz', 'rute': 'rt',
  '1 samuel': '1sm', '2 samuel': '2sm', '1 reis': '1rs', '2 reis': '2rs',
  '1 crônicas': '1cr', '2 crônicas': '2cr', 'esdras': 'ed', 'neemias': 'ne',
  'ester': 'et', 'jó': 'jo', 'salmos': 'sl', 'provérbios': 'pv',
  'eclesiastes': 'ec', 'cânticos': 'ct', 'isaías': 'is', 'jeremias': 'jr',
  'lamentações': 'lm', 'ezequiel': 'ez', 'daniel': 'dn', 'oséias': 'os',
  'joel': 'jl', 'amós': 'am', 'obadias': 'ob', 'jonas': 'jn',
  'miquéias': 'mq', 'naum': 'na', 'habacuque': 'hc', 'sofonias': 'sf',
  'ageu': 'ag', 'zacarias': 'zc', 'malaquias': 'ml',
  'mateus': 'mt', 'marcos': 'mc', 'lucas': 'lc', 'joão': 'jo',
  'atos': 'at', 'romanos': 'rm', '1 coríntios': '1co', '2 coríntios': '2co',
  'gálatas': 'gl', 'efésios': 'ef', 'filipenses': 'fp', 'colossenses': 'cl',
  '1 tessalonicenses': '1ts', '2 tessalonicenses': '2ts',
  '1 timóteo': '1tm', '2 timóteo': '2tm', 'tito': 'tt', 'filemom': 'fm',
  'hebreus': 'hb', 'tiago': 'tg', '1 pedro': '1pe', '2 pedro': '2pe',
  '1 joão': '1jo', '2 joão': '2jo', '3 joão': '3jo',
  'judas': 'jd', 'apocalipse': 'ap',
};

function parseReference(ref) {
  if (!ref) return null;
  // Format: "Livro Cap.Ver" or "Livro Cap:Ver" or "1 Samuel 3.5"
  const match = ref.match(/^(.+?)\s+(\d+)[.:](\d+)$/);
  if (!match) return null;
  const bookName = match[1].toLowerCase().trim();
  const chapter = parseInt(match[2], 10);
  const verse = parseInt(match[3], 10);
  const abbrev = bookMap[bookName];
  if (!abbrev) return null;
  return { abbrev, chapter, verse };
}

/* Loads all chunks for a given letter */
async function loadLetter(letter) {
  const l = letter.toLowerCase();
  const indexResp = await fetch('/db/concordancia/lista_letras.json');
  const index = await indexResp.json();
  const chunks = index[l];
  if (!chunks || !chunks.length) return [];

  const all = await Promise.all(
    chunks.map(async (chunk) => {
      const resp = await fetch(`/db/concordancia/${l}/${chunk}.json`);
      const data = await resp.json();
      const entries = Object.values(data).flat();
      return entries;
    })
  );
  return all.flat();
}

const letterCache = {};

export default function ConcordancePage() {
  const [activeLetter, setActiveLetter] = useState('A');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [visibleCount, setVisibleCount] = useState(MAX_VISIBLE);
  const listRef = useRef(null);
  const navigate = useNavigate();

  const fetchLetter = useCallback(async (letter) => {
    setLoading(true);
    setVisibleCount(MAX_VISIBLE);
    try {
      if (letterCache[letter]) {
        setEntries(letterCache[letter]);
      } else {
        const data = await loadLetter(letter);
        letterCache[letter] = data;
        setEntries(data);
      }
    } catch {
      setEntries([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLetter(activeLetter); }, [activeLetter, fetchLetter]);

  const handleLetterClick = useCallback((l) => {
    setActiveLetter(l);
    setSearch('');
    listRef.current?.scrollTo?.({ top: 0 });
  }, []);

  const normalize = useCallback((str) =>
    (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  []);

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = normalize(search);
    return entries.filter(e => {
      const word = normalize(e.palavra || e.termo);
      // Also search within concordance texts and references
      const concTexts = (e.concordancias || []).map(c =>
        normalize(c.texto) + ' ' + normalize(c.referencia)
      ).join(' ');
      return word.includes(q) || concTexts.includes(q);
    });
  }, [entries, search, normalize]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const handleSearch = useCallback((val) => {
    setSearch(val);
    setVisibleCount(MAX_VISIBLE);
  }, []);

  const onScroll = useCallback((e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 300 && visibleCount < filtered.length) {
      setVisibleCount(c => Math.min(c + MAX_VISIBLE, filtered.length));
    }
  }, [visibleCount, filtered.length]);

  const goToVerse = useCallback((ref) => {
    const parsed = parseReference(ref);
    if (parsed) {
      navigate(`/book/${parsed.abbrev}?c=${parsed.chapter}&v=${parsed.verse}`);
    }
  }, [navigate]);

  return (
    <>
      <div className="page-header">
        <h1><i className="fas fa-search-plus" style={{ marginRight: 8 }} />Concordância Bíblica</h1>
      </div>

      {/* Search */}
      <div className="conc-search-wrap">
        <div className="search-box">
          <i className="fas fa-search" />
          <input
            type="text"
            placeholder="Buscar palavra ou frase na concordância..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => { setSearch(''); setVisibleCount(MAX_VISIBLE); }}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>
        <span className="conc-count">
          {loading ? '...' : `${filtered.length} termo${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Alphabet bar */}
      <div className="conc-alpha-bar">
        {AVAILABLE_LETTERS.map(l => (
          <button
            key={l}
            className={`conc-alpha-btn${activeLetter === l ? ' active' : ''}`}
            onClick={() => handleLetterClick(l)}
          >{l}</button>
        ))}
      </div>

      {/* Entry list */}
      {loading ? (
        <div style={{ padding: '20px 28px' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-line" style={{ width: `${50 + Math.random() * 40}%` }} />
          ))}
        </div>
      ) : (
        <div className="conc-list" ref={listRef} onScroll={onScroll}>
          {filtered.length === 0 && (
            <div className="conc-empty">
              <i className="fas fa-search" /> Nenhum termo encontrado.
            </div>
          )}
          {visible.map((entry, i) => {
            const word = entry.palavra || entry.termo || '';
            const count = entry.ocorrencias || (entry.concordancias || []).length;
            const firstRef = (entry.concordancias || [])[0];
            return (
              <button
                key={`${word}-${i}`}
                className="conc-entry-card"
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="conc-entry-head">
                  <span className="conc-entry-term">{word}</span>
                  <span className="conc-entry-badge">{count} ocorrência{count !== 1 ? 's' : ''}</span>
                </div>
                {firstRef && (
                  <p className="conc-entry-preview">
                    <span className="conc-entry-ref">{firstRef.referencia}</span> — {firstRef.texto}
                  </p>
                )}
                {(entry['veja tambem'] || []).length > 0 && (
                  <div className="conc-entry-tags">
                    {entry['veja tambem'].slice(0, 4).map((t, j) => (
                      <span key={j} className="conc-tag-mini">{t}</span>
                    ))}
                    {entry['veja tambem'].length > 4 && (
                      <span className="conc-tag-mini conc-tag-more">+{entry['veja tambem'].length - 4}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
          {visibleCount < filtered.length && (
            <div className="conc-load-more">
              <button onClick={() => setVisibleCount(c => Math.min(c + MAX_VISIBLE, filtered.length))}>
                Carregar mais ({filtered.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selectedEntry && (
        <div className="conc-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="conc-modal" onClick={e => e.stopPropagation()}>
            <button className="conc-modal-close" onClick={() => setSelectedEntry(null)}>
              <i className="fas fa-times" />
            </button>
            <div className="conc-modal-header">
              <h2 className="conc-modal-term">{selectedEntry.palavra || selectedEntry.termo}</h2>
              <div className="conc-modal-meta">
                <span className="conc-modal-badge">
                  <i className="fas fa-list-ol" /> {selectedEntry.ocorrencias || (selectedEntry.concordancias || []).length} ocorrência{(selectedEntry.ocorrencias || (selectedEntry.concordancias || []).length) !== 1 ? 's' : ''}
                </span>
                {selectedEntry.fonte && (
                  <span className="conc-modal-fonte">
                    <i className="fas fa-link" /> {selectedEntry.fonte}
                  </span>
                )}
              </div>
            </div>

            {/* Veja também */}
            {(selectedEntry['veja tambem'] || []).length > 0 && (
              <div className="conc-modal-section">
                <h4><i className="fas fa-tags" /> Veja também</h4>
                <div className="conc-tag-list">
                  {selectedEntry['veja tambem'].map((t, i) => (
                    <span key={i} className="conc-tag">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Concordances list */}
            <div className="conc-modal-section">
              <h4><i className="fas fa-bible" /> Referências</h4>
              <div className="conc-ref-list">
                {(selectedEntry.concordancias || []).map((c, i) => {
                  const canNavigate = !!parseReference(c.referencia);
                  return (
                    <div key={i} className="conc-ref-item">
                      <button
                        className={`conc-ref-link${canNavigate ? '' : ' disabled'}`}
                        onClick={() => canNavigate && goToVerse(c.referencia)}
                        title={canNavigate ? 'Abrir na Bíblia' : c.referencia}
                        disabled={!canNavigate}
                      >
                        <i className="fas fa-map-marker-alt" />
                        {c.referencia}
                      </button>
                      <p className="conc-ref-text">{c.texto}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
