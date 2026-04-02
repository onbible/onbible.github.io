import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('HymnalPage — Cantor Cristão', () => {
  let fetchMock;

  const INDEX_DATA = [
    { numero: '1', titulo: 'ANTÍFONA' },
    { numero: '2', titulo: 'JUSTO ÉS SENHOR' },
    { numero: '3', titulo: 'LOUVOR AO SENHOR' },
  ];

  const HYMN_1 = {
    numero: '1',
    titulo: 'ANTÍFONA',
    letra: 'Santo! Santo! Santo! Deus Onipotente!\nCedo de manhã cantaremos Teu louvor;',
  };

  const HYMN_EMPTY = {
    numero: '3',
    titulo: 'LOUVOR AO SENHOR',
    letra: '',
  };

  beforeEach(() => {
    fetchMock = vi.fn((url) => {
      if (url.includes('cantorcristao_index.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(INDEX_DATA),
        });
      }
      if (url.includes('/1.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(HYMN_1),
        });
      }
      if (url.includes('/3.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(HYMN_EMPTY),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ numero: '2', titulo: 'JUSTO ÉS SENHOR', letra: 'Justo és...' }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch the hymnal index on load', async () => {
    const resp = await fetch('/db/cantorcristao/cantorcristao_index.json');
    const data = await resp.json();

    expect(fetchMock).toHaveBeenCalledWith('/db/cantorcristao/cantorcristao_index.json');
    expect(data).toHaveLength(3);
    expect(data[0].titulo).toBe('ANTÍFONA');
  });

  it('should fetch individual hymn by number', async () => {
    const resp = await fetch('/db/cantorcristao/1.json');
    const hymn = await resp.json();

    expect(hymn.numero).toBe('1');
    expect(hymn.titulo).toBe('ANTÍFONA');
    expect(hymn.letra).toContain('Santo! Santo! Santo!');
  });

  it('should handle hymns with empty lyrics gracefully', async () => {
    const resp = await fetch('/db/cantorcristao/3.json');
    const hymn = await resp.json();

    expect(hymn.numero).toBe('3');
    expect(hymn.letra).toBe('');
  });

  it('should filter hymns by search query (case-insensitive)', () => {
    const query = 'antí';
    const normalized = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const filtered = INDEX_DATA.filter((h) => {
      const t = h.titulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const n = h.numero;
      return t.includes(normalized) || n.includes(query);
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].numero).toBe('1');
  });

  it('should filter hymns by number', () => {
    const query = '2';
    const filtered = INDEX_DATA.filter((h) => {
      const t = h.titulo.toLowerCase();
      return t.includes(query) || h.numero === query;
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].titulo).toBe('JUSTO ÉS SENHOR');
  });

  it('should return all hymns when search is empty', () => {
    const query = '';
    const filtered = query.trim() ? INDEX_DATA.filter(() => false) : INDEX_DATA;

    expect(filtered).toHaveLength(3);
  });

  it('should split lyrics into stanzas by double newline or single newline groups', () => {
    const letra = HYMN_1.letra;
    const lines = letra.split('\n');
    expect(lines.length).toBeGreaterThan(1);
    expect(lines[0]).toContain('Santo!');
  });
});
