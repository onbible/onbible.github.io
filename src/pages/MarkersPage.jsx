import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DB } from '../lib/db';
import { useBibleData } from '../hooks/useBible';

export default function MarkersPage() {
  const [highlights, setHighlights] = useState([]);
  const [notes, setNotes]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editModal, setEditModal]   = useState(null); // { id, book, chapter, verse, text }
  const editTextRef = useRef(null);
  const { bibleData } = useBibleData();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const [hls, ns] = await Promise.all([DB.getAllHighlights(), DB.getAllNotes()]);
      setHighlights(hls);
      setNotes(ns);
      setLoading(false);
    }
    load();
  }, []);

  const getVerseText = (book, chapter, verse) => {
    if (!bibleData) return '';
    const b = Object.values(bibleData).find(b => b.abbrev === book);
    return b?.chapters?.[chapter - 1]?.[verse - 1] ?? '';
  };

  const getBookName = (abbrev) => {
    if (!bibleData) return abbrev;
    return Object.values(bibleData).find(b => b.abbrev === abbrev)?.name ?? abbrev;
  };

  const HL_COLORS = { yellow: '#fde047', green: '#4ade80', blue: '#60a5fa', pink: '#f472b6' };

  // Focus textarea when edit modal opens
  useEffect(() => {
    if (editModal && editTextRef.current) editTextRef.current.focus();
  }, [editModal]);

  const openEditNote = (n, e) => {
    e.stopPropagation();
    setEditModal({ id: n.id, book: n.book, chapter: n.chapter, verse: n.verse, text: n.text });
  };

  const saveEditNote = async () => {
    if (!editModal) return;
    const { book, chapter, verse, text } = editModal;
    if (text.trim() === '') return deleteNote();
    await DB.setNote(book, chapter, verse, text.trim());
    setNotes(prev => prev.map(n => n.book === book && n.chapter === chapter && n.verse === verse ? { ...n, text: text.trim() } : n));
    setEditModal(null);
  };

  const deleteNote = async (e) => {
    if (e) e.stopPropagation();
    if (!editModal) return;
    const { book, chapter, verse } = editModal;
    await DB.deleteNote(book, chapter, verse);
    setNotes(prev => prev.filter(n => !(n.book === book && n.chapter === chapter && n.verse === verse)));
    setEditModal(null);
  };

  const confirmDeleteNote = (n, e) => {
    e.stopPropagation();
    setEditModal({ id: n.id, book: n.book, chapter: n.chapter, verse: n.verse, text: n.text, confirmDelete: true });
  };

  if (loading) return <div style={{ padding: '28px', color: 'var(--text-muted)' }}>Carregando...</div>;

  const hasData = highlights.length > 0 || notes.length > 0;

  return (
    <>
      <div className="page-header">
        <h1><i className="fas fa-bookmark" style={{ marginRight: '8px' }}></i>Meus Marcadores</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {highlights.length} sublinhados · {notes.length} notas
        </p>
      </div>

      {!hasData && (
        <div style={{ padding: '40px 28px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <i className="fas fa-bookmark" style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }} />
          <p>Você ainda não marcou nenhum versículo.<br />Abra um livro e clique em um versículo para começar.</p>
        </div>
      )}

      <div style={{ padding: '16px 28px' }}>
        {highlights.length > 0 && (
          <>
            <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Versículos Sublinhados
            </h5>
            {highlights.map(h => {
              const text = getVerseText(h.book, h.chapter, h.verse);
              const note = notes.find(n => n.book === h.book && n.chapter === h.chapter && n.verse === h.verse);
              return (
                <div
                  key={h.id}
                  className="marker-item"
                  onClick={() => navigate(`/book/${h.book}?c=${h.chapter}&v=${h.verse}`)}
                >
                  <div className="marker-ref">
                    <span className="marker-dot" style={{ background: HL_COLORS[h.color] }} />
                    {getBookName(h.book)} {h.chapter}:{h.verse}
                  </div>
                  {text && <div className="marker-text">"{text}"</div>}
                  {note && (
                    <div className="marker-note">
                      <i className="fas fa-sticky-note" style={{ marginRight: '4px' }}></i>{note.text}
                      <span className="marker-actions">
                        <button title="Editar nota" onClick={(e) => openEditNote(note, e)}><i className="fas fa-pen" /></button>
                        <button title="Excluir nota" onClick={(e) => confirmDeleteNote(note, e)}><i className="fas fa-trash-alt" /></button>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {notes.filter(n => !highlights.find(h => h.book === n.book && h.chapter === n.chapter && h.verse === n.verse)).length > 0 && (
          <>
            <h5 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '24px 0 12px' }}>
              Anotações
            </h5>
            {notes
              .filter(n => !highlights.find(h => h.book === n.book && h.chapter === n.chapter && h.verse === n.verse))
              .map(n => {
                const text = getVerseText(n.book, n.chapter, n.verse);
                return (
                  <div key={n.id} className="marker-item" onClick={() => navigate(`/book/${n.book}?c=${n.chapter}&v=${n.verse}`)}>
                    <div className="marker-ref"><i className="fas fa-sticky-note" style={{ marginRight: '4px' }}></i>{getBookName(n.book)} {n.chapter}:{n.verse}</div>
                    {text && <div className="marker-text">"{text}"</div>}
                    <div className="marker-note">
                      {n.text}
                      <span className="marker-actions">
                        <button title="Editar nota" onClick={(e) => openEditNote(n, e)}><i className="fas fa-pen" /></button>
                        <button title="Excluir nota" onClick={(e) => confirmDeleteNote(n, e)}><i className="fas fa-trash-alt" /></button>
                      </span>
                    </div>
                  </div>
                );
              })}
          </>
        )}
      </div>

      {/* Edit / Delete Note Modal */}
      {editModal && (
        <div className="note-modal-overlay" onClick={() => setEditModal(null)}>
          <div className="note-modal-content" onClick={(e) => e.stopPropagation()}>
            {editModal.confirmDelete ? (
              <>
                <div className="note-modal-header">
                  <h5><i className="fas fa-exclamation-triangle" style={{ color: '#ef4444', marginRight: '8px' }} />Excluir Nota</h5>
                  <button onClick={() => setEditModal(null)}>&times;</button>
                </div>
                <div className="note-modal-body" style={{ fontSize: '14px' }}>
                  <p style={{ margin: '0 0 8px' }}>Deseja remover esta nota de <strong>{getBookName(editModal.book)} {editModal.chapter}:{editModal.verse}</strong>?</p>
                  <div className="marker-note" style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px', fontStyle: 'italic' }}>{editModal.text}</div>
                </div>
                <div className="note-modal-footer">
                  <div style={{ flex: 1 }} />
                  <button className="note-modal-btn cancel" onClick={() => setEditModal(null)}>Cancelar</button>
                  <button className="note-modal-btn delete" onClick={deleteNote}><i className="fas fa-trash-alt" /> Excluir</button>
                </div>
              </>
            ) : (
              <>
                <div className="note-modal-header">
                  <h5><i className="fas fa-sticky-note" style={{ color: '#f59e0b', marginRight: '8px' }} />Editar Nota — {getBookName(editModal.book)} {editModal.chapter}:{editModal.verse}</h5>
                  <button onClick={() => setEditModal(null)}>&times;</button>
                </div>
                <div className="note-modal-body">
                  <textarea
                    ref={editTextRef}
                    className="note-modal-textarea"
                    placeholder="Escreva sua nota aqui..."
                    value={editModal.text}
                    onChange={(e) => setEditModal(prev => ({ ...prev, text: e.target.value }))}
                  />
                </div>
                <div className="note-modal-footer">
                  <button className="note-modal-btn delete" onClick={deleteNote}><i className="fas fa-trash-alt" /> Remover</button>
                  <div style={{ flex: 1 }} />
                  <button className="note-modal-btn cancel" onClick={() => setEditModal(null)}>Cancelar</button>
                  <button className="note-modal-btn save" onClick={saveEditNote}><i className="fas fa-check" /> Salvar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
