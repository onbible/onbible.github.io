import { cpSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Copia para `dist/` os recursos que o Vite não empacota mas que a app carrega por URL
 * (`fetch` / Service Worker): `db/`, `sw.js`, `assets/images/`.
 */
export function copyStaticForPages(outDir, rootDir) {
  const dbSrc = join(rootDir, 'db');
  if (existsSync(dbSrc)) {
    cpSync(dbSrc, join(outDir, 'db'), { recursive: true });
  }
  const swSrc = join(rootDir, 'sw.js');
  if (existsSync(swSrc)) {
    cpSync(swSrc, join(outDir, 'sw.js'));
  }
  const imgSrc = join(rootDir, 'assets', 'images');
  const imgDest = join(outDir, 'assets', 'images');
  if (existsSync(imgSrc)) {
    mkdirSync(join(outDir, 'assets'), { recursive: true });
    cpSync(imgSrc, imgDest, { recursive: true });
  }
}
