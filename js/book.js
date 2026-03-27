// get param url. 
var query = location.search.slice(1);
var partes = query.split('&');
var param = {};

partes.forEach(function(parte) {
    var chaveValor = parte.split('=');
    var chave = chaveValor[0];
    var valor = chaveValor[1];

    param[chave] = valor; // Object {lang: "pt", page: "home"}
});

// ---------------------------------------------------------------------------------------------------

// Load illustrative study images index
var available_images = [];
function load_image_index() {
    $.ajax({
        url: 'db/imgs/index.json',
        type: 'GET',
        dataType: 'json',
        async: false,
        success: function(data) {
            available_images = data;
        },
        error: function(xhr) {
            console.log("No image index found or failed to load");
        }
    });
}
load_image_index();

// ---------------------------------------------------------------------------------------------------

var book_chapters = [];

async function info_book() {
    await window.mainInitialized;
    
    var book_name;
    
    try {
        const response = await fetch(bible_url);
        const data = await response.json();
        
        for (let book in data) {
            if (data[book]['abbrev'] == param['abbrev']) {
                book_name = data[book]['name'];
                book_chapters = data[book]['chapters'];
                
                var version_names = {
                    'pt_acf': 'Almeida Corrigida e Revisada Fiel (PT-ACF)',
                    'pt_nvi': 'Nova Versão Internacional (PT-NVI)',
                    'pt_aa': 'Almeida Revisada Imprensa Bíblica (PT-AA)',
                    'en_bbe': 'Basic English (EN-BBE)',
                    'en_kjv': 'King James Version (EN-KJV)'
                };
                var current_version = await DB.getPref("bible_version", 'pt_aa');
                var version_name = version_names[current_version] || 'Bíblia';
                
                var bookTitleElement = document.getElementById("book_name");
                if (bookTitleElement) {
                    bookTitleElement.innerHTML = book_name + ' <small class="text-muted" style="font-size: 0.6em; vertical-align: middle;">' + version_name + '</small>';
                }
            }
        }
    } catch(error) {
        console.error('Fetch request failed: ' + error);
    }
}


// --------------------------------------------------------------------------------------------------
//pagination chapters

var current_page = 1;
var records_per_page = 1;

function prev_chapter() {
    if (current_page > 1) {
        current_page--;
        change_chapter(current_page);
    }
}

function next_chapter() {
    if (current_page < num_chapters()) {
        current_page++;
        change_chapter(current_page);
    }
}

function change_chapter(page) {
    var btn_next = document.getElementById("btn_next");
    var btn_prev = document.getElementById("btn_prev");
    var listing_table = document.getElementById("view_text");
    var page_span = document.getElementById("page");
    var skeleton = document.getElementById("text-skeleton");

    // Validate page
    if (page < 1) page = 1;
    if (page > num_chapters()) page = num_chapters();

    // Show skeleton, hide text while loading
    if (skeleton) skeleton.style.display = 'block';
    if (listing_table) listing_table.style.display = 'none';

    let htmlBuffer = "";

    for (var i = (page - 1) * records_per_page; i < (page * records_per_page); i++) {
        for (versicle in book_chapters[i]) {
            var realVersicle = parseInt(versicle) + 1;
            var imageName = param['abbrev'] + "-" + page + ":" + realVersicle + ".png";
            var imageIconHTML = "";
            if (available_images.includes(imageName)) {
                imageIconHTML = ' <i class="fas fa-image text-info ml-1" style="cursor: pointer;" onclick="showStudyImage(\'' + imageName + '\', \'Capítulo ' + page + ' Versículo ' + realVersicle + '\')" title="Visualizar Ilustração"></i> ';
            }
            htmlBuffer += `<span class="verse-item" id="v-${realVersicle}" onclick="showHighlightMenu(event, ${realVersicle})">` +
                          `<b><sup>${realVersicle}.</sup></b>${imageIconHTML} ${book_chapters[i][versicle]}</span> `;
        }
    }

    listing_table.innerHTML = htmlBuffer;

    // Hide skeleton, reveal text
    if (skeleton) skeleton.style.display = 'none';
    if (listing_table) listing_table.style.display = 'block';

    // Apply saved highlights and notes
    setTimeout(() => {
        applyHighlightsFromDB(param['abbrev'], page);
    }, 50);

    page_span.innerHTML = page;
    // Keep pulpit label in sync
    document.dispatchEvent(new CustomEvent('pulpit-chapter-changed', { detail: page }));

    if (page == 1) {
        btn_prev.style.visibility = "hidden";
    } else {
        btn_prev.style.visibility = "visible";
    }

    if (page == num_chapters()) {
        btn_next.style.visibility = "hidden";
    } else {
        btn_next.style.visibility = "visible";
    }

    // Save reading state to IndexedDB
    if (param && param['abbrev']) {
        DB.setChapter(param['abbrev'], page);
    }
}

// --- Highlighter Features ---

var activeVerseNum = null;

function showHighlightMenu(event, verseNum) {
    if (event) event.stopPropagation();
    activeVerseNum = verseNum;
    
    var popover = document.getElementById('hl-popover');
    if (!popover) return;
    
    // Position using client coords for better mobile support
    var x = event.clientX;
    var y = event.clientY;
    
    // Check screen boundaries
    var popWidth = 180; // approximate
    var popHeight = 50;
    
    if (x + popWidth > window.innerWidth) x = window.innerWidth - popWidth - 10;
    if (y - popHeight < 0) y = popHeight + 10;
    
    // Use fixed positioning to bypass parent scroll/transform issues
    popover.style.position = 'fixed';
    popover.style.left = x + 'px';
    popover.style.top = (y - 50) + 'px'; 
    popover.style.display = 'flex';
}

// Close popover when clicking elsewhere - Use capture phase or improved logic
document.addEventListener('mousedown', function(e) {
    var popover = document.getElementById('hl-popover');
    if (popover && !popover.contains(e.target)) {
        popover.style.display = 'none';
    }
});

async function saveHighlight(color) {
    if (!activeVerseNum) return;
    var book = param['abbrev'];
    var chapter = current_page;
    
    var verseEl = document.getElementById('v-' + activeVerseNum);
    
    // Remove all hl classes
    verseEl.classList.remove('hl-yellow', 'hl-green', 'hl-blue', 'hl-pink');
    
    if (color === 'clear') {
        await DB.deleteHighlight(book, chapter, activeVerseNum);
    } else {
        verseEl.classList.add('hl-' + color);
        await DB.setHighlight(book, chapter, activeVerseNum, color);
    }
    
    var popover = document.getElementById('hl-popover');
    if (popover) popover.style.display = 'none';
    activeVerseNum = null;
}

async function showReferences() {
    if (!activeVerseNum) return;
    var book = param['abbrev'];
    var chapter = current_page;
    var verseNum = activeVerseNum;

    // Close highlight popover
    var popover = document.getElementById('hl-popover');
    if (popover) popover.style.display = 'none';

    // Call the ReferenceManager
    if (window.ReferenceManager) {
        ReferenceManager.openPanel(book, chapter, verseNum);
    } else {
        console.error("ReferenceManager not loaded");
    }
}

async function showNoteModal() {
    if (!activeVerseNum) return;
    var book = param['abbrev'];
    var chapter = current_page;
    var verseNum = activeVerseNum;

    // Close highlight popover
    var popover = document.getElementById('hl-popover');
    if (popover) popover.style.display = 'none';

    // Get existing note
    const existingNote = await DB.getNote(book, chapter, verseNum);

    swal({
        title: "Nota - Versículo " + verseNum,
        text: "Escreva sua reflexão ou anotação para este versículo:",
        content: {
            element: "textarea",
            attributes: {
                placeholder: "Digite sua nota aqui...",
                value: existingNote || "",
                className: "form-control",
                rows: 5
            },
        },
        buttons: {
            cancel: "Cancelar",
            confirm: {
                text: "Salvar Nota",
                closeModal: true
            }
        },
    }).then(async (value) => {
        // If confirmed, value is the result of the input from the user. 
        // SweetAlert 1 uses the content element's value.
        // Actually, sweetalert (v1) returns the value of the input if confirmed.
        // But for nested content, it can be tricky.
        
        // Let's use a simpler way if swal v1 content is tricky, or just use the current implementation.
        // Since I'm using content: "textarea", swal will return the value of that textarea.
        if (value === null) return; // Cancelled
        
        if (value.trim() === "") {
            await DB.deleteNote(book, chapter, verseNum);
            removeNoteIcon(verseNum);
        } else {
            await DB.setNote(book, chapter, verseNum, value);
            addNoteIcon(verseNum);
        }
    });
    
    activeVerseNum = null;
}

function addNoteIcon(verseNum) {
    var el = document.getElementById('v-' + verseNum);
    if (el && !el.querySelector('.note-icon')) {
        var icon = document.createElement('i');
        icon.className = 'fas fa-sticky-note note-icon';
        icon.title = 'Possui nota';
        el.appendChild(icon);
    }
}

function removeNoteIcon(verseNum) {
    var el = document.getElementById('v-' + verseNum);
    if (el) {
        var icon = el.querySelector('.note-icon');
        if (icon) icon.remove();
    }
}

async function applyHighlightsFromDB(book, chapter) {
    const highlights = await DB.getHighlights(book, chapter);
    highlights.forEach(h => {
        var el = document.getElementById('v-' + h.verse);
        if (el) {
            el.classList.add('hl-' + h.color);
        }
    });

    const notes = await DB.getNotesForChapter(book, chapter);
    notes.forEach(n => {
        addNoteIcon(n.verse);
    });
}


function num_chapters() {
    return Math.ceil(book_chapters.length / records_per_page);
}

window.onload = async function() {
    await info_book();

    var saved_chapter = param && param['abbrev'] ? await DB.getChapter(param['abbrev'], null) : null;
    if (saved_chapter !== null) {
        current_page = parseInt(saved_chapter);
    } else {
        current_page = 1;
    }

    currentFontSize = await DB.getPref('reading_font_size', 17);
    currentFontSize = parseInt(currentFontSize) || 17;

    change_chapter(current_page);
    applyFontSize();
};

// --------------------------------------------------------------------------------------------------
// Adjust Font Size Features

var minFontSize = 12;
var maxFontSize = 40;
var currentFontSize = 17;

function applyFontSize() {
    var contentView = document.getElementById("view_text");
    if (contentView) {
        contentView.style.fontSize = currentFontSize + "px";
        contentView.style.lineHeight = "1.7"; // Ensures comfortable readability across devices
    }
    var fontSizeDisplay = document.getElementById("font_size_display");
    if (fontSizeDisplay) {
        fontSizeDisplay.innerText = currentFontSize;
    }
}

function increaseFontSize() {
    if (currentFontSize < maxFontSize) {
        currentFontSize += 2;
        DB.setPref('reading_font_size', currentFontSize);
        applyFontSize();
    }
}

function decreaseFontSize() {
    if (currentFontSize > minFontSize) {
        currentFontSize -= 2;
        DB.setPref('reading_font_size', currentFontSize);
        applyFontSize();
    }
}

function toggleSettingsSidebar() {
    var sidebar = document.getElementById("readingSettingsSidebar");
    var overlay = document.getElementById("readingSettingsOverlay");
    if (sidebar && overlay) {
        if (sidebar.classList.contains("show")) {
            sidebar.classList.remove("show");
            overlay.style.display = "none";
        } else {
            sidebar.classList.add("show");
            overlay.style.display = "block";
        }
    }
}

function showStudyImage(imageName, titleSuffix) {
    var imgElement = document.getElementById('studyImageSrc');
    var titleElement = document.getElementById('studyImageTitle');
    if (imgElement) {
        imgElement.src = 'db/imgs/' + imageName;
        if (titleElement && titleSuffix) {
            titleElement.innerText = 'Ilustração - ' + titleSuffix;
        }
        $('#studyImageModal').modal('show');
    }
}