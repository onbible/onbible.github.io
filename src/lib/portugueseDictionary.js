/**
 * Dicionário de língua portuguesa — dados locais em `/db/dicionario_pt/` (mesmo padrão de chunks que o dicionário bíblico).
 */

export const PORTUGUESE_DICTIONARY_INDEX_URL = '/db/dicionario_pt/lista_letras.json';

let indexCache = null;
const letterEntriesCache = {};

export function resetPortugueseDictionaryCache() {
  indexCache = null;
  Object.keys(letterEntriesCache).forEach((k) => {
    delete letterEntriesCache[k];
  });
}

function normalizeKey(value) {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function stripEdgeNonAlphanumeric(s) {
  const str = s || '';
  let i = 0;
  let j = str.length;
  const isLn = (ch) => /\p{L}|\p{N}/u.test(ch);
  while (i < j && !isLn(str[i])) i += 1;
  while (j > i && !isLn(str[j - 1])) j -= 1;
  return str.slice(i, j);
}

function firstWordToken(raw) {
  const s = (raw || '').trim();
  if (!s) return '';
  const chunk = s.split(/\s+/)[0];
  return stripEdgeNonAlphanumeric(chunk);
}

function dictionaryLetterFromWord(word) {
  const key = normalizeKey(word);
  if (!key) return null;
  const c = key.charAt(0);
  if (!/[a-z]/.test(c)) return null;
  return c;
}

export function findPortugueseEntry(entries, lookupWord) {
  const key = normalizeKey(lookupWord);
  if (!key || !entries?.length) return null;
  return entries.find((e) => normalizeKey(e.termo || '') === key) ?? null;
}

export async function loadPortugueseLetterEntries(letter) {
  const l = (letter || '').toLowerCase();
  if (letterEntriesCache[l] !== undefined) return letterEntriesCache[l];

  if (!indexCache) {
    const indexResp = await fetch(PORTUGUESE_DICTIONARY_INDEX_URL);
    if (!indexResp.ok) throw new Error('Falha ao carregar índice do dicionário de português');
    indexCache = await indexResp.json();
  }

  const chunks = indexCache[l];
  if (!chunks?.length) {
    letterEntriesCache[l] = [];
    return [];
  }

  const all = await Promise.all(
    chunks.map(async (chunk) => {
      const resp = await fetch(`/db/dicionario_pt/${l}/${chunk}.json`);
      if (!resp.ok) return [];
      const data = await resp.json();
      return Object.values(data).flat();
    })
  );

  const flat = all.flat();
  letterEntriesCache[l] = flat;
  return flat;
}

/**
 * @param {string} rawWord
 * @returns {Promise<{ lemma: string, definitions: string[] } | null>}
 */
export async function lookupPortugueseWord(rawWord) {
  const word = firstWordToken(rawWord);
  if (!word || word.length < 2 || word.length > 80) return null;

  const letter = dictionaryLetterFromWord(word);
  if (!letter) return null;

  let entries;
  try {
    entries = await loadPortugueseLetterEntries(letter);
  } catch {
    return null;
  }

  const entry = findPortugueseEntry(entries, word);
  if (!entry) return null;

  const lemma = (entry.termo || word).trim();
  const rawDefs = entry.definicoes;
  const definitions = Array.isArray(rawDefs)
    ? rawDefs.map((d) => String(d).trim()).filter(Boolean)
    : entry.definicao
      ? [String(entry.definicao).trim()]
      : [];

  if (!definitions.length) return null;

  return { lemma, definitions };
}
