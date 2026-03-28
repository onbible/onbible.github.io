import { useState, useEffect } from 'react';
import { BOOK_FILE_MAP, PT_NAMES, loadFile, translateRef, getVerseText } from './CrossReferences';

export default function ChapterCrossReferences({ bookAbbrev, chapter, bibleData }) {
  const [allRefs, setAllRefs]       = useState({}); // { verseNum: [ref1, ref2, ...] }
  const [loading, setLoading]       = useState(true);
  const [collapsed, setCollapsed]   = useState(false);
  const [expandedVerse, setExpandedVerse] = useState(null);

  const info = BOOK_FILE_MAP[bookAbbrev];
  const ptBook = info ? (PT_NAMES[info.n] || info.n) : bookAbbrev;

  useEffect(() => {
    if (!info) { setLoading(false); setAllRefs({}); return; }
    setLoading(true);
    setExpandedVerse(null);
    loadFile(info.f)
      .then(data => {
        const map = {};
        for (const [key, refs] of Object.entries(data)) {
          if (!key.startsWith(info.n + ' ')) continue;
          const m = key.match(/(\d+):(\d+)$/);
          if (!m) continue;
          const ch = +m[1], vs = +m[2];
          if (ch === chapter && refs.length > 0) {
            map[vs] = refs;
          }
        }
        setAllRefs(map);
      })
      .catch(() => setAllRefs({}))
      .finally(() => setLoading(false));
  }, [bookAbbrev, chapter, info]);

  const verseNums = Object.keys(allRefs).map(Number).sort((a, b) => a - b);
  const hasRefs = verseNums.length > 0;

  return (
    <div id="cross-ref-panel" className="cross-ref-chapter-panel">
      {/* Header — always visible */}
      <div className="cross-ref-chapter-header" onClick={() => setCollapsed(c => !c)}>
        <h6 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fas fa-link" />
          Referências Cruzadas — {ptBook} {chapter}
          {!loading && <span className="cross-ref-badge">{verseNums.length}</span>}
        </h6>
        <button
          className="cross-ref-toggle-btn"
          title={collapsed ? 'Expandir' : 'Minimizar'}
        >
          <i className={`fas fa-chevron-${collapsed ? 'down' : 'up'}`} />
        </button>
      </div>

      {/* Body — collapsible */}
      {!collapsed && (
        <div className="cross-ref-chapter-body">
          {loading && (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px 0' }}>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }} />
              Carregando referências...
            </div>
          )}

          {!loading && !hasRefs && (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px 0' }}>
              <i className="fas fa-info-circle" style={{ marginRight: '4px' }} />
              Nenhuma referência cruzada para este capítulo.
            </div>
          )}

          {!loading && verseNums.map(vs => {
            const refs = allRefs[vs];
            const isExpanded = expandedVerse === vs;
            return (
              <div key={vs} className="cross-ref-verse-group">
                <div
                  className={`cross-ref-verse-header${isExpanded ? ' active' : ''}`}
                  onClick={() => setExpandedVerse(isExpanded ? null : vs)}
                >
                  <span className="cross-ref-verse-label">
                    Versículo {vs}
                  </span>
                  <span className="cross-ref-count">{refs.length} ref{refs.length > 1 ? 's' : ''}</span>
                  <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: '10px', color: 'var(--text-muted)' }} />
                </div>

                {isExpanded && (
                  <div className="cross-ref-verse-refs">
                    {refs.map(ref => {
                      const pt = translateRef(ref);
                      const text = getVerseText(bibleData, ref);
                      return (
                        <div key={ref} className="cross-ref-item">
                          <div className="cross-ref-ref">{pt}</div>
                          {text && <div className="cross-ref-text">{text}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
