/**
 * Parser do CHANGELOG.md (Keep a Changelog) para a página /changelog.
 */

function normalizeCategoryKey(raw) {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function parseChangelog(md) {
  const lines = md.split('\n');
  const versions = [];
  let currentVersion = null;
  let currentCategory = null;

  for (const raw of lines) {
    const line = raw.trim();

    const verMatch = line.match(/^##\s+\[(.+?)\](?:\s*[—–-]\s*(.+))?/);
    if (verMatch) {
      currentVersion = { name: verMatch[1], date: verMatch[2] || null, categories: [] };
      versions.push(currentVersion);
      currentCategory = null;
      continue;
    }

    const catMatch = line.match(/^###\s+(.+)/);
    if (catMatch && currentVersion) {
      const rawLabel = catMatch[1];
      const key = normalizeCategoryKey(rawLabel);
      currentCategory = { raw: rawLabel, key, items: [] };
      currentVersion.categories.push(currentCategory);
      continue;
    }

    if (line.startsWith('- ') && currentCategory) {
      currentCategory.items.push(line.slice(2));
    }
  }

  return versions;
}

const HTML_ESC = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Converte subset markdown de uma linha (- item) em HTML seguro para dangerouslySetInnerHTML.
 */
export function renderChangelogItemHtml(raw) {
  let s = HTML_ESC(raw);
  s = s.replace(/`([^`]+)`/g, (_, code) => `<code class="changelog-inline-code">${code}</code>`);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return s;
}

export const CATEGORY_CONFIG = {
  adicionado: { label: '✦ Adicionado', cls: 'cat-adicionado' },
  corrigido: { label: '✔ Corrigido', cls: 'cat-corrigido' },
  alterado: { label: '↻ Alterado', cls: 'cat-alterado' },
  removido: { label: '✕ Removido', cls: 'cat-removido' },
};
