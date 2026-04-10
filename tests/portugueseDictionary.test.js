import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findPortugueseEntry,
  lookupPortugueseWord,
  resetPortugueseDictionaryCache,
} from '../src/lib/portugueseDictionary';

describe('portugueseDictionary', () => {
  beforeEach(() => {
    resetPortugueseDictionaryCache();
    vi.unstubAllGlobals();
  });

  it('findPortugueseEntry matches normalized termo', () => {
    const entries = [{ termo: 'Amor', definicoes: ['x'] }];
    expect(findPortugueseEntry(entries, 'amor')?.definicoes[0]).toBe('x');
    expect(findPortugueseEntry(entries, 'outro')).toBe(null);
  });

  it('lookupPortugueseWord should return null when chunk has no match', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ x: ['x'] }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ X: [{ termo: 'xisto', definicoes: ['rocha'] }] }),
    });

    const r = await lookupPortugueseWord('xyzunknown123');
    expect(r).toBe(null);
  });

  it('lookupPortugueseWord should return lemma and definitions from local chunk', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ a: ['a'] }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          A: [{ termo: 'amor', definicoes: ['Afeição.', 'Paixão.'] }],
        }),
    });

    const r = await lookupPortugueseWord('Amor,');
    expect(r).not.toBe(null);
    expect(r.lemma).toBe('amor');
    expect(r.definitions).toEqual(['Afeição.', 'Paixão.']);
  });
});
