import { copyFileSync } from 'fs';
import { join } from 'path';

/** Cópia pós-build: GitHub Pages usa `404.html` quando não há ficheiro para o caminho (SPA). */
export function copyIndexTo404(outDir) {
  copyFileSync(join(outDir, 'index.html'), join(outDir, '404.html'));
}
