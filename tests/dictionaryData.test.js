import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeDictionaryKey,
  firstWordFromSelection,
  dictionaryLetterFromWord,
  findDictionaryEntry,
  loadLetterEntries,
  lookupDictionaryWord,
  resetDictionaryCaches,
} from '../src/lib/dictionaryData';

describe('dictionaryData helpers', () => {
  it('should normalize dictionary key (lowercase, no accents)', () => {
    expect(normalizeDictionaryKey('  Bênção  ')).toBe('bencao');
    expect(normalizeDictionaryKey('ÁSPIDE')).toBe('aspide');
  });

  it('should extract first word and strip punctuation', () => {
    expect(firstWordFromSelection('  aspide, ')).toBe('aspide');
    expect(firstWordFromSelection('Deus é')).toBe('Deus');
    expect(firstWordFromSelection('"amor"')).toBe('amor');
  });

  it('should resolve dictionary letter from word', () => {
    expect(dictionaryLetterFromWord('áspide')).toBe('a');
    expect(dictionaryLetterFromWord('123')).toBe(null);
  });

  it('should find entry by normalized termo', () => {
    const entries = [{ termo: 'Áspide', definicao: 'cobra' }, { termo: 'Outro', definicao: 'x' }];
    expect(findDictionaryEntry(entries, 'aspide')?.definicao).toBe('cobra');
    expect(findDictionaryEntry(entries, 'nada')).toBe(null);
  });
});

describe('dictionaryData fetch', () => {
  beforeEach(() => {
    resetDictionaryCaches();
    vi.unstubAllGlobals();
  });

  it('should load letter chunks and flatten entries', async () => {
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
          A: [{ termo: 'amar', definicao: 'testar' }],
        }),
    });

    const entries = await loadLetterEntries('A');
    expect(entries).toHaveLength(1);
    expect(entries[0].termo).toBe('amar');
    expect(fetchMock).toHaveBeenCalledWith('/db/dicionario/lista_letras.json');
    expect(fetchMock).toHaveBeenCalledWith('/db/dicionario/a/a1.json');
  });

  it('lookupDictionaryWord should return entry when found', async () => {
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
          A: [{ termo: 'amar', definicao: 'def' }],
        }),
    });

    const { word, entry } = await lookupDictionaryWord('Amar,');
    expect(word).toBe('Amar');
    expect(entry?.definicao).toBe('def');
  });
});
