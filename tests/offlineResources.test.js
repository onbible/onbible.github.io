import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listPortugueseDictionaryAssetUrls,
  getPackAssetUrls,
  resetOfflinePackUrlCache,
  listStrongsUrls,
} from '../src/lib/offlineResources';

describe('offlineResources', () => {
  beforeEach(() => {
    resetOfflinePackUrlCache();
    vi.unstubAllGlobals();
  });

  it('listPortugueseDictionaryAssetUrls includes index and letter chunks', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ a: ['a'], m: ['m'] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const urls = await listPortugueseDictionaryAssetUrls();
    expect(urls).toContain('/db/dicionario_pt/lista_letras.json');
    expect(urls).toContain('/db/dicionario_pt/a/a.json');
    expect(urls).toContain('/db/dicionario_pt/m/m.json');
    expect(fetchMock).toHaveBeenCalledWith('/db/dicionario_pt/lista_letras.json');
  });

  it('listPortugueseDictionaryAssetUrls returns empty on failed index', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );
    const urls = await listPortugueseDictionaryAssetUrls();
    expect(urls).toEqual([]);
  });

  it('getPackAssetUrls for strongs returns hebrew and greek lexicons', async () => {
    const urls = await getPackAssetUrls('strongs');
    expect(urls).toEqual(listStrongsUrls());
    expect(urls).toContain('/db/strongs/hebrew.json');
    expect(urls).toContain('/db/strongs/greek.json');
  });

  it('getPackAssetUrls for cantor uses index', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            { numero: '1', titulo: 'A' },
            { numero: '2', titulo: 'B' },
          ]),
      })
    );
    const urls = await getPackAssetUrls('cantor');
    expect(urls).toContain('/db/cantorcristao/cantorcristao_index.json');
    expect(urls).toContain('/db/cantorcristao/1.json');
    expect(urls).toContain('/db/cantorcristao/2.json');
  });
});
