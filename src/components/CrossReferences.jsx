import { useState, useEffect } from 'react';

// ── TSK abbreviation → app abbreviation mapping ─────────────────────────
// TSK uses 3-letter English abbreviations; our app uses PT abbreviations
const TSK_TO_ABBREV = {
  GEN:'gn', EXO:'ex', LEV:'lv', NUM:'nm', DEU:'dt', JOS:'js', JDG:'jz', RUT:'rt',
  '1SA':'1sm', '2SA':'2sm', '1KI':'1rs', '2KI':'2rs', '1CH':'1cr', '2CH':'2cr',
  EZR:'ed', NEH:'ne', EST:'et', JOB:'jo', PSA:'sl', PRO:'pv', ECC:'ec', SOS:'ct',
  ISA:'is', JER:'jr', LAM:'lm', EZE:'ez', DAN:'dn', HOS:'os', JOE:'jl', AMO:'am',
  OBA:'ob', JON:'jn', MIC:'mq', NAH:'na', HAB:'hc', ZEP:'sf', HAG:'ag', ZEC:'zc',
  MAL:'ml', MAT:'mt', MAR:'mc', LUK:'lc', JOH:'joa', ACT:'at', ROM:'rm',
  '1CO':'1co', '2CO':'2co', GAL:'gl', EPH:'ef', PHP:'fp', COL:'cl',
  '1TH':'1ts', '2TH':'2ts', '1TI':'1tm', '2TI':'2tm', TIT:'tt', PHM:'fm',
  HEB:'hb', JAM:'tg', '1PE':'1pe', '2PE':'2pe', '1JO':'1jo', '2JO':'2jo', '3JO':'3jo',
  JDE:'jd', REV:'ap',
};

// Reverse: app abbreviation → TSK abbreviation
const ABBREV_TO_TSK = {};
for (const [tsk, app] of Object.entries(TSK_TO_ABBREV)) {
  ABBREV_TO_TSK[app] = tsk;
}

// TSK abbreviation → Portuguese name
const TSK_PT_NAMES = {
  GEN:'Gênesis', EXO:'Êxodo', LEV:'Levítico', NUM:'Números', DEU:'Deuteronômio',
  JOS:'Josué', JDG:'Juízes', RUT:'Rute', '1SA':'1 Samuel', '2SA':'2 Samuel',
  '1KI':'1 Reis', '2KI':'2 Reis', '1CH':'1 Crônicas', '2CH':'2 Crônicas',
  EZR:'Esdras', NEH:'Neemias', EST:'Ester', JOB:'Jó', PSA:'Salmos', PRO:'Provérbios',
  ECC:'Eclesiastes', SOS:'Cânticos', ISA:'Isaías', JER:'Jeremias', LAM:'Lamentações',
  EZE:'Ezequiel', DAN:'Daniel', HOS:'Oséias', JOE:'Joel', AMO:'Amós', OBA:'Obadias',
  JON:'Jonas', MIC:'Miqueias', NAH:'Naum', HAB:'Habacuque', ZEP:'Sofonias', HAG:'Ageu',
  ZEC:'Zacarias', MAL:'Malaquias', MAT:'Mateus', MAR:'Marcos', LUK:'Lucas', JOH:'João',
  ACT:'Atos', ROM:'Romanos', '1CO':'1 Coríntios', '2CO':'2 Coríntios', GAL:'Gálatas',
  EPH:'Efésios', PHP:'Filipenses', COL:'Colossenses', '1TH':'1 Tessalonicenses',
  '2TH':'2 Tessalonicenses', '1TI':'1 Timóteo', '2TI':'2 Timóteo', TIT:'Tito',
  PHM:'Filemon', HEB:'Hebreus', JAM:'Tiago', '1PE':'1 Pedro', '2PE':'2 Pedro',
  '1JO':'1 João', '2JO':'2 João', '3JO':'3 João', JDE:'Judas', REV:'Apocalipse',
};

// Which JSON file (1-31) contains each app abbreviation
export const BOOK_FILE_MAP = {
  gn:1, ex:2, lv:3, nm:4, dt:5, js:6, jz:7, rt:7,
  '1sm':8, '2sm':8, '1rs':9, '2rs':9, '1cr':10, '2cr':10,
  ed:11, ne:11, et:11, jo:12, sl:13, pv:14, ec:14, ct:14,
  is:15, jr:16, lm:16, ez:17, dn:17,
  os:18, jl:18, am:18, ob:18, jn:18, mq:18, na:18, hc:18, sf:18, ag:18, zc:18, ml:18,
  mt:19, mc:20, lc:21, joa:22, at:23, rm:24,
  '1co':25, '2co':25, gl:26, ef:26, fp:26, cl:26,
  '1ts':27, '2ts':27, '1tm':27, '2tm':27, tt:27, fm:27,
  hb:28, tg:29, '1pe':29, '2pe':29, '1jo':30, '2jo':30, '3jo':30, jd:30, ap:31,
};

// ── Cache & loader ──────────────────────────────────────────────────────
const fileCache = {};

export async function loadFile(num) {
  if (fileCache[num]) return fileCache[num];
  const url = `https://raw.githubusercontent.com/josephilipraja/Bible-Cross-Reference-JSON/master/${num}.json`;
  const resp = await fetch(url);
  const data = await resp.json();
  fileCache[num] = data;
  return data;
}

// ── Parse TSK format ────────────────────────────────────────────────────
// TSK ref string: "GEN 1 1" → { tsk: "GEN", ch: 1, vs: 1 }
function parseTskRef(ref) {
  const parts = ref.split(' ');
  if (parts.length < 3) return null;
  return { tsk: parts[0], ch: +parts[1], vs: +parts[2] };
}

// Format a TSK ref "GEN 1 1" → "Gênesis 1:1"
export function translateRef(ref) {
  const p = parseTskRef(ref);
  if (!p) return ref;
  const ptName = TSK_PT_NAMES[p.tsk] || p.tsk;
  return `${ptName} ${p.ch}:${p.vs}`;
}

// Get verse text from bibleData for a TSK ref string like "GEN 1 1"
export function getVerseText(bibleData, refStr) {
  const p = parseTskRef(refStr);
  if (!p || !bibleData) return null;
  const appAbbrev = TSK_TO_ABBREV[p.tsk];
  if (!appAbbrev) return null;
  const book = Object.values(bibleData).find(b => b.abbrev === appAbbrev);
  return book?.chapters?.[p.ch - 1]?.[p.vs - 1] ?? null;
}

// Find all cross-references for a specific verse from loaded TSK data
// TSK data: { "1": { "v": "GEN 1 1", "r": { "id": "EXO 20 11", ... } }, ... }
export function findRefsForVerse(data, tskAbbrev, chapter, verse) {
  const target = `${tskAbbrev} ${chapter} ${verse}`;
  for (const entry of Object.values(data)) {
    if (!entry.v || entry.v !== target) continue;
    if (!entry.r) return [];
    return Object.values(entry.r);
  }
  return [];
}

// Find which verses in a chapter have cross-references
export function findVersesWithRefs(data, tskAbbrev, chapter) {
  const prefix = `${tskAbbrev} ${chapter} `;
  const map = {};
  for (const entry of Object.values(data)) {
    if (!entry.v || !entry.v.startsWith(prefix)) continue;
    if (!entry.r || Object.keys(entry.r).length === 0) continue;
    const vs = +entry.v.split(' ')[2];
    map[vs] = Object.keys(entry.r).length;
  }
  return map;
}

export { TSK_TO_ABBREV, TSK_PT_NAMES, ABBREV_TO_TSK };

export default function CrossReferences({ bookAbbrev, chapter, verse, bibleData, onClose }) {
  const [refs, setRefs]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fileNum = BOOK_FILE_MAP[bookAbbrev];
  const tskAbbrev = ABBREV_TO_TSK[bookAbbrev];

  useEffect(() => {
    if (!fileNum || !tskAbbrev) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    loadFile(fileNum)
      .then(data => {
        setRefs(findRefsForVerse(data, tskAbbrev, chapter, verse));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookAbbrev, chapter, verse, fileNum, tskAbbrev]);

  const ptBook = tskAbbrev ? (TSK_PT_NAMES[tskAbbrev] || bookAbbrev) : bookAbbrev;

  return (
    <div id="cross-ref-panel" className="cross-ref-panel" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h6 style={{ margin: 0 }}>
          <i className="fas fa-link" style={{ marginRight: '6px' }} />
          Referências Cruzadas — {ptBook} {chapter}:{verse}
        </h6>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px' }}>&times;</button>
      </div>

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Buscando referências...</div>}
      {error   && <div style={{ color: '#ef4444', fontSize: '13px' }}>{error}</div>}
      {!loading && !error && refs?.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          <i className="fas fa-info-circle" style={{ marginRight: '4px' }} />
          Nenhuma referência encontrada para este versículo.
        </div>
      )}
      {!loading && refs?.map((ref, i) => {
        const pt = translateRef(ref);
        const text = getVerseText(bibleData, ref);
        return (
          <div key={`${ref}-${i}`} className="cross-ref-item">
            <div className="cross-ref-ref">{pt}</div>
            {text && <div className="cross-ref-text">{text}</div>}
          </div>
        );
      })}
    </div>
  );
}
