import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { copyIndexTo404 } from '../scripts/copy-spa-404.js';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('copyIndexTo404 (GitHub Pages SPA)', () => {
  let dir;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'onbible-spa-'));
  });
  afterEach(() => {
    if (dir && existsSync(dir)) rmSync(dir, { recursive: true });
  });

  it('copia index.html para 404.html com o mesmo conteúdo', () => {
    const content = '<!DOCTYPE html><html><head></head><body></body></html>';
    writeFileSync(join(dir, 'index.html'), content);
    copyIndexTo404(dir);
    expect(readFileSync(join(dir, '404.html'), 'utf8')).toBe(content);
  });
});
