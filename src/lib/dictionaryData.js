export const DICTIONARY_INDEX_URL = '/db/dicionario/lista_letras.json';

export function normalizeDictionaryKey(value) {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function stripEdgeNonAlphanumeric(s) {
  const str = s || '';
  let i = 0;
  let j = str.length;
  const isLn = (ch) => /\p{L}|\p{N}/u.test(ch);
  while (i < j && !isLn(str[i])) i += 1;
  while (j > i && !isLn(str[j - 1])) j -= 1;
  return str.slice(i, j);
}

/** First token of the selection, without surrounding punctuation (uma palavra). */
export function firstWordFromSelection(raw) {
  const s = (raw || '').trim();
  if (!s) return '';
  const chunk = s.split(/\s+/)[0];
  return stripEdgeNonAlphanumeric(chunk);
}

export function dictionaryLetterFromWord(word) {
  const key = normalizeDictionaryKey(word);
  if (!key) return null;
  const c = key.charAt(0);
  if (!/[a-z]/.test(c)) return null;
  return c;
}

export function findDictionaryEntry(entries, lookupWord) {
  const key = normalizeDictionaryKey(lookupWord);
  if (!key || !entries?.length) return null;
  return entries.find((e) => normalizeDictionaryKey(e.termo || '') === key) ?? null;
}

let indexCache = null;
const letterEntriesCache = {};

/** Para testes — limpa caches em memória. */
export function resetDictionaryCaches() {
  indexCache = null;
  Object.keys(letterEntriesCache).forEach((k) => {
    delete letterEntriesCache[k];
  });
}

export async function loadLetterEntries(letter) {
  const l = (letter || '').toLowerCase();
  if (letterEntriesCache[l] !== undefined) return letterEntriesCache[l];

  if (!indexCache) {
    const indexResp = await fetch(DICTIONARY_INDEX_URL);
    if (!indexResp.ok) throw new Error('Falha ao carregar índice do dicionário');
    indexCache = await indexResp.json();
  }

  const chunks = indexCache[l];
  if (!chunks?.length) {
    letterEntriesCache[l] = [];
    return [];
  }

  const all = await Promise.all(
    chunks.map(async (chunk) => {
      const resp = await fetch(`/db/dicionario/${l}/${chunk}.json`);
      if (!resp.ok) return [];
      const data = await resp.json();
      return Object.values(data).flat();
    })
  );

  const flat = all.flat();
  letterEntriesCache[l] = flat;
  return flat;
}

export async function lookupDictionaryWord(rawSelectedText) {
  const word = firstWordFromSelection(rawSelectedText);
  if (!word || word.length > 64) return { word: '', entry: null };

  const letter = dictionaryLetterFromWord(word);
  if (!letter) return { word, entry: null };

  const entries = await loadLetterEntries(letter);
  const entry = findDictionaryEntry(entries, word);
  return { word, entry };
}
