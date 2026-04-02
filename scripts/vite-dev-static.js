import { readFileSync, existsSync, statSync } from 'fs';
import { join, resolve } from 'path';

function mimeForExt(ext) {
  const m = {
    json: 'application/json; charset=utf-8',
    png: 'image/png',
    pdf: 'application/pdf',
    js: 'application/javascript; charset=utf-8',
    mp3: 'audio/mpeg',
    webp: 'image/webp',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
  };
  return m[ext] || 'application/octet-stream';
}

function isPathUnderBase(baseDir, candidate) {
  const base = resolve(baseDir);
  const cand = resolve(candidate);
  return cand === base || cand.startsWith(`${base}/`);
}

function trySendFile(res, fsPath) {
  if (!existsSync(fsPath) || !statSync(fsPath).isFile()) return false;
  const ext = (fsPath.split('.').pop() || '').toLowerCase();
  res.setHeader('Content-Type', mimeForExt(ext));
  res.end(readFileSync(fsPath));
  return true;
}

/** Em `vite dev`, serve ficheiros que em produção vão em `dist/` via pós-build. */
export function configureDevStatic(server) {
  const root = server.config.root;

  server.middlewares.use((req, res, next) => {
    const pathname = req.url?.split('?')[0] ?? '';

    if (pathname === '/sw.js') {
      if (trySendFile(res, join(root, 'sw.js'))) return;
    }

    if (pathname.startsWith('/db/')) {
      const fsPath = resolve(join(root, 'db'), pathname.replace(/^\/db\/?/, ''));
      const dbRoot = join(root, 'db');
      if (isPathUnderBase(dbRoot, fsPath) && trySendFile(res, fsPath)) return;
    }

    if (pathname.startsWith('/assets/images/')) {
      const fsPath = resolve(join(root, 'assets', 'images'), pathname.replace(/^\/assets\/images\/?/, ''));
      const imgRoot = join(root, 'assets', 'images');
      if (isPathUnderBase(imgRoot, fsPath) && trySendFile(res, fsPath)) return;
    }

    next();
  });
}
