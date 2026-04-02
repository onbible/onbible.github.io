import { describe, it, expect } from 'vitest';
import { HARPA_INDEX_URL, harpaHymnUrl, normalizeHymnSearch } from '../src/pages/HarpaPage';

describe('HarpaPage — Harpa Cristã', () => {
  it('should point to harpa index', () => {
    expect(HARPA_INDEX_URL).toBe('/db/harpacrista/harpacrista_index.json');
  });

  it('should build hymn url by number', () => {
    expect(harpaHymnUrl('12')).toBe('/db/harpacrista/12.json');
  });

  it('should normalize accents and case for search', () => {
    expect(normalizeHymnSearch('  BÊNÇÃOS  ')).toBe('bencaos');
  });
});
