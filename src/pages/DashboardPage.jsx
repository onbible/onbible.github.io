import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBibleData } from '../hooks/useBible';
import { onBibleDB } from '../lib/db';

const VOTD_LIST = [
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

export default function DashboardPage() {
  const { bibleData, loading } = useBibleData();
  const navigate = useNavigate();
  const [recentBooks, setRecentBooks] = useState([]);

  const verseOfDay = useMemo(() => {
    if (!bibleData) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    const entry = VOTD_LIST[dayOfYear % VOTD_LIST.length];
    const [abbrev, ch, v] = entry;
    const allBooks = Array.isArray(bibleData) ? bibleData : Object.values(bibleData);
    const book = allBooks.find(b => b.abbrev === abbrev);
    if (!book) return null;
    const text = book.chapters[ch - 1]?.[v - 1];
    if (!text) return null;
    return { abbrev, bookName: book.name, chapter: ch, verse: v, text };
  }, [bibleData]);

  useEffect(() => {
    if (!bibleData) return;
    const allBooks = Array.isArray(bibleData) ? bibleData : Object.values(bibleData);
    onBibleDB.reading_state.toArray().then(states => {
      const items = states
        .map(s => {
          const book = allBooks.find(b => b.abbrev === s.book_abbrev);
          if (!book) return null;
          return { abbrev: s.book_abbrev, name: book.name, chapter: s.last_chapter, total: book.chapters.length };
        })
        .filter(Boolean);
      setRecentBooks(items);
    });
  }, [bibleData]);

  if (loading) return (
    <div style={{ padding: '28px' }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${60 + Math.random() * 30}%` }} />
      ))}
    </div>
  );

  return (
    <>
      <div className="page-header">
        <h1><i className="fas fa-home" style={{ marginRight: '8px' }}></i>Início</h1>
      </div>

      {/* ── Verse of the Day ── */}
      {verseOfDay && (
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

      {/* ── Continue Reading ── */}
      {recentBooks.length > 0 && (
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

      {/* ── Quick Links ── */}
      <div className="testament-divider">
        <i className="fas fa-th-large" style={{ marginRight: '6px' }}></i>Acesso Rápido
      </div>
      <div className="dash-quick-links">
        <Link to="/bible" className="dash-link-card">
          <i className="fas fa-bible" />
          <span>Bíblia</span>
        </Link>
        <Link to="/markers" className="dash-link-card">
          <i className="fas fa-bookmark" />
          <span>Marcadores</span>
        </Link>
        <Link to="/plan" className="dash-link-card">
          <i className="fas fa-calendar-check" />
          <span>Plano de Leitura</span>
        </Link>
        <Link to="/play" className="dash-link-card">
          <i className="fas fa-headphones" />
          <span>Bíblia Play</span>
        </Link>
        <Link to="/sermons" className="dash-link-card">
          <i className="fas fa-scroll" />
          <span>Sermões</span>
        </Link>
        <Link to="/hymnal" className="dash-link-card">
          <i className="fas fa-music" />
          <span>Cantor Cristão</span>
        </Link>
        <Link to="/harpa" className="dash-link-card">
          <i className="fas fa-guitar" />
          <span>Harpa Cristã</span>
        </Link>
      </div>
    </>
  );
}
