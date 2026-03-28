import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useBibleData } from '../hooks/useBible';
import { DB } from '../lib/db';

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

export default function SermonsPage() {
  const { bibleData } = useBibleData();
  const [sermons, setSermons] = useState([]);
  const [view, setView] = useState('list'); // 'list' | 'editor'
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [expandedRefs, setExpandedRefs] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showBible, setShowBible] = useState(false);
  const bodyRef = useRef(null);

  /* ── Bible browser state ── */
  const [bibleStep, setBibleStep] = useState('books'); // 'books' | 'chapters' | 'verses'
  const [selBook, setSelBook] = useState(null);
  const [selChapter, setSelChapter] = useState(null);
  const [selVerses, setSelVerses] = useState([]); // array of verse numbers (1-based)

  const books = useMemo(() => {
    if (!bibleData) return [];
    return Object.values(bibleData);
  }, [bibleData]);

  useEffect(() => { DB.getAllSermons().then(setSermons); }, []);

  /* ── Sermon CRUD ── */
  const openNew = useCallback(() => {
    setEditId(null); setTitle(''); setBody('');
    setView('editor'); setShowBible(false);
    resetBible();
  }, []);

  const openEdit = useCallback(async (id) => {
    const s = await DB.getSermon(id);
    if (!s) return;
    setEditId(s.id); setTitle(s.title); setBody(s.body || '');
    setView('editor'); setShowBible(false);
    resetBible();
  }, []);

  const save = useCallback(async () => {
    const t = title.trim() || 'Sermão sem título';
    if (editId) await DB.updateSermon(editId, t, body);
    else await DB.createSermon(t, body);
    setSermons(await DB.getAllSermons());
    setView('list');
  }, [editId, title, body]);

  const confirmDelete = useCallback((id) => setDeleteConfirm(id), []);

  const doDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    await DB.deleteSermon(deleteConfirm);
    setSermons(prev => prev.filter(s => s.id !== deleteConfirm));
    setDeleteConfirm(null);
    if (editId === deleteConfirm) setView('list');
  }, [deleteConfirm, editId]);

  const goBack = useCallback(() => setView('list'), []);

  /* ── Bible browser helpers ── */
  function resetBible() {
    setBibleStep('books'); setSelBook(null); setSelChapter(null); setSelVerses([]);
  }

  const pickBook = useCallback((book) => {
    setSelBook(book); setSelChapter(null); setSelVerses([]); setBibleStep('chapters');
  }, []);

  const pickChapter = useCallback((ch) => {
    setSelChapter(ch); setSelVerses([]); setBibleStep('verses');
  }, []);

  const toggleVerse = useCallback((vNum) => {
    setSelVerses(prev => prev.includes(vNum) ? prev.filter(v => v !== vNum) : [...prev, vNum].sort((a, b) => a - b));
  }, []);

  const insertSelectedVerses = useCallback(() => {
    if (!selBook || !selChapter || selVerses.length === 0) return;
    const sorted = [...selVerses].sort((a, b) => a - b);
    // Build contiguous ranges if possible
    const ranges = [];
    let start = sorted[0], end = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) { end = sorted[i]; }
      else { ranges.push([start, end]); start = sorted[i]; end = sorted[i]; }
    }
    ranges.push([start, end]);

    const tags = ranges.map(([s, e]) => {
      const label = formatRefLabel(selBook.name, selChapter, s, e > s ? e : null);
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
    setSelVerses([]);
  }, [selBook, selChapter, selVerses, body]);

  /* ── Render body with inline references ── */
  const renderBody = useCallback((text) => {
    const parts = text.split(/(【[^】]+】)/g);
    return parts.map((part, i) => {
      const m = part.match(/^【(.+)】$/);
      if (m && books.length) {
        const refStr = m[1];
        const ref = parseRef(refStr, books);
        if (ref) {
          const key = `${i}-${refStr}`;
          const isExpanded = expandedRefs[key];
          return (
            <span key={i} className="sermon-ref-inline">
              <button className="sermon-ref-tag"
                onClick={() => setExpandedRefs(prev => ({ ...prev, [key]: !prev[key] }))}
                title="Clique para expandir/recolher">
                <i className="fas fa-bible" /> {refStr}
                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: '9px', marginLeft: '4px' }} />
              </button>
              {isExpanded && <span className="sermon-ref-expanded">{getVerseText(ref)}</span>}
            </span>
          );
        }
      }
      return <span key={i}>{part.split('\n').map((line, j, arr) => (
        <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
      ))}</span>;
    });
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

  /* ═══════════════ EDITOR VIEW — two columns ═══════════════ */
  const verses = selBook && selChapter ? (selBook.chapters[selChapter - 1] || []) : [];

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={goBack} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <i className="fas fa-arrow-left" />
          </button>
          <h1 style={{ fontSize: '18px', margin: 0 }}>{editId ? 'Editar Sermão' : 'Novo Sermão'}</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`sermon-toolbar-btn${showBible ? ' active' : ''}`}
            onClick={() => setShowBible(p => !p)}
            title="Abrir/fechar Bíblia"
          >
            <i className="fas fa-bible" /> Bíblia
          </button>
          <button className="sermon-save-btn" onClick={save}><i className="fas fa-check" /> Salvar</button>
        </div>
      </div>

      <div className={`sermon-layout${showBible ? ' bible-open' : ''}`}>
        {/* ── Left: Editor ── */}
        <div className="sermon-editor">
          <input className="sermon-title-input" type="text" placeholder="Título do Sermão" value={title} onChange={e => setTitle(e.target.value)} />

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

        {/* ── Right: Bible browser ── */}
        {showBible && (
          <div className="sermon-bible">
            {/* Breadcrumb */}
            <div className="sermon-bible-nav">
              <button className={bibleStep === 'books' ? 'active' : ''} onClick={resetBible}>
                <i className="fas fa-book" /> Livros
              </button>
              {selBook && (
                <>
                  <i className="fas fa-chevron-right" style={{ fontSize: '10px', color: 'var(--text-muted)' }} />
                  <button className={bibleStep === 'chapters' ? 'active' : ''} onClick={() => { setBibleStep('chapters'); setSelChapter(null); setSelVerses([]); }}>
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
                {/* Selection bar */}
                {selVerses.length > 0 && (
                  <div className="sermon-bible-sel-bar">
                    <span>{selVerses.length} versículo{selVerses.length > 1 ? 's' : ''} selecionado{selVerses.length > 1 ? 's' : ''}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="sermon-bible-sel-clear" onClick={() => setSelVerses([])}>Limpar</button>
                      <button className="sermon-bible-sel-insert" onClick={insertSelectedVerses}>
                        <i className="fas fa-plus" /> Inserir
                      </button>
                    </div>
                  </div>
                )}
                <div className="sermon-bible-verses">
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
        )}
      </div>
    </>
  );
}
