import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadLetterEntries, normalizeDictionaryKey } from '../lib/dictionaryData';
import { lookupPortugueseWord } from '../lib/portugueseDictionary';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const MAX_VISIBLE = 120;

export default function DictionaryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabIsPt = searchParams.get('tab') === 'pt';

  const [dictionaryMode, setDictionaryMode] = useState(() => (tabIsPt ? 'portuguese' : 'biblical'));
  const [activeLetter, setActiveLetter] = useState('A');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [visibleCount, setVisibleCount] = useState(MAX_VISIBLE);
  const [ptSearch, setPtSearch] = useState(() => searchParams.get('q') || '');
  const [ptResult, setPtResult] = useState(null);
  const [ptLoading, setPtLoading] = useState(false);
  const [ptError, setPtError] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    setDictionaryMode(tabIsPt ? 'portuguese' : 'biblical');
  }, [tabIsPt]);

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

  useEffect(() => {
    if (dictionaryMode !== 'biblical') return;
    fetchLetter(activeLetter);
  }, [activeLetter, fetchLetter, dictionaryMode]);

  useEffect(() => {
    if (dictionaryMode === 'portuguese') setSelectedEntry(null);
  }, [dictionaryMode]);

  const runPtLookup = useCallback(async (raw) => {
    const q = (raw || '').trim();
    if (!q) {
      setPtResult(null);
      return;
    }
    setPtLoading(true);
    setPtError(false);
    setPtResult(null);
    try {
      const r = await lookupPortugueseWord(q);
      setPtResult(r);
    } catch {
      setPtError(true);
    }
    setPtLoading(false);
  }, []);

  useEffect(() => {
    if (!tabIsPt) return;
    const q = searchParams.get('q');
    if (!q?.trim()) {
      setPtResult(null);
      setPtLoading(false);
      return;
    }
    setPtSearch(q);
    runPtLookup(q);
  }, [tabIsPt, searchParams, runPtLookup]);

  const setMode = useCallback(
    (mode) => {
      setDictionaryMode(mode);
      if (mode === 'portuguese') {
        setSearchParams({ tab: 'pt' }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    },
    [setSearchParams]
  );

  const handlePtSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const q = ptSearch.trim();
      if (!q) return;
      setSearchParams({ tab: 'pt', q }, { replace: true });
    },
    [ptSearch, setSearchParams]
  );

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
        <h1><i className="fas fa-book-open" style={{ marginRight: 8 }} />Dicionários</h1>
      </div>

      <div className="dict-mode-tabs" role="tablist" aria-label="Tipo de dicionário">
        <button
          type="button"
          role="tab"
          aria-selected={dictionaryMode === 'biblical'}
          className={`dict-mode-tab${dictionaryMode === 'biblical' ? ' active' : ''}`}
          onClick={() => setMode('biblical')}
        >
          <i className="fas fa-book-open" style={{ marginRight: 8 }} />
          Bíblico
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={dictionaryMode === 'portuguese'}
          className={`dict-mode-tab${dictionaryMode === 'portuguese' ? ' active' : ''}`}
          onClick={() => setMode('portuguese')}
        >
          <i className="fas fa-language" style={{ marginRight: 8 }} />
          Língua portuguesa
        </button>
      </div>

      {dictionaryMode === 'portuguese' && (
        <div className="dict-pt-panel">
          <p className="dict-pt-intro">
            Léxico de português incluído na aplicação. Para garantir definições sem ligação à Internet,
            em Configurações use «Guardar dicionário de português para offline».
          </p>
          <form className="dict-search-wrap dict-pt-form" onSubmit={handlePtSubmit}>
            <div className="search-box">
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Palavra (ex.: amor, acção)…"
                value={ptSearch}
                onChange={(e) => setPtSearch(e.target.value)}
                aria-label="Pesquisar no dicionário de língua portuguesa"
              />
              {ptSearch && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => {
                    setPtSearch('');
                    setPtResult(null);
                    setSearchParams({ tab: 'pt' }, { replace: true });
                  }}
                >
                  <i className="fas fa-times" />
                </button>
              )}
            </div>
            <button type="submit" className="dict-pt-submit">
              Pesquisar
            </button>
          </form>
          {ptLoading && (
            <div style={{ padding: '16px 28px' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton-line" style={{ width: `${55 + (i % 3) * 10}%` }} />
              ))}
            </div>
          )}
          {!ptLoading && ptError && (
            <div className="dict-empty">
              Não foi possível carregar o dicionário local. Se estiver offline, guarde o pacote em
              Configurações.
            </div>
          )}
          {!ptLoading && !ptError && ptResult === null && searchParams.get('q')?.trim() && (
            <div className="dict-empty">
              Sem entrada para «{searchParams.get('q').trim()}» neste léxico (ainda em expansão).
            </div>
          )}
          {!ptLoading && !ptError && ptResult && (
            <div className="dict-pt-result">
              <h2 className="dict-pt-lemma">{ptResult.lemma}</h2>
              <ol className="dict-pt-def-list">
                {ptResult.definitions.map((d, i) => (
                  <li key={i} className="dict-pt-def-item">
                    {d}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {!ptLoading && !ptError && !searchParams.get('q')?.trim() && (
            <p className="dict-pt-hint">Introduza um termo e prima Pesquisar.</p>
          )}
        </div>
      )}

      {dictionaryMode === 'biblical' && (
        <>
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
        </>
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
