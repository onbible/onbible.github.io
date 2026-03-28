import { useState, useEffect } from 'react';

// TSK cross-reference data (josephilipraja/Bible-Cross-Reference-JSON)
const BOOK_FILE_MAP = {
  gn:{f:1,n:"Genesis"}, ex:{f:2,n:"Exodus"}, lv:{f:3,n:"Leviticus"}, nm:{f:4,n:"Numbers"},
  dt:{f:5,n:"Deuteronomy"}, js:{f:6,n:"Joshua"}, jz:{f:7,n:"Judges"}, rt:{f:7,n:"Ruth"},
  "1sm":{f:8,n:"1 Samuel"}, "2sm":{f:8,n:"2 Samuel"}, "1rs":{f:9,n:"1 Kings"}, "2rs":{f:9,n:"2 Kings"},
  "1cr":{f:10,n:"1 Chronicles"}, "2cr":{f:10,n:"2 Chronicles"}, ed:{f:11,n:"Ezra"},
  ne:{f:11,n:"Nehemiah"}, et:{f:11,n:"Esther"}, jo:{f:12,n:"Job"}, sl:{f:13,n:"Psalms"},
  pv:{f:14,n:"Proverbs"}, ec:{f:14,n:"Ecclesiastes"}, ct:{f:14,n:"Song of Solomon"},
  is:{f:15,n:"Isaiah"}, jr:{f:16,n:"Jeremiah"}, lm:{f:16,n:"Lamentations"},
  ez:{f:17,n:"Ezekiel"}, dn:{f:17,n:"Daniel"}, os:{f:18,n:"Hosea"}, jl:{f:18,n:"Joel"},
  am:{f:18,n:"Amos"}, ob:{f:18,n:"Obadiah"}, jn:{f:18,n:"Jonah"}, mq:{f:18,n:"Micah"},
  na:{f:18,n:"Nahum"}, hc:{f:18,n:"Habakkuk"}, sf:{f:18,n:"Zephaniah"}, ag:{f:18,n:"Haggai"},
  zc:{f:18,n:"Zechariah"}, ml:{f:18,n:"Malachi"},
  mt:{f:19,n:"Matthew"}, mc:{f:20,n:"Mark"}, lc:{f:21,n:"Luke"}, joa:{f:22,n:"John"},
  at:{f:23,n:"Acts"}, rm:{f:24,n:"Romans"}, "1co":{f:25,n:"1 Corinthians"},
  "2co":{f:25,n:"2 Corinthians"}, gl:{f:26,n:"Galatians"}, ef:{f:26,n:"Ephesians"},
  fp:{f:26,n:"Philippians"}, cl:{f:26,n:"Colossians"}, "1ts":{f:27,n:"1 Thessalonians"},
  "2ts":{f:27,n:"2 Thessalonians"}, "1tm":{f:27,n:"1 Timothy"}, "2tm":{f:27,n:"2 Timothy"},
  tt:{f:27,n:"Titus"}, fm:{f:27,n:"Philemon"}, hb:{f:28,n:"Hebrews"}, tg:{f:29,n:"James"},
  "1pe":{f:29,n:"1 Peter"}, "2pe":{f:29,n:"2 Peter"}, "1jo":{f:30,n:"1 John"},
  "2jo":{f:30,n:"2 John"}, "3jo":{f:30,n:"3 John"}, jd:{f:30,n:"Jude"}, ap:{f:31,n:"Revelation"},
};

const PT_NAMES = {
  "Genesis":"Gênesis","Exodus":"Êxodo","Leviticus":"Levítico","Numbers":"Números",
  "Deuteronomy":"Deuteronômio","Joshua":"Josué","Judges":"Juízes","Ruth":"Rute",
  "1 Samuel":"1 Samuel","2 Samuel":"2 Samuel","1 Kings":"1 Reis","2 Kings":"2 Reis",
  "1 Chronicles":"1 Crônicas","2 Chronicles":"2 Crônicas","Ezra":"Esdras",
  "Nehemiah":"Neemias","Esther":"Ester","Job":"Jó","Psalms":"Salmos",
  "Proverbs":"Provérbios","Ecclesiastes":"Eclesiastes","Song of Solomon":"Cânticos",
  "Isaiah":"Isaías","Jeremiah":"Jeremias","Lamentations":"Lamentações",
  "Ezekiel":"Ezequiel","Daniel":"Daniel","Hosea":"Oséias","Joel":"Joel","Amos":"Amós",
  "Obadiah":"Obadias","Jonah":"Jonas","Micah":"Miqueias","Nahum":"Naum",
  "Habakkuk":"Habacuque","Zephaniah":"Sofonias","Haggai":"Ageu",
  "Zechariah":"Zacarias","Malachi":"Malaquias","Matthew":"Mateus","Mark":"Marcos",
  "Luke":"Lucas","John":"João","Acts":"Atos","Romans":"Romanos",
  "1 Corinthians":"1 Coríntios","2 Corinthians":"2 Coríntios","Galatians":"Gálatas",
  "Ephesians":"Efésios","Philippians":"Filipenses","Colossians":"Colossenses",
  "1 Thessalonians":"1 Tessalonicenses","2 Thessalonians":"2 Tessalonicenses",
  "1 Timothy":"1 Timóteo","2 Timothy":"2 Timóteo","Titus":"Tito","Philemon":"Filemon",
  "Hebrews":"Hebreus","James":"Tiago","1 Peter":"1 Pedro","2 Peter":"2 Pedro",
  "1 John":"1 João","2 John":"2 João","3 John":"3 João","Jude":"Judas",
  "Revelation":"Apocalipse",
};

const fileCache = {};

export async function loadFile(num) {
  if (fileCache[num]) return fileCache[num];
  const url = `https://raw.githubusercontent.com/josephilipraja/Bible-Cross-Reference-JSON/master/${num}.json`;
  const resp = await fetch(url);
  const data = await resp.json();
  fileCache[num] = data;
  return data;
}

export { BOOK_FILE_MAP, PT_NAMES };

export function translateRef(ref) {
  for (const [en, pt] of Object.entries(PT_NAMES)) {
    if (ref.startsWith(en + ' ')) return pt + ref.slice(en.length);
  }
  return ref;
}

export function getVerseText(bibleData, refStr) {
  const m = refStr.match(/^(.+?)\s(\d+):(\d+)$/);
  if (!m) return null;
  const [, bookEn, ch, vs] = m;
  const abbrev = Object.entries(BOOK_FILE_MAP).find(([, v]) => v.n === bookEn)?.[0];
  if (!abbrev || !bibleData) return null;
  const book = Object.values(bibleData).find(b => b.abbrev === abbrev);
  return book?.chapters?.[+ch - 1]?.[+vs - 1] ?? null;
}

export default function CrossReferences({ bookAbbrev, chapter, verse, bibleData, onClose }) {
  const [refs, setRefs]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const info = BOOK_FILE_MAP[bookAbbrev];

  useEffect(() => {
    if (!info) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    loadFile(info.f)
      .then(data => {
        const key = `${info.n} ${chapter}:${verse}`;
        setRefs(data[key] || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [bookAbbrev, chapter, verse, info]);

  const ptBook = info ? (PT_NAMES[info.n] || info.n) : bookAbbrev;

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
      {!loading && refs?.map(ref => {
        const pt = translateRef(ref);
        const text = getVerseText(bibleData, ref);
        return (
          <div key={ref} className="cross-ref-item">
            <div className="cross-ref-ref">{pt}</div>
            {text && <div className="cross-ref-text">{text}</div>}
          </div>
        );
      })}
    </div>
  );
}
