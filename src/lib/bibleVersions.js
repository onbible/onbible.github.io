// src/lib/bibleVersions.js
// Catálogo alinhado a db/books/json/index.json (fontes: rodriguesfas/biblie)
const BIBLE_JSON_BASE =
  'https://raw.githubusercontent.com/rodriguesfas/biblie/master/db/books/json';

const j = (id) => `${BIBLE_JSON_BASE}/${id}.json`;

export const VERSIONS = {
  ar_svd: { label: 'The Arabic Bible (AR-SVD)', url: j('ar_svd') },
  zh_cuv: { label: 'Chinese Union Version (ZH-CUV)', url: j('zh_cuv') },
  zh_ncv: { label: 'New Chinese Version (ZH-NCV)', url: j('zh_ncv') },
  de_schlachter: { label: 'Schlachter (DE-Schlachter)', url: j('de_schlachter') },
  el_greek: { label: 'Modern Greek (EL-Greek)', url: j('el_greek') },
  en_bbe: { label: 'Basic English (EN-BBE)', url: j('en_bbe') },
  en_kjv: { label: 'King James Version (EN-KJV)', url: j('en_kjv') },
  eo_esperanto: { label: 'Esperanto (EO-Esperanto)', url: j('eo_esperanto') },
  es_rvr: { label: 'Reina Valera (ES-RVR)', url: j('es_rvr') },
  fi_finnish: { label: 'Finnish Bible (FI-Finnish)', url: j('fi_finnish') },
  fi_pr: { label: 'Pyhä Raamattu (FI-PR)', url: j('fi_pr') },
  fr_apee: { label: "La Bible de l'Épée (FR-APEE)", url: j('fr_apee') },
  ko_ko: { label: 'Korean Version (KO-KO)', url: j('ko_ko') },
  pt_aa: { label: 'Almeida Revisada (PT-AA)', url: j('pt_aa') },
  pt_acf: { label: 'Almeida Corrigida (PT-ACF)', url: j('pt_acf') },
  pt_nvi: { label: 'Nova Versão Internacional (PT-NVI)', url: j('pt_nvi') },
  ro_cornilescu: { label: 'Versiunea Dumitru Cornilescu (RO-Cornilescu)', url: j('ro_cornilescu') },
  ru_synodal: { label: 'Синодальный перевод (RU-Synodal)', url: j('ru_synodal') },
  vi_vietnamese: { label: 'Tiếng Việt (VI-Vietnamese)', url: j('vi_vietnamese') },
};

export const DEFAULT_VERSION = 'pt_aa';
