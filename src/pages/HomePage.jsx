import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useBibleData } from '../hooks/useBible';

const OT_BOOKS = ['gn','ex','lv','nm','dt','js','jz','rt','1sm','2sm','1rs','2rs','1cr','2cr','ed','ne','et','jo','sl','pv','ec','ct','is','jr','lm','ez','dn','os','jl','am','ob','jn','mq','na','hc','sf','ag','zc','ml'];
const NT_START = 'mt';

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
        <h1>📖 Bíblia</h1>
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
            {otBooks.map(book => (
              <BookCard key={book.abbrev} book={book} />
            ))}
          </div>
        </>
      )}

      {ntBooks.length > 0 && (
        <>
          <div className="testament-divider">Novo Testamento</div>
          <div className="book-grid">
            {ntBooks.map(book => (
              <BookCard key={book.abbrev} book={book} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function BookCard({ book }) {
  return (
    <Link to={`/book/${book.abbrev}`} className="book-card">
      <div className="book-abbrev">{book.abbrev.toUpperCase()}</div>
      <div className="book-name">{book.name}</div>
      <div className="book-chapters">{book.chapters.length} capítulos</div>
    </Link>
  );
}
