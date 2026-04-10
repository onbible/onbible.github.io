/**
 * Pacotes opcionais para guardar no cache do Service Worker (`sw.js` → SW_CACHE_NAME).
 */

import { PORTUGUESE_DICTIONARY_INDEX_URL } from './portugueseDictionary.js';
import { VERSIONS } from './bibleVersions';

export const SW_CACHE_NAME = 'onbible-cache-v4-spa';

export { PORTUGUESE_DICTIONARY_INDEX_URL };

const BIBLICAL_DICT_INDEX = '/db/dicionario/lista_letras.json';
const CONCORDANCE_INDEX = '/db/concordancia/lista_letras.json';
const CANTOR_INDEX = '/db/cantorcristao/cantorcristao_index.json';
const HARPA_INDEX = '/db/harpacrista/harpacrista_index.json';
const PDF_INDEX = '/db/books/pdf/pdf_index.json';

/** Metadados para a UI (Configurações → Recursos offline). */
export const OFFLINE_RESOURCE_PACKS = [
  {
    id: 'pt_dict',
    label: 'Dicionário de língua portuguesa',
    description: 'Léxico geral (definições locais).',
  },
  {
    id: 'biblical_dict',
    label: 'Dicionário bíblico',
    description: 'Entradas temáticas do dicionário bíblico.',
  },
  {
    id: 'bible_versions',
    label: 'Traduções da Bíblia',
    description: 'JSON de todas as versões disponíveis (primeira transferência via Internet).',
  },
  {
    id: 'strongs',
    label: "Strong's (hebraico e grego)",
    description: 'Léxicos para números Strong nos estudos.',
  },
  {
    id: 'cantor',
    label: 'Cantor Cristão',
    description: 'Índice e letras dos hinos.',
  },
  {
    id: 'harpa',
    label: 'Harpa Cristã',
    description: 'Índice e letras dos louvores.',
  },
  {
    id: 'concordance',
    label: 'Concordância',
    description: 'Entradas e referências da concordância.',
  },
  {
    id: 'pdf_books',
    label: 'Livros PDF',
    description: 'Catálogo e ficheiros PDF da biblioteca.',
  },
];

async function listUrlsFromLetterIndex(indexUrl, basePath) {
  const r = await fetch(indexUrl);
  if (!r.ok) return [];
  const idx = await r.json();
  const urls = [indexUrl];
  for (const letter of Object.keys(idx)) {
    const chunks = idx[letter];
    if (!Array.isArray(chunks)) continue;
    for (const chunk of chunks) {
      urls.push(`${basePath}/${letter}/${chunk}.json`);
    }
  }
  return urls;
}

/**
 * Lista URLs absolutas de caminho (origem actual) necessárias para o dicionário de português local.
 */
export async function listPortugueseDictionaryAssetUrls() {
  const r = await fetch(PORTUGUESE_DICTIONARY_INDEX_URL);
  if (!r.ok) return [];
  const idx = await r.json();
  const urls = [PORTUGUESE_DICTIONARY_INDEX_URL];
  for (const letter of Object.keys(idx)) {
    const chunks = idx[letter];
    if (!Array.isArray(chunks)) continue;
    for (const chunk of chunks) {
      urls.push(`/db/dicionario_pt/${letter}/${chunk}.json`);
    }
  }
  return urls;
}

export async function listBiblicalDictionaryUrls() {
  return listUrlsFromLetterIndex(BIBLICAL_DICT_INDEX, '/db/dicionario');
}

export async function listConcordanceUrls() {
  return listUrlsFromLetterIndex(CONCORDANCE_INDEX, '/db/concordancia');
}

export async function listCantorCristaoUrls() {
  const r = await fetch(CANTOR_INDEX);
  if (!r.ok) return [];
  const rows = await r.json();
  const urls = [CANTOR_INDEX];
  if (!Array.isArray(rows)) return urls;
  for (const row of rows) {
    const n = row?.numero;
    if (n === undefined || n === null) continue;
    urls.push(`/db/cantorcristao/${n}.json`);
  }
  return urls;
}

export async function listHarpaCristaUrls() {
  const r = await fetch(HARPA_INDEX);
  if (!r.ok) return [];
  const rows = await r.json();
  const urls = [HARPA_INDEX];
  if (!Array.isArray(rows)) return urls;
  for (const row of rows) {
    const n = row?.numero;
    if (n === undefined || n === null) continue;
    urls.push(`/db/harpacrista/${n}.json`);
  }
  return urls;
}

export function listStrongsUrls() {
  return ['/db/strongs/hebrew.json', '/db/strongs/greek.json'];
}

export function listBibleVersionUrls() {
  return Object.values(VERSIONS)
    .map((v) => v?.url)
    .filter(Boolean);
}

export async function listPdfBooksUrls() {
  const r = await fetch(PDF_INDEX);
  if (!r.ok) return [];
  const books = await r.json();
  const urls = [PDF_INDEX];
  if (!Array.isArray(books)) return urls;
  for (const b of books) {
    const f = b?.file;
    if (!f) continue;
    urls.push(`/db/books/pdf/${encodeURIComponent(f)}`);
  }
  return urls;
}

let packUrlsMemo = Object.create(null);

/** Para testes — limpa memoização das listas de URLs por pacote. */
export function resetOfflinePackUrlCache() {
  packUrlsMemo = Object.create(null);
}

async function computePackAssetUrls(packId) {
  switch (packId) {
    case 'pt_dict':
      return listPortugueseDictionaryAssetUrls();
    case 'biblical_dict':
      return listBiblicalDictionaryUrls();
    case 'bible_versions':
      return listBibleVersionUrls();
    case 'strongs':
      return listStrongsUrls();
    case 'cantor':
      return listCantorCristaoUrls();
    case 'harpa':
      return listHarpaCristaUrls();
    case 'concordance':
      return listConcordanceUrls();
    case 'pdf_books':
      return listPdfBooksUrls();
    default:
      return [];
  }
}

/**
 * @param {string} packId
 * @returns {Promise<string[]>}
 */
export async function getPackAssetUrls(packId) {
  if (packUrlsMemo[packId]) return packUrlsMemo[packId];
  const urls = await computePackAssetUrls(packId);
  packUrlsMemo[packId] = urls;
  return urls;
}

/**
 * @param {string[]} urls
 * @returns {Promise<{ ok: boolean, total: number, failed: number }>}
 */
export async function precacheUrlList(urls) {
  if (typeof caches === 'undefined') {
    return { ok: false, total: 0, failed: 1 };
  }
  if (!urls.length) {
    return { ok: false, total: 0, failed: 1 };
  }

  const cache = await caches.open(SW_CACHE_NAME);
  let failed = 0;

  for (const u of urls) {
    try {
      const res = await fetch(u);
      if (!res.ok) {
        failed += 1;
        continue;
      }
      await cache.put(u, res.clone());
    } catch {
      failed += 1;
    }
  }

  return { ok: failed === 0, total: urls.length, failed };
}

/**
 * @param {string} packId
 */
export async function precachePack(packId) {
  const urls = await computePackAssetUrls(packId);
  packUrlsMemo[packId] = urls;
  return precacheUrlList(urls);
}

const LARGE_PACK_SAMPLE_THRESHOLD = 400;

/**
 * @param {string[]} urls
 */
export async function isUrlListFullyCached(urls) {
  if (typeof caches === 'undefined') return false;
  if (!urls.length) return false;

  const cache = await caches.open(SW_CACHE_NAME);

  if (urls.length <= LARGE_PACK_SAMPLE_THRESHOLD) {
    for (const u of urls) {
      if (!(await cache.match(u))) return false;
    }
    return true;
  }

  const picks = new Set([0, urls.length - 1, Math.floor(urls.length / 2)]);
  for (let i = 1; i <= 4; i += 1) {
    picks.add(Math.floor((urls.length * i) / 5));
  }
  for (const i of picks) {
    const u = urls[Math.min(Math.max(0, i), urls.length - 1)];
    if (!(await cache.match(u))) return false;
  }
  return true;
}

/**
 * @param {string} packId
 */
export async function isPackCached(packId) {
  const urls = await getPackAssetUrls(packId);
  return isUrlListFullyCached(urls);
}

/**
 * Descarrega e guarda no cache do SW todos os ficheiros do dicionário de português.
 * @returns {Promise<{ ok: boolean, total: number, failed: number }>}
 */
export async function precachePortugueseDictionary() {
  return precachePack('pt_dict');
}

/**
 * Verifica se todos os ficheiros do dicionário PT estão no cache do SW.
 */
export async function isPortugueseDictionaryCached() {
  return isPackCached('pt_dict');
}
