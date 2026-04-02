import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { copyStaticForPages } from '../scripts/copy-static-for-pages.js';

describe('copyStaticForPages', () => {
  let tmpRoot;
  let tmpOut;

  beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'onbible-copy-'));
    tmpOut = join(tmpRoot, 'dist');
    mkdirSync(join(tmpRoot, 'db', 'books', 'pdf'), { recursive: true });
    writeFileSync(join(tmpRoot, 'db', 'books', 'pdf', 'pdf_index.json'), '[]');
    mkdirSync(join(tmpRoot, 'assets', 'images'), { recursive: true });
    writeFileSync(join(tmpRoot, 'assets', 'images', 'logo.png'), 'png');
    writeFileSync(join(tmpRoot, 'sw.js'), '// sw');
    mkdirSync(tmpOut, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('copia db, sw.js e assets/images para o diretório de build', () => {
    copyStaticForPages(tmpOut, tmpRoot);

    expect(existsSync(join(tmpOut, 'db', 'books', 'pdf', 'pdf_index.json'))).toBe(true);
    expect(readFileSync(join(tmpOut, 'db', 'books', 'pdf', 'pdf_index.json'), 'utf8')).toBe('[]');
    expect(readFileSync(join(tmpOut, 'sw.js'), 'utf8')).toBe('// sw');
    expect(readFileSync(join(tmpOut, 'assets', 'images', 'logo.png'), 'utf8')).toBe('png');
  });
});
