import { describe, it, expect } from 'vitest';
import { parseChangelog, renderChangelogItemHtml, CATEGORY_CONFIG } from '../src/lib/changelogParser.js';

describe('parseChangelog', () => {
  it('extrai versão, categorias e itens', () => {
    const md = `
## [Unreleased]

### Adicionado

- Item um
- Item dois

### Corrigido

- Bug fix
`;
    const v = parseChangelog(md);
    expect(v).toHaveLength(1);
    expect(v[0].name).toBe('Unreleased');
    expect(v[0].categories).toHaveLength(2);
    expect(v[0].categories[0].key).toBe('adicionado');
    expect(v[0].categories[0].items).toEqual(['Item um', 'Item dois']);
    expect(v[0].categories[1].key).toBe('corrigido');
    expect(v[0].categories[1].items).toEqual(['Bug fix']);
  });

  it('CATEGORY_CONFIG cobre chaves normalizadas', () => {
    expect(CATEGORY_CONFIG.adicionado.label).toContain('Adicionado');
  });
});

describe('renderChangelogItemHtml', () => {
  it('escapa HTML e aplica code e strong', () => {
    const h = renderChangelogItemHtml('Use `src/x.js` e **negrito**.');
    expect(h).toContain('changelog-inline-code');
    expect(h).toContain('src/x.js');
    expect(h).toContain('<strong>negrito</strong>');
  });

  it('escapa menor que literal', () => {
    const h = renderChangelogItemHtml('texto <evil>');
    expect(h).toContain('&lt;evil&gt;');
  });
});
