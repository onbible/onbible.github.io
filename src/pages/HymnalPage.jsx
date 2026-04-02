import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

const MAX_VISIBLE = 80;
const INDEX_URL = '/db/cantorcristao/cantorcristao_index.json';
const HYMN_URL = (n) => `/db/cantorcristao/${n}.json`;

let indexCache = null;
const hymnCache = {};

export default function HymnalPage() {
  const [hymns, setHymns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedHymn, setSelectedHymn] = useState(null);
  const [hymnLoading, setHymnLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(MAX_VISIBLE);
  const [fontSize, setFontSize] = useState(18);
  const listRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        if (indexCache) {
          setHymns(indexCache);
        } else {
          const resp = await fetch(INDEX_URL);
          const data = await resp.json();
          indexCache = data;
          setHymns(data);
        }
      } catch {
        setHymns([]);
      }
      setLoading(false);
    })();
  }, []);

  const openHymn = useCallback(async (numero) => {
    setHymnLoading(true);
    try {
      if (hymnCache[numero]) {
        setSelectedHymn(hymnCache[numero]);
      } else {
        const resp = await fetch(HYMN_URL(numero));
        const data = await resp.json();
        hymnCache[numero] = data;
        setSelectedHymn(data);
      }
    } catch {
      setSelectedHymn(null);
    }
    setHymnLoading(false);
  }, []);

  const closeHymn = useCallback(() => setSelectedHymn(null), []);

  const normalize = (s) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filtered = useMemo(() => {
    if (!search.trim()) return hymns;
    const q = normalize(search);
    return hymns.filter((h) => {
      const t = normalize(h.titulo || '');
      return t.includes(q) || h.numero.includes(search.trim());
    });
  }, [hymns, search]);

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const onScroll = useCallback(
    (e) => {
      const el = e.target;
      if (
        el.scrollHeight - el.scrollTop - el.clientHeight < 300 &&
        visibleCount < filtered.length
      ) {
        setVisibleCount((c) => Math.min(c + MAX_VISIBLE, filtered.length));
      }
    },
    [visibleCount, filtered.length]
  );

  const navigateHymn = useCallback(
    (dir) => {
      if (!selectedHymn) return;
      const num = parseInt(selectedHymn.numero, 10) + dir;
      if (num >= 1 && num <= hymns.length) openHymn(String(num));
    },
    [selectedHymn, hymns.length, openHymn]
  );

  useEffect(() => {
    if (!selectedHymn) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') closeHymn();
      if (e.key === 'ArrowLeft') navigateHymn(-1);
      if (e.key === 'ArrowRight') navigateHymn(1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedHymn, closeHymn, navigateHymn]);

  const stanzas = useMemo(() => {
    if (!selectedHymn?.letra) return [];
    return selectedHymn.letra.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
  }, [selectedHymn]);

  return (
    <>
      <div className="page-header">
        <h1>
          <i className="fas fa-music" style={{ marginRight: 8 }} />
          Cantor Cristão
        </h1>
      </div>

      {/* Search */}
      <div className="hymn-search-wrap">
        <div className="search-box">
          <i className="fas fa-search" />
          <input
            type="text"
            placeholder="Buscar por número ou título..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(MAX_VISIBLE);
            }}
          />
          {search && (
            <button
              className="search-clear"
              onClick={() => {
                setSearch('');
                setVisibleCount(MAX_VISIBLE);
              }}
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>
        <span className="hymn-count">
          {loading ? '...' : `${filtered.length} hino${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Hymn list */}
      {loading ? (
        <div style={{ padding: '20px 28px' }}>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="skeleton-line" style={{ width: `${50 + Math.random() * 40}%` }} />
          ))}
        </div>
      ) : (
        <div className="hymn-list" ref={listRef} onScroll={onScroll}>
          {filtered.length === 0 && (
            <div className="hymn-empty">
              <i className="fas fa-search" /> Nenhum hino encontrado.
            </div>
          )}
          {visible.map((h) => (
            <button
              key={h.numero}
              className="hymn-card"
              onClick={() => openHymn(h.numero)}
            >
              <span className="hymn-card-number">{h.numero}</span>
              <span className="hymn-card-title">{h.titulo}</span>
              <i className="fas fa-chevron-right hymn-card-arrow" />
            </button>
          ))}
          {visibleCount < filtered.length && (
            <div className="hymn-load-more">
              <button
                onClick={() =>
                  setVisibleCount((c) => Math.min(c + MAX_VISIBLE, filtered.length))
                }
              >
                Carregar mais ({filtered.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {(selectedHymn || hymnLoading) && (
        <div className="hymn-overlay" onClick={closeHymn}>
          <div className="hymn-modal" onClick={(e) => e.stopPropagation()}>
            <button className="hymn-modal-close" onClick={closeHymn}>
              <i className="fas fa-times" />
            </button>

            {hymnLoading ? (
              <div style={{ padding: 24 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton-line" style={{ width: `${40 + Math.random() * 50}%` }} />
                ))}
              </div>
            ) : (
              <>
                <div className="hymn-modal-header">
                  <span className="hymn-modal-number">Hino {selectedHymn.numero}</span>
                  <h2 className="hymn-modal-title">{selectedHymn.titulo}</h2>
                </div>

                {/* Font size controls */}
                <div className="hymn-font-controls">
                  <button
                    onClick={() => setFontSize((s) => Math.max(12, s - 2))}
                    title="Diminuir fonte"
                  >
                    <i className="fas fa-minus" />
                  </button>
                  <span className="hymn-font-label">{fontSize}px</span>
                  <button
                    onClick={() => setFontSize((s) => Math.min(32, s + 2))}
                    title="Aumentar fonte"
                  >
                    <i className="fas fa-plus" />
                  </button>
                </div>

                <div className="hymn-modal-body" style={{ fontSize }}>
                  {stanzas.length > 0 ? (
                    stanzas.map((stanza, i) => {
                      const isCoro = /^coro:/i.test(stanza);
                      return (
                        <div
                          key={i}
                          className={`hymn-stanza${isCoro ? ' hymn-stanza--coro' : ''}`}
                        >
                          {stanza.split('\n').map((line, j) => (
                            <p key={j} className="hymn-line">
                              {line}
                            </p>
                          ))}
                        </div>
                      );
                    })
                  ) : (
                    <div className="hymn-no-lyrics">
                      <i className="fas fa-file-alt" />
                      <p>Letra ainda não disponível.</p>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="hymn-nav">
                  <button
                    className="hymn-nav-btn"
                    disabled={parseInt(selectedHymn.numero, 10) <= 1}
                    onClick={() => navigateHymn(-1)}
                  >
                    <i className="fas fa-chevron-left" /> Anterior
                  </button>
                  <button
                    className="hymn-nav-btn"
                    disabled={parseInt(selectedHymn.numero, 10) >= hymns.length}
                    onClick={() => navigateHymn(1)}
                  >
                    Próximo <i className="fas fa-chevron-right" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
