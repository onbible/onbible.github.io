import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/portugueseDictionary.js', () => ({
  lookupPortugueseWord: vi.fn(),
}));

import {
  lookupBiblicalThenPortuguese,
  resetDictionaryCaches,
} from '../src/lib/dictionaryData';
import { lookupPortugueseWord } from '../src/lib/portugueseDictionary';

describe('lookupBiblicalThenPortuguese', () => {
  beforeEach(() => {
    resetDictionaryCaches();
    vi.unstubAllGlobals();
    vi.mocked(lookupPortugueseWord).mockReset();
  });

  it('returns biblical entry and does not call Portuguese lookup when found', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ a: ['a1'] }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          A: [{ termo: 'amar', definicao: 'def-bib' }],
        }),
    });
    vi.mocked(lookupPortugueseWord).mockResolvedValue({
      lemma: 'amar',
      definitions: ['não deve aparecer'],
      sourceUrl: 'https://example.com',
    });

    const r = await lookupBiblicalThenPortuguese('Amar,');
    expect(r.biblical?.definicao).toBe('def-bib');
    expect(r.portuguese).toBe(null);
    expect(lookupPortugueseWord).not.toHaveBeenCalled();
  });

  it('calls Portuguese lookup when biblical has no entry', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ a: ['a1'] }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          A: [{ termo: 'outro', definicao: 'x' }],
        }),
    });
    vi.mocked(lookupPortugueseWord).mockResolvedValue({
      lemma: 'amor',
      definitions: ['def-pt'],
      sourceUrl: 'https://dicionario-aberto.net/search/amor',
    });

    const r = await lookupBiblicalThenPortuguese('amor');
    expect(r.biblical).toBe(null);
    expect(r.portuguese?.definitions[0]).toBe('def-pt');
    expect(lookupPortugueseWord).toHaveBeenCalledWith('amor');
  });
});
