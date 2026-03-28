import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBibleData } from '../hooks/useBible';

const OT_BOOKS = ['gn','ex','lv','nm','dt','js','jz','rt','1sm','2sm','1rs','2rs','1cr','2cr','ed','ne','et','jo','sl','pv','ec','ct','is','jr','lm','ez','dn','os','jl','am','ob','jn','mq','na','hc','sf','ag','zc','ml'];
const NT_START = 'mt';

// Categories for periodic-table coloring
const CATEGORY = {
  // Pentateuco
  gn:'law',ex:'law',lv:'law',nm:'law',dt:'law',
  // Históricos
  js:'hist',jz:'hist',rt:'hist','1sm':'hist','2sm':'hist','1rs':'hist','2rs':'hist','1cr':'hist','2cr':'hist',ed:'hist',ne:'hist',et:'hist',
  // Poéticos / Sabedoria
  jo:'poet',sl:'poet',pv:'poet',ec:'poet',ct:'poet',
  // Profetas Maiores
  is:'pmaj',jr:'pmaj',lm:'pmaj',ez:'pmaj',dn:'pmaj',
  // Profetas Menores
  os:'pmin',jl:'pmin',am:'pmin',ob:'pmin',jn:'pmin',mq:'pmin',na:'pmin',hc:'pmin',sf:'pmin',ag:'pmin',zc:'pmin',ml:'pmin',
  // Evangelhos
  mt:'gosp',mc:'gosp',lc:'gosp',joa:'gosp',
  // Atos
  at:'acts',
  // Cartas Paulinas
  rm:'paul','1co':'paul','2co':'paul',gl:'paul',ef:'paul',fp:'paul',cl:'paul','1ts':'paul','2ts':'paul','1tm':'paul','2tm':'paul',tt:'paul',fm:'paul',
  // Cartas Gerais
  hb:'gen',tg:'gen','1pe':'gen','2pe':'gen','1jo':'gen','2jo':'gen','3jo':'gen',jd:'gen',
  // Profecia / Apocalipse
  ap:'rev',
};

export default function HomePage() {
  const { bibleData, loading, error } = useBibleData();
  const [search, setSearch] = useState('');

  const books = useMemo(() => {
    if (!bibleData) return [];
    return Object.values(bibleData);
  }, [bibleData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return books;
    const q = search.toLowerCase();
    return books.filter(b => b.name.toLowerCase().includes(q) || b.abbrev.toLowerCase().includes(q));
  }, [books, search]);

  const otBooks = filtered.filter(b => OT_BOOKS.includes(b.abbrev));
  const ntBooks = filtered.filter(b => !OT_BOOKS.includes(b.abbrev));

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
      <div className="search-box">
        <i className="fas fa-search" />
        <input
          type="text"
          placeholder="Buscar livro..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {otBooks.length > 0 && (
        <>
          <div className="testament-divider">Antigo Testamento</div>
          <div className="book-grid">
            {otBooks.map((book, idx) => (
              <BookCard key={book.abbrev} book={book} number={idx + 1} />
            ))}
          </div>
        </>
      )}

      {ntBooks.length > 0 && (
        <>
          <div className="testament-divider">Novo Testamento</div>
          <div className="book-grid">
            {ntBooks.map((book, idx) => (
              <BookCard key={book.abbrev} book={book} number={otBooks.length + idx + 1} />
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
