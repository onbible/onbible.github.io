import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { loadLetterEntries, normalizeDictionaryKey } from '../lib/dictionaryData';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_VISIBLE = 120;

export default function DictionaryPage() {
  const [activeLetter, setActiveLetter] = useState('A');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [visibleCount, setVisibleCount] = useState(MAX_VISIBLE);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchLetter = useCallback(async (letter) => {
    setLoading(true);
    setVisibleCount(MAX_VISIBLE);
    try {
      const data = await loadLetterEntries(letter);
      setEntries(data);
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

  const filtered = useMemo(() => {
    if (!search.trim()) return entries;
    const q = normalizeDictionaryKey(search);
    return entries.filter(e => {
      const t = normalizeDictionaryKey(e.termo || '');
      const d = normalizeDictionaryKey(e.definicao || '');
      return t.includes(q) || d.includes(q);
    });
  }, [entries, search]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const handleSearch = useCallback((val) => {
    setSearch(val);
    setVisibleCount(MAX_VISIBLE);
  }, []);

  // "Load more" on scroll
  const onScroll = useCallback((e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 300 && visibleCount < filtered.length) {
      setVisibleCount(c => Math.min(c + MAX_VISIBLE, filtered.length));
    }
  }, [visibleCount, filtered.length]);

  return (
    <>
      <div className="page-header">
        <h1><i className="fas fa-book-open" style={{ marginRight: 8 }} />Dicionário Bíblico</h1>
      </div>

      {/* Search */}
      <div className="dict-search-wrap">
        <div className="search-box">
          <i className="fas fa-search" />
          <input
            type="text"
            placeholder="Filtrar termos..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => { setSearch(''); setVisibleCount(MAX_VISIBLE); }}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>
        <span className="dict-count">
          {loading ? '...' : `${filtered.length} termo${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Alphabet bar */}
      <div className="dict-alpha-bar">
        {LETTERS.map(l => (
          <button
            key={l}
            className={`dict-alpha-btn${activeLetter === l ? ' active' : ''}`}
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
        <div className="dict-list" ref={listRef} onScroll={onScroll}>
          {filtered.length === 0 && (
            <div className="dict-empty">
              <i className="fas fa-search" /> Nenhum termo encontrado.
            </div>
          )}
          {visible.map((entry, i) => (
            <button
              key={`${entry.termo}-${i}`}
              className="dict-entry-card"
              onClick={() => setSelectedEntry(entry)}
            >
              <div className="dict-entry-head">
                <span className="dict-entry-term">{entry.termo}</span>
              </div>
              <p className="dict-entry-preview">{entry.definicao}</p>
            </button>
          ))}
          {visibleCount < filtered.length && (
            <div className="dict-load-more">
              <button onClick={() => setVisibleCount(c => Math.min(c + MAX_VISIBLE, filtered.length))}>
                Carregar mais ({filtered.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selectedEntry && (
        <div className="dict-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="dict-modal" onClick={e => e.stopPropagation()}>
            <button className="dict-modal-close" onClick={() => setSelectedEntry(null)}>
              <i className="fas fa-times" />
            </button>
            <div className="dict-modal-header">
              <h2 className="dict-modal-term">{selectedEntry.termo}</h2>
            </div>
            <div className="dict-modal-section">
              <h4><i className="fas fa-align-left" /> Definição</h4>
              <p className="dict-modal-def">{selectedEntry.definicao}</p>
            </div>
            {selectedEntry.definicaoAdicional && (
              <div className="dict-modal-section">
                <h4><i className="fas fa-comment-dots" /> Nota Adicional</h4>
                <p className="dict-modal-def dict-modal-extra">{selectedEntry.definicaoAdicional}</p>
              </div>
            )}
            {selectedEntry.referencias && selectedEntry.referencias.length > 0 && (
              <div className="dict-modal-section">
                <h4><i className="fas fa-book-open" /> Referências</h4>
                <div className="dict-ref-list">
                  {selectedEntry.referencias.map((ref, i) => (
                    <span key={i} className="dict-ref-tag">{ref}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
