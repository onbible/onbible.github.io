// src/lib/strongs.js
const cache = { hebrew: null, greek: null };

async function loadLexicon(lang) {
  if (cache[lang]) return cache[lang];
  const url = `/db/strongs/${lang}.json`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Falha ao carregar léxico ${lang}`);
  const data = await resp.json();
  cache[lang] = data;
  return data;
}

export async function loadHebrew() { return loadLexicon('hebrew'); }
export async function loadGreek()  { return loadLexicon('greek');  }

export async function loadAll() {
  const [heb, grk] = await Promise.all([loadHebrew(), loadGreek()]);
  return { ...heb, ...grk };
}

export async function lookupStrong(number) {
  const upper = number.toUpperCase().trim();
  const lang = upper.startsWith('H') ? 'hebrew' : upper.startsWith('G') ? 'greek' : null;
  if (!lang) return null;
  const lex = await loadLexicon(lang);
  return lex[upper] ? { id: upper, lang: lang === 'hebrew' ? 'Hebraico' : 'Grego', ...lex[upper] } : null;
}

export async function searchStrongs(query, lang = 'all') {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const sources = [];
  if (lang === 'all' || lang === 'hebrew') sources.push(['hebrew', await loadHebrew()]);
  if (lang === 'all' || lang === 'greek')  sources.push(['greek',  await loadGreek()]);

  const results = [];
  for (const [srcLang, lex] of sources) {
    for (const [id, entry] of Object.entries(lex)) {
      const idLower = id.toLowerCase();
      if (
        idLower === q ||
        idLower.includes(q) ||
        entry.translit.toLowerCase().includes(q) ||
        entry.lemma.includes(q) ||
        entry.def.toLowerCase().includes(q)
      ) {
        results.push({
          id,
          lang: srcLang === 'hebrew' ? 'Hebraico' : 'Grego',
          ...entry,
        });
      }
      if (results.length >= 50) break;
    }
    if (results.length >= 50) break;
  }

  // Exact number match first, then alphabetical by id
  results.sort((a, b) => {
    const aExact = a.id.toLowerCase() === q;
    const bExact = b.id.toLowerCase() === q;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    const aNum = parseInt(a.id.slice(1));
    const bNum = parseInt(b.id.slice(1));
    if (a.id[0] !== b.id[0]) return a.id[0] === 'H' ? -1 : 1;
    return aNum - bNum;
  });

  return results;
}
