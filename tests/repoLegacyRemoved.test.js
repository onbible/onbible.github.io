import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Páginas HTML multi-ficheiro substituídas pela SPA React (Vite + `index.html`). */
const LEGACY_ROOT_HTML = [
  'book.html',
  'markers.html',
  'bible_play.html',
  'settings.html',
  'player.html',
  'index-legacy.html',
  'changelog.html',
];

describe('artefactos legados removidos', () => {
  it('não deve existir páginas HTML legadas na raiz', () => {
    for (const name of LEGACY_ROOT_HTML) {
      expect(existsSync(join(root, name)), `ficheiro legado inesperado: ${name}`).toBe(false);
    }
  });

  it('deve manter a shell da SPA e imagens estáticas', () => {
    expect(existsSync(join(root, 'index.html'))).toBe(true);
    expect(existsSync(join(root, 'assets', 'images'))).toBe(true);
    expect(existsSync(join(root, 'assets', 'fonts'))).toBe(false);
  });

  it('não deve existir pastas da stack vanilla (js/css/libs em assets)', () => {
    expect(existsSync(join(root, 'assets', 'js'))).toBe(false);
    expect(existsSync(join(root, 'assets', 'css'))).toBe(false);
    expect(existsSync(join(root, 'assets', 'libs'))).toBe(false);
  });

  it('não deve existir vendor/ na raiz (template antigo não usado pela SPA)', () => {
    expect(existsSync(join(root, 'vendor'))).toBe(false);
  });
});
