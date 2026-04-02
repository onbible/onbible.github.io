import { useCallback, useEffect, useMemo, useState } from 'react';

export const PDF_INDEX_URL = '/db/books/pdf/pdf_index.json';

export const normalizeSearchText = (value) =>
  (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const normalizePdfBookTitle = (filename) => {
  const clean = (filename || '')
    .replace(/\.pdf$/i, '')
    .replace(/[-_.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

export const buildPdfPreviewUrl = (file) =>
  `/db/books/pdf/${encodeURIComponent(file)}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`;

export const filterPdfBooks = (books, query) => {
  if (!query.trim()) return books;
  const q = normalizeSearchText(query);
  return books.filter((book) => {
    const title = normalizeSearchText(book.title || '');
    const file = normalizeSearchText(book.file || '');
    return title.includes(q) || file.includes(q);
  });
};

export default function PdfBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(PDF_INDEX_URL);
        const data = await resp.json();
        const normalized = Array.isArray(data)
          ? data.map((item) => ({
              file: item.file,
              title: item.title || normalizePdfBookTitle(item.file),
            }))
          : [];
        setBooks(normalized);
      } catch {
        setBooks([]);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => filterPdfBooks(books, search), [books, search]);

  const closeReader = useCallback(() => setSelectedBook(null), []);

  const pdfUrl = selectedBook
    ? `/db/books/pdf/${encodeURIComponent(selectedBook.file)}`
    : '';

  return (
    <>
      <div className="page-header">
        <h1>
          <i className="fas fa-book-reader" style={{ marginRight: 8 }} />
          Livros PDF
        </h1>
      </div>

      <div className="hymn-search-wrap">
        <div className="search-box">
          <i className="fas fa-search" />
          <input
            type="text"
            placeholder="Buscar livro por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>
        <span className="hymn-count">
          {loading ? '...' : `${filtered.length} livro${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '20px 28px' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton-line" style={{ width: `${48 + Math.random() * 42}%` }} />
          ))}
        </div>
      ) : (
        <div className="pdf-grid-wrap">
          {filtered.length === 0 && (
            <div className="hymn-empty">
              <i className="fas fa-search" /> Nenhum livro encontrado.
            </div>
          )}
          {filtered.map((book) => (
            <button
              key={book.file}
              className="pdf-thumb-card"
              onClick={() => setSelectedBook(book)}
            >
              <span className="pdf-thumb-cover">
                <iframe
                  title={`Capa de ${book.title}`}
                  src={buildPdfPreviewUrl(book.file)}
                  loading="lazy"
                  className="pdf-thumb-frame"
                />
              </span>
              <span className="pdf-thumb-title">{book.title}</span>
            </button>
          ))}
        </div>
      )}

      {selectedBook && (
        <div className="hymn-overlay" onClick={closeReader}>
          <div className="hymn-modal" onClick={(e) => e.stopPropagation()}>
            <button className="hymn-modal-close" onClick={closeReader}>
              <i className="fas fa-times" />
            </button>

            <div className="hymn-modal-header" style={{ paddingBottom: 12 }}>
              <span className="hymn-modal-number">Leitura</span>
              <h2 className="hymn-modal-title">{selectedBook.title}</h2>
            </div>

            <div style={{ padding: '0 20px 20px' }}>
              <iframe
                title={selectedBook.title}
                src={pdfUrl}
                style={{
                  width: '100%',
                  height: '70vh',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  background: 'var(--bg-secondary)',
                }}
              />
              <div style={{ marginTop: 10, textAlign: 'right' }}>
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="hymn-nav-btn">
                  <i className="fas fa-external-link-alt" /> Abrir em nova aba
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
