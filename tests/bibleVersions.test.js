import { describe, it, expect } from 'vitest';
import { VERSIONS, DEFAULT_VERSION } from '../src/lib/bibleVersions';

const EXPECTED_KEYS = [
  'ar_svd',
  'zh_cuv',
  'zh_ncv',
  'de_schlachter',
  'el_greek',
  'en_bbe',
  'en_kjv',
  'eo_esperanto',
  'es_rvr',
  'fi_finnish',
  'fi_pr',
  'fr_apee',
  'ko_ko',
  'pt_aa',
  'pt_acf',
  'pt_nvi',
  'ro_cornilescu',
  'ru_synodal',
  'vi_vietnamese',
];

describe('bibleVersions', () => {
  it('mantém a versão por defeito e todas as entradas do catálogo index.json', () => {
    expect(VERSIONS[DEFAULT_VERSION]).toBeDefined();
    expect(DEFAULT_VERSION).toBe('pt_aa');
    expect(Object.keys(VERSIONS).sort()).toEqual(EXPECTED_KEYS.sort());
  });

  it('cada versão tem label e URL válida para o repositório biblie', () => {
    const base =
      'https://raw.githubusercontent.com/rodriguesfas/biblie/master/db/books/json/';
    for (const [key, v] of Object.entries(VERSIONS)) {
      expect(v.label, `label em falta: ${key}`).toMatch(/\S/);
      expect(v.url).toBe(`${base}${key}.json`);
    }
  });
});
