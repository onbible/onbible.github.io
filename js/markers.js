// js/markers.js

async function loadMarkers() {
    await window.mainInitialized;
    const listEl = document.getElementById('markers-list');
    
    // 1. Get all data
    const highlights = await DB.getAllHighlights();
    const notes = await DB.getAllNotes();
    
    if (highlights.length === 0 && notes.length === 0) {
        listEl.innerHTML = `
            <div class="p-5 text-center text-muted">
                <i class="fas fa-bookmark fa-3x mb-3" style="opacity: 0.2;"></i>
                <h5>Nenhum marcador encontrado</h5>
                <p>Seus versículos sublinhados e notas aparecerão aqui.</p>
                <a href="index.html" class="btn btn-primary mt-3">Ir para a Bíblia</a>
            </div>
        `;
        return;
    }

    // 2. Fetch book names for display
    let bookNames = {};
    try {
        const response = await fetch(bible_url);
        const data = await response.json();
        for (let book in data) {
            bookNames[data[book]['abbrev']] = {
                name: data[book]['name'],
                chapters: data[book]['chapters']
            };
        }
    } catch (e) {
        console.error("Failed to load bible names", e);
    }

    // 3. Combine and sort
    // We want to group by book/chapter/verse
    let markers = {};

    highlights.forEach(h => {
        const key = `${h.book}-${h.chapter}-${h.verse}`;
        if (!markers[key]) markers[key] = { book: h.book, chapter: h.chapter, verse: h.verse };
        markers[key].color = h.color;
    });

    notes.forEach(n => {
        const key = `${n.book}-${n.chapter}-${n.verse}`;
        if (!markers[key]) markers[key] = { book: n.book, chapter: n.chapter, verse: n.verse };
        markers[key].note = n.text;
    });

    // Convert to array and sort (Book -> Chapter -> Verse)
    // For now, let's just sort by ID or simple numeric order if possible
    let sortedMarkers = Object.values(markers).sort((a, b) => {
        if (a.book !== b.book) return a.book.localeCompare(b.book);
        if (a.chapter !== b.chapter) return a.chapter - b.chapter;
        return a.verse - b.verse;
    });

    // 4. Render
    let html = "";
    sortedMarkers.forEach(m => {
        const bookInfo = bookNames[m.book] || { name: m.book.toUpperCase(), chapters: [] };
        const bookName = bookInfo.name;
        
        // Try to get verse text if we have the book data
        let verseText = "";
        if (bookInfo.chapters.length >= m.chapter) {
            const chap = bookInfo.chapters[m.chapter - 1];
            if (chap && chap[m.verse - 1]) {
                verseText = chap[m.verse - 1];
            }
        }

        const colorDot = m.color ? `<span class="marker-color-dot hl-${m.color}"></span>` : "";
        const noteBox = m.note ? `<div class="note-content"><b>Sua nota:</b> ${m.note}</div>` : "";
        
        html += `
            <div class="marker-item" onclick="window.location.href='book.html?abbrev=${m.book}&chapter=${m.chapter}#v-${m.verse}'">
                <span class="verse-ref">${colorDot}${bookName} ${m.chapter}:${m.verse}</span>
                <span class="verse-text">${verseText}</span>
                ${noteBox}
            </div>
        `;
    });

    listEl.innerHTML = html;
}

window.onload = loadMarkers;
