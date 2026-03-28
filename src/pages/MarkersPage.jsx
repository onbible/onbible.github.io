import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DB } from '../lib/db';
import { useBibleData } from '../hooks/useBible';

export default function MarkersPage() {
  const [highlights, setHighlights] = useState([]);
  const [notes, setNotes]           = useState([]);
  const [loading, setLoading]       = useState(true);
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
                  {note  && <div className="marker-note"><i className="fas fa-sticky-note" style={{ marginRight: '4px' }}></i>{note.text}</div>}
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
                    <div className="marker-note">{n.text}</div>
                  </div>
                );
              })}
          </>
        )}
      </div>
    </>
  );
}
