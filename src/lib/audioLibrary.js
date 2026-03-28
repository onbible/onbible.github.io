// Mapping: book abbreviation → { folder, prefix }
// folder = directory inside /db/mp3/
// prefix = mp3 filename prefix (e.g. gen_01.mp3)
export const AUDIO_MAP = {
  gn:  { folder: 'gn',  prefix: 'gen' },
  ex:  { folder: 'ex',  prefix: 'exo' },
  lv:  { folder: 'lv',  prefix: 'lev' },
  nm:  { folder: 'nm',  prefix: 'num' },
  dt:  { folder: 'dt',  prefix: 'deu' },
  js:  { folder: 'js',  prefix: 'jos' },
  jz:  { folder: 'jz',  prefix: 'jud' },
  ru:  { folder: 'ru',  prefix: 'rut' },
  rt:  { folder: 'ru',  prefix: 'rut' },
  '1sm': { folder: '1sm', prefix: '1sam' },
  '2sm': { folder: '2sm', prefix: '2sam' },
  '1rs': { folder: '1rs', prefix: '1kin' },
  '2rs': { folder: '2rs', prefix: '2kin' },
  '1cr': { folder: '1cr', prefix: '1chr' },
  '2cr': { folder: '2cr', prefix: '2chr' },
  ed:  { folder: 'ed',  prefix: 'ezra' },
  ne:  { folder: 'ne',  prefix: 'neh' },
  et:  { folder: 'et',  prefix: 'est' },
  jó:  { folder: 'jó',  prefix: 'job' },
  sl:  { folder: 'sl',  prefix: 'psa' },
  pv:  { folder: 'pv',  prefix: 'pro' },
  ec:  { folder: 'ec',  prefix: 'ecl' },
  ct:  { folder: 'ct',  prefix: 'son' },
  is:  { folder: 'is',  prefix: 'isa' },
  jr:  { folder: 'jr',  prefix: 'jer' },
  lm:  { folder: 'lm',  prefix: 'lam' },
  ez:  { folder: 'ez',  prefix: 'eze' },
  dn:  { folder: 'dn',  prefix: 'dan' },
  os:  { folder: 'os',  prefix: 'hos' },
  jl:  { folder: 'jl',  prefix: 'joe' },
  am:  { folder: 'am',  prefix: 'amo' },
  ob:  { folder: 'ob',  prefix: 'oba' },
  jn:  { folder: 'jn',  prefix: 'jon' },
  mq:  { folder: 'mq',  prefix: 'mic' },
  na:  { folder: 'na',  prefix: 'nah' },
  hc:  { folder: 'hc',  prefix: 'hab' },
  sf:  { folder: 'sf',  prefix: 'zep' },
  ag:  { folder: 'ag',  prefix: 'hag' },
  zc:  { folder: 'zc',  prefix: 'zec' },
  ml:  { folder: 'ml',  prefix: 'mal' },
  mt:  { folder: 'mt',  prefix: 'mat' },
  mc:  { folder: 'mc',  prefix: 'mar' },
  lc:  { folder: 'lc',  prefix: 'luk' },
  jo:  { folder: 'jo',  prefix: 'joh' },
  at:  { folder: 'at',  prefix: 'act' },
  atos: { folder: 'at',  prefix: 'act' },
  rm:  { folder: 'rm',  prefix: 'rom' },
  '1co': { folder: '1co', prefix: '1cor' },
  '2co': { folder: '2co', prefix: '2cor' },
  gl:  { folder: 'gl',  prefix: 'gal' },
  ef:  { folder: 'ef',  prefix: 'eph' },
  fp:  { folder: 'fp',  prefix: 'phi' },
  cl:  { folder: 'cl',  prefix: 'col' },
  '1ts': { folder: '1ts', prefix: '1the' },
  '2ts': { folder: '2ts', prefix: '2the' },
  '1tm': { folder: '1tm', prefix: '1tim' },
  '2tm': { folder: '2tm', prefix: '2tim' },
  tt:  { folder: 'tt',  prefix: 'titus' },
  fm:  { folder: 'fm',  prefix: 'phil' },
  hb:  { folder: 'hb',  prefix: 'heb' },
  tg:  { folder: 'tg',  prefix: 'jam' },
  '1pe': { folder: '1pe', prefix: '1pet' },
  '2pe': { folder: '2pe', prefix: '2pet' },
  '1jo': { folder: '1jo', prefix: '1joh' },
  '2jo': { folder: '2jo', prefix: '2joh' },
  '3jo': { folder: '3jo', prefix: '3joh' },
  jd:  { folder: 'jd',  prefix: 'jud' },
  ap:  { folder: 'ap',  prefix: 'ap' },
};

/**
 * Generate playlist for a book given its abbreviation and chapter count.
 * @param {string} abbrev - Book abbreviation (e.g. 'gn')
 * @param {string} bookName - Book name (e.g. 'Gênesis')
 * @param {number} chapterCount - Number of chapters
 * @returns {Array<{file: string, title: string, chapter: number}>}
 */
export function buildPlaylist(abbrev, bookName, chapterCount) {
  const mapping = AUDIO_MAP[abbrev];
  if (!mapping) return [];
  const { folder, prefix } = mapping;
  const tracks = [];
  for (let ch = 1; ch <= chapterCount; ch++) {
    const num = String(ch).padStart(2, '0');
    tracks.push({
      file: `/db/mp3/${folder}/${prefix}_${num}.mp3`,
      title: `${bookName} — Capítulo ${ch}`,
      chapter: ch,
    });
  }
  return tracks;
}
