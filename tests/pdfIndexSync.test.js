import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PDF_DIR = join(__dirname, '..', 'db', 'books', 'pdf');
const INDEX_PATH = join(PDF_DIR, 'pdf_index.json');

describe('Índice de livros PDF (pdf_index.json)', () => {
  it('cada .pdf na pasta está listado no índice e cada entrada aponta para ficheiro existente', () => {
    expect(existsSync(INDEX_PATH)).toBe(true);
    const onDisk = new Set(
      readdirSync(PDF_DIR).filter((f) => f.toLowerCase().endsWith('.pdf'))
    );
    const raw = readFileSync(INDEX_PATH, 'utf-8');
    const entries = JSON.parse(raw);
    expect(Array.isArray(entries)).toBe(true);

    const indexed = new Set(entries.map((e) => e.file));

    const missingInIndex = [...onDisk].filter((f) => !indexed.has(f));
    expect(
      missingInIndex,
      `PDFs sem entrada em pdf_index.json: ${missingInIndex.join(', ')}`
    ).toEqual([]);

    const missingOnDisk = [...indexed].filter((f) => !onDisk.has(f));
    expect(
      missingOnDisk,
      `Entradas órfãs (ficheiro em falta): ${missingOnDisk.join(', ')}`
    ).toEqual([]);

    for (const e of entries) {
      expect(typeof e.title, 'cada item deve ter title em string').toBe('string');
      expect(e.title.trim().length).toBeGreaterThan(0);
    }
  });
});
