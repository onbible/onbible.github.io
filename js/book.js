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

    // Validate page
    if (page < 1) page = 1;
    if (page > num_chapters()) page = num_chapters();

    listing_table.innerHTML = "";

    for (var i = (page - 1) * records_per_page; i < (page * records_per_page); i++) {
        for (versicle in book_chapters[i]) {
            var realVersicle = parseInt(versicle) + 1;
            var imageName = param['abbrev'] + "-" + page + ":" + realVersicle + ".png";
            var imageIconHTML = "";
            if (available_images.includes(imageName)) {
                imageIconHTML = ' <i class="fas fa-image text-info ml-1" style="cursor: pointer;" onclick="showStudyImage(\'' + imageName + '\', \'Capítulo ' + page + ' Versículo ' + realVersicle + '\')" title="Visualizar Ilustração"></i> ';
            }
            listing_table.innerHTML += " <b><sup>" + realVersicle + ".</sup></b>" + imageIconHTML + " " + book_chapters[i][versicle];
        }
    }

    page_span.innerHTML = page;

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