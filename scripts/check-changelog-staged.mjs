#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { needsChangelogEntry } from './changelog-policy.mjs';

if (process.env.SKIP_CHANGELOG === '1') {
  process.exit(0);
}

let staged;
try {
  staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
} catch {
  process.exit(0);
}

if (!needsChangelogEntry(staged)) {
  process.exit(0);
}

console.error('');
console.error('pre-commit: há alterações em src/ ou tests/ no stage, mas CHANGELOG.md não está incluído.');
console.error('  1) Edite CHANGELOG.md (secção [Unreleased]) e: git add CHANGELOG.md');
console.error('  2) Ou ignore este aviso (só em casos excecionais): SKIP_CHANGELOG=1 git commit ...');
console.error('  3) Ou --no-verify (não recomendado)');
console.error('');
process.exit(1);
