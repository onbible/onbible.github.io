// src/lib/bibleVersions.js
export const VERSIONS = {
  pt_aa:  { label: 'Almeida Revisada (PT-AA)',   url: 'https://raw.githubusercontent.com/rodriguesfas/biblie/master/db/books/json/pt_aa.json' },
  pt_acf: { label: 'Almeida Corrigida (PT-ACF)', url: 'https://raw.githubusercontent.com/rodriguesfas/biblie/master/db/books/json/pt_acf.json' },
  pt_nvi: { label: 'Nova Versão Internacional (PT-NVI)', url: 'https://raw.githubusercontent.com/rodriguesfas/biblie/master/db/books/json/pt_nvi.json' },
  en_bbe: { label: 'Basic English (EN-BBE)',      url: 'https://raw.githubusercontent.com/rodriguesfas/biblie/master/db/books/json/en_bbe.json' },
  en_kjv: { label: 'King James Version (EN-KJV)', url: 'https://raw.githubusercontent.com/rodriguesfas/biblie/master/db/books/json/en_kjv.json' },
};

export const DEFAULT_VERSION = 'pt_aa';
