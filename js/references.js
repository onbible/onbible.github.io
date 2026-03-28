// js/references.js — Referências Cruzadas via TSK (josephilipraja/Bible-Cross-Reference-JSON)
// Os 32 arquivos JSON correspondem aos 66 livros da Bíblia divididos em grupos.

const ReferenceManager = {
    // Mapeamento: abreviação OnBible → número do arquivo TSK → posição dentro do arquivo
    // O repositório usa 32 arquivos cobrindo grupos de livros.
    // Cada arquivo é um objeto: { "BookName Chapter:Verse": ["Ref1", "Ref2", ...] }
    bookFileMap: {
        // Old Testament
        "gn":  {f:1,  name:"Genesis"},    "ex":  {f:2,  name:"Exodus"},
        "lv":  {f:3,  name:"Leviticus"},  "nm":  {f:4,  name:"Numbers"},
        "dt":  {f:5,  name:"Deuteronomy"},"js":  {f:6,  name:"Joshua"},
        "jz":  {f:7,  name:"Judges"},     "rt":  {f:7,  name:"Ruth"},
        "1sm": {f:8,  name:"1 Samuel"},   "2sm": {f:8,  name:"2 Samuel"},
        "1rs": {f:9,  name:"1 Kings"},    "2rs": {f:9,  name:"2 Kings"},
        "1cr": {f:10, name:"1 Chronicles"},"2cr":{f:10, name:"2 Chronicles"},
        "ed":  {f:11, name:"Ezra"},       "ne":  {f:11, name:"Nehemiah"},
        "et":  {f:11, name:"Esther"},     "jo":  {f:12, name:"Job"},
        "sl":  {f:13, name:"Psalms"},     "pv":  {f:14, name:"Proverbs"},
        "ec":  {f:14, name:"Ecclesiastes"},"ct": {f:14, name:"Song of Solomon"},
        "is":  {f:15, name:"Isaiah"},     "jr":  {f:16, name:"Jeremiah"},
        "lm":  {f:16, name:"Lamentations"},"ez": {f:17, name:"Ezekiel"},
        "dn":  {f:17, name:"Daniel"},     "os":  {f:18, name:"Hosea"},
        "jl":  {f:18, name:"Joel"},       "am":  {f:18, name:"Amos"},
        "ob":  {f:18, name:"Obadiah"},    "jn":  {f:18, name:"Jonah"},
        "mq":  {f:18, name:"Micah"},      "na":  {f:18, name:"Nahum"},
        "hc":  {f:18, name:"Habakkuk"},   "sf":  {f:18, name:"Zephaniah"},
        "ag":  {f:18, name:"Haggai"},     "zc":  {f:18, name:"Zechariah"},
        "ml":  {f:18, name:"Malachi"},
        // New Testament
        "mt":  {f:19, name:"Matthew"},    "mc":  {f:20, name:"Mark"},
        "lc":  {f:21, name:"Luke"},       "joa": {f:22, name:"John"},
        "at":  {f:23, name:"Acts"},       "rm":  {f:24, name:"Romans"},
        "1co": {f:25, name:"1 Corinthians"},"2co":{f:25, name:"2 Corinthians"},
        "gl":  {f:26, name:"Galatians"},  "ef":  {f:26, name:"Ephesians"},
        "fp":  {f:26, name:"Philippians"},"cl":  {f:26, name:"Colossians"},
        "1ts": {f:27, name:"1 Thessalonians"},"2ts":{f:27, name:"2 Thessalonians"},
        "1tm": {f:27, name:"1 Timothy"},  "2tm": {f:27, name:"2 Timothy"},
        "tt":  {f:27, name:"Titus"},      "fm":  {f:27, name:"Philemon"},
        "hb":  {f:28, name:"Hebrews"},    "tg":  {f:29, name:"James"},
        "1pe": {f:29, name:"1 Peter"},    "2pe": {f:29, name:"2 Peter"},
        "1jo": {f:30, name:"1 John"},     "2jo": {f:30, name:"2 John"},
        "3jo": {f:30, name:"3 John"},     "jd":  {f:30, name:"Jude"},
        "ap":  {f:31, name:"Revelation"}
    },

    // Cache para evitar baixar o mesmo arquivo múltiplas vezes
    _cache: {},

    // Nome PT-BR para exibição
    ptNames: {
        "Genesis":"Gênesis","Exodus":"Êxodo","Leviticus":"Levítico","Numbers":"Números",
        "Deuteronomy":"Deuteronômio","Joshua":"Josué","Judges":"Juízes","Ruth":"Rute",
        "1 Samuel":"1 Samuel","2 Samuel":"2 Samuel","1 Kings":"1 Reis","2 Kings":"2 Reis",
        "1 Chronicles":"1 Crônicas","2 Chronicles":"2 Crônicas","Ezra":"Esdras",
        "Nehemiah":"Neemias","Esther":"Ester","Job":"Jó","Psalms":"Salmos",
        "Proverbs":"Provérbios","Ecclesiastes":"Eclesiastes","Song of Solomon":"Cânticos",
        "Isaiah":"Isaías","Jeremiah":"Jeremias","Lamentations":"Lamentações",
        "Ezekiel":"Ezequiel","Daniel":"Daniel","Hosea":"Oséias","Joel":"Joel",
        "Amos":"Amós","Obadiah":"Obadias","Jonah":"Jonas","Micah":"Miqueias",
        "Nahum":"Naum","Habakkuk":"Habacuque","Zephaniah":"Sofonias","Haggai":"Ageu",
        "Zechariah":"Zacarias","Malachi":"Malaquias","Matthew":"Mateus","Mark":"Marcos",
        "Luke":"Lucas","John":"João","Acts":"Atos","Romans":"Romanos",
        "1 Corinthians":"1 Coríntios","2 Corinthians":"2 Coríntios","Galatians":"Gálatas",
        "Ephesians":"Efésios","Philippians":"Filipenses","Colossians":"Colossenses",
        "1 Thessalonians":"1 Tessalonicenses","2 Thessalonians":"2 Tessalonicenses",
        "1 Timothy":"1 Timóteo","2 Timothy":"2 Timóteo","Titus":"Tito",
        "Philemon":"Filemon","Hebrews":"Hebreus","James":"Tiago",
        "1 Peter":"1 Pedro","2 Peter":"2 Pedro","1 John":"1 João",
        "2 John":"2 João","3 John":"3 João","Jude":"Judas","Revelation":"Apocalipse"
    },

    async loadFile(fileNum) {
        if (this._cache[fileNum]) return this._cache[fileNum];
        const url = `https://raw.githubusercontent.com/josephilipraja/Bible-Cross-Reference-JSON/master/${fileNum}.json`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Arquivo ${fileNum}.json não encontrado.`);
        const data = await resp.json();
        this._cache[fileNum] = data;
        return data;
    },

    async openPanel(bookAbbrev, chapter, verse) {
        const panel = document.getElementById('cross-references-panel');
        const list  = document.getElementById('references-list');
        const title = document.getElementById('cross-ref-title');
        if (!panel) return;

        const info = this.bookFileMap[bookAbbrev];
        if (!info) { panel.style.display = 'none'; return; }

        const ptBook = this.ptNames[info.name] || info.name;
        title.innerHTML = `<i class="fas fa-link" style="margin-right:6px;"></i>Referências — ${ptBook} ${chapter}:${verse}`;
        panel.style.display = 'block';
        list.innerHTML = '<div style="color:#9ca3af;font-size:13px;padding:8px 0;">Buscando referências...</div>';

        // Scroll para o painel
        setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

        try {
            const data = await this.loadFile(info.f);
            // Chave no formato "BookName Chapter:Verse"
            const key = `${info.name} ${chapter}:${verse}`;
            const refs = data[key];

            if (!refs || refs.length === 0) {
                list.innerHTML = '<div style="color:#9ca3af;font-size:13px;padding:8px 0;"><i class="fas fa-info-circle" style="margin-right:4px;"></i>Nenhuma referência encontrada para este versículo.</div>';
                return;
            }

            list.innerHTML = '';
            refs.forEach(ref => {
                const ptRef = this._translateRef(ref);
                const item = document.createElement('div');
                item.className = 'cross-ref-item';
                item.innerHTML = `
                    <div class="cross-ref-ref">${ptRef}</div>
                    <div class="cross-ref-text" id="crt-${ref.replace(/[:\s]/g,'-')}">Carregando...</div>
                `;
                list.appendChild(item);
                this._loadRefText(ref, `crt-${ref.replace(/[:\s]/g,'-')}`);
            });
        } catch (e) {
            list.innerHTML = `<div style="color:#ef4444;font-size:13px;">${e.message}</div>`;
        }
    },

    _translateRef(ref) {
        // ref: "Genesis 1:1"  →  "Gênesis 1:1"
        for (const [en, pt] of Object.entries(this.ptNames)) {
            if (ref.startsWith(en + ' ')) {
                return pt + ref.slice(en.length);
            }
        }
        return ref;
    },

    async _loadRefText(ref, elId) {
        const el = document.getElementById(elId);
        if (!el) return;
        try {
            // Descobrir abbrev a partir do nome EN
            const match = ref.match(/^(.+?)\s(\d+):(\d+)$/);
            if (!match) { el.innerText = ''; return; }
            const [, bookEn, ch, vs] = match;
            const entry = Object.entries(this.bookFileMap).find(([,v]) => v.name === bookEn);
            if (!entry) { el.innerText = ''; return; }
            const abbrev = entry[0];

            // Buscar texto na Bíblia carregada
            const resp = await fetch(bible_url);
            const bibleData = await resp.json();
            const book = Object.values(bibleData).find(b => b.abbrev === abbrev);
            if (book && book.chapters[+ch-1] && book.chapters[+ch-1][+vs-1]) {
                el.innerText = book.chapters[+ch-1][+vs-1];
            } else {
                el.innerText = '';
            }
        } catch(e) {
            el.innerText = '';
        }
    }
};

function showReferences() {
    // Chamado pelo botão no popover (definido em book.js)
    if (!window.activeVerseNum) return;
    const popover = document.getElementById('hl-popover');
    if (popover) popover.style.display = 'none';
    ReferenceManager.openPanel(param['abbrev'], current_page, window.activeVerseNum);
}

function closeCrossReferences() {
    const panel = document.getElementById('cross-references-panel');
    if (panel) panel.style.display = 'none';
}
