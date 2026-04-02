import { describe, it, expect } from 'vitest';
import {
  PDF_INDEX_URL,
  normalizePdfBookTitle,
  normalizeSearchText,
  filterPdfBooks,
  buildPdfPreviewUrl,
  buildPdfFileUrl,
  getPdfCacheKey,
  applyOfflineOnlyFilter,
} from '../src/pages/PdfBooksPage';

describe('PdfBooksPage helpers', () => {
  it('should point to pdf index url', () => {
    expect(PDF_INDEX_URL).toBe('/db/books/pdf/pdf_index.json');
  });

  it('should normalize filename into readable title', () => {
    expect(normalizePdfBookTitle('como-deus-pode-e-vai-restaurar-seu-casamento-p-homens.pdf'))
      .toBe('Como Deus Pode E Vai Restaurar Seu Casamento P Homens');
  });

  it('should normalize search text removing accents and case', () => {
    expect(normalizeSearchText('  Ansiedade  ')).toBe('ansiedade');
    expect(normalizeSearchText('Bênçãos')).toBe('bencaos');
  });

  it('should filter books by title and filename', () => {
    const items = [
      { file: 'a-isca-de-satanas.pdf', title: 'A Isca de Satanas' },
      { file: 'casados-e-felizes.pdf', title: 'Casados E Felizes' },
    ];

    expect(filterPdfBooks(items, 'casados')).toHaveLength(1);
    expect(filterPdfBooks(items, 'satanas')).toHaveLength(1);
    expect(filterPdfBooks(items, '')).toHaveLength(2);
  });

  it('should build preview url with first-page fragment', () => {
    expect(buildPdfPreviewUrl('a-isca-de-satanas.pdf'))
      .toContain('/db/books/pdf/a-isca-de-satanas.pdf#page=1');
  });

  it('should build file url and cache key', () => {
    expect(buildPdfFileUrl('livro.pdf')).toBe('/db/books/pdf/livro.pdf');
    expect(getPdfCacheKey('livro.pdf')).toBe('/db/books/pdf/livro.pdf');
  });

  it('should filter only offline when enabled', () => {
    const items = [
      { file: 'a.pdf', title: 'A' },
      { file: 'b.pdf', title: 'B' },
    ];
    const offlineMap = { 'a.pdf': true, 'b.pdf': false };
    expect(applyOfflineOnlyFilter(items, offlineMap, true)).toHaveLength(1);
    expect(applyOfflineOnlyFilter(items, offlineMap, false)).toHaveLength(2);
  });
});
