import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CANTOR_DIR = join(__dirname, '..', 'db', 'cantorcristao');

/** Importação em `scripts/import-cantor-letras-hymnary.py` (Hymnary + Letras.com.br + extras). */
const MAX_SEM_LETRA = 85;

describe('Cantor Cristão — letras nos JSON', () => {
  it('a maioria dos hinos 1–581 tem letra (limite de falhas documentado)', () => {
    const files = new Set(
      readdirSync(CANTOR_DIR)
        .filter((f) => /^\d+\.json$/.test(f))
        .map((f) => f.replace('.json', ''))
    );
    expect(files.size).toBeGreaterThanOrEqual(581);

    const missing = [];
    for (let n = 1; n <= 581; n++) {
      const path = join(CANTOR_DIR, `${n}.json`);
      const raw = readFileSync(path, 'utf-8');
      const data = JSON.parse(raw);
      const letra = typeof data.letra === 'string' ? data.letra.trim() : '';
      if (letra.length < 8) {
        missing.push(n);
      }
    }
    expect(
      missing.length,
      `Hinos sem letra (${missing.length}): ${missing.slice(0, 40).join(', ')}${missing.length > 40 ? '…' : ''}`
    ).toBeLessThanOrEqual(MAX_SEM_LETRA);
  });
});
