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

export const PDF_BOOKS_CACHE = 'onbible-pdf-books-v1';

export const buildPdfFileUrl = (file) => `/db/books/pdf/${encodeURIComponent(file)}`;

export const getPdfCacheKey = (file) => buildPdfFileUrl(file);

export const buildPdfPreviewUrl = (file) =>
  `${buildPdfFileUrl(file)}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`;

export const filterPdfBooks = (books, query) => {
  if (!query.trim()) return books;
  const q = normalizeSearchText(query);
  return books.filter((book) => {
    const title = normalizeSearchText(book.title || '');
    const file = normalizeSearchText(book.file || '');
    return title.includes(q) || file.includes(q);
  });
};

export const applyOfflineOnlyFilter = (books, offlineMap, enabled) => {
  if (!enabled) return books;
  return books.filter((book) => !!offlineMap[book.file]);
};

export default function PdfBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('pdf_books_view_mode') || 'grid'
  );
  const [offlineMap, setOfflineMap] = useState({});
  const [offlineBusy, setOfflineBusy] = useState({});
  const [offlineOnly, setOfflineOnly] = useState(
    () => localStorage.getItem('pdf_books_offline_only') === '1'
  );

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

  const filtered = useMemo(() => {
    const bySearch = filterPdfBooks(books, search);
    return applyOfflineOnlyFilter(bySearch, offlineMap, offlineOnly);
  }, [books, search, offlineMap, offlineOnly]);

  const closeReader = useCallback(() => setSelectedBook(null), []);

  const pdfUrl = selectedBook ? buildPdfFileUrl(selectedBook.file) : '';

  useEffect(() => {
    localStorage.setItem('pdf_books_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('pdf_books_offline_only', offlineOnly ? '1' : '0');
  }, [offlineOnly]);

  useEffect(() => {
    if (!books.length || typeof window === 'undefined' || !('caches' in window)) return;
    let alive = true;
    (async () => {
      const cache = await caches.open(PDF_BOOKS_CACHE);
      const entries = await Promise.all(
        books.map(async (book) => {
          const exists = await cache.match(getPdfCacheKey(book.file));
          return [book.file, !!exists];
        })
      );
      if (!alive) return;
      setOfflineMap(Object.fromEntries(entries));
    })();
    return () => {
      alive = false;
    };
  }, [books]);

  const toggleOffline = useCallback(async (book) => {
    if (typeof window === 'undefined' || !('caches' in window)) return;
    const key = book.file;
    setOfflineBusy((prev) => ({ ...prev, [key]: true }));
    try {
      const cache = await caches.open(PDF_BOOKS_CACHE);
      const cacheKey = getPdfCacheKey(key);
      const isSaved = !!offlineMap[key];
      if (isSaved) {
        await cache.delete(cacheKey);
        setOfflineMap((prev) => ({ ...prev, [key]: false }));
      } else {
        const resp = await fetch(cacheKey, { cache: 'no-store' });
        if (!resp.ok) throw new Error('Falha ao baixar PDF');
        await cache.put(cacheKey, resp.clone());
        setOfflineMap((prev) => ({ ...prev, [key]: true }));
      }
    } catch {
      // no-op: mantem estado atual em caso de falha de rede/cache
    } finally {
      setOfflineBusy((prev) => ({ ...prev, [key]: false }));
    }
  }, [offlineMap]);

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
        <div className="search-mode-toggle">
          <button
            className={`search-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            type="button"
          >
            <i className="fas fa-list" /> Lista
          </button>
          <button
            className={`search-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            type="button"
          >
            <i className="fas fa-th-large" /> Grade
          </button>
          <button
            className={`search-mode-btn ${offlineOnly ? 'active' : ''}`}
            onClick={() => setOfflineOnly((v) => !v)}
            type="button"
            title="Mostrar apenas livros salvos offline"
          >
            <i className="fas fa-cloud-download-alt" /> Só offline
          </button>
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
      ) : viewMode === 'grid' ? (
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
              type="button"
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
              <button
                type="button"
                className={`pdf-offline-btn${offlineMap[book.file] ? ' saved' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOffline(book);
                }}
                disabled={!!offlineBusy[book.file]}
                title={offlineMap[book.file] ? 'Remover do offline' : 'Salvar para offline'}
              >
                <i className={`fas fa-${offlineMap[book.file] ? 'check-circle' : 'download'}`} />
                {offlineBusy[book.file]
                  ? '...'
                  : offlineMap[book.file]
                    ? 'Offline'
                    : 'Salvar offline'}
              </button>
            </button>
          ))}
        </div>
      ) : (
        <div className="hymn-list">
          {filtered.length === 0 && (
            <div className="hymn-empty">
              <i className="fas fa-search" /> Nenhum livro encontrado.
            </div>
          )}
          {filtered.map((book) => (
            <button
              key={book.file}
              className="hymn-card pdf-list-card"
              onClick={() => setSelectedBook(book)}
              type="button"
            >
              <span className="pdf-list-thumb">
                <iframe
                  title={`Miniatura de ${book.title}`}
                  src={buildPdfPreviewUrl(book.file)}
                  loading="lazy"
                  className="pdf-list-frame"
                />
              </span>
              <span className="hymn-card-title">{book.title}</span>
              <button
                type="button"
                className={`pdf-offline-btn${offlineMap[book.file] ? ' saved' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOffline(book);
                }}
                disabled={!!offlineBusy[book.file]}
                title={offlineMap[book.file] ? 'Remover do offline' : 'Salvar para offline'}
              >
                <i className={`fas fa-${offlineMap[book.file] ? 'check-circle' : 'download'}`} />
                {offlineBusy[book.file]
                  ? '...'
                  : offlineMap[book.file]
                    ? 'Offline'
                    : 'Salvar offline'}
              </button>
              <i className="fas fa-chevron-right hymn-card-arrow" />
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
