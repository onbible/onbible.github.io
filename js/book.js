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

// get data book selected.
function info_book() {
    var book_name;
    var book_chapters;
    $.ajax({
        url: bible_url,
        type: 'GET',
        dataType: "json",
        async: false,
        success: function(data) {
            for (book in data) {
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
                    var current_version = localStorage.getItem("bible_version") || 'pt_aa';
                    var version_name = version_names[current_version] || 'Bíblia';
                    
                    var bookTitleElement = document.getElementById("book_name");
                    if (bookTitleElement) {
                        bookTitleElement.innerHTML = book_name + ' <small class="text-muted" style="font-size: 0.6em; vertical-align: middle;">' + version_name + '</small>';
                    }
                }
            }
        },
        error: function(xhr, ajaxOptions, thrownError) {
            var errorMsg = 'Ajax request failed: ' + xhr.responseText;
        }
    });
    return book_chapters;
}

var book_chapters = info_book();

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
            var imageName = param['abbrev'] + "-" + page + ":" + versicle + ".png";
            var imageIconHTML = "";
            if (available_images.includes(imageName)) {
                imageIconHTML = ' <i class="fas fa-image text-info ml-1" style="cursor: pointer;" onclick="showStudyImage(\'' + imageName + '\', \'Capítulo ' + page + ' Versículo ' + versicle + '\')" title="Visualizar Ilustração"></i> ';
            }
            listing_table.innerHTML += " <b><sup>" + versicle + ".</sup></b>" + imageIconHTML + book_chapters[i][versicle];
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

    // Save reading state to local storage
    if (param && param['abbrev']) {
        localStorage.setItem('last_chapter_' + param['abbrev'], page);
    }
}

function num_chapters() {
    return Math.ceil(book_chapters.length / records_per_page);
}

window.onload = function() {
    var saved_chapter = param && param['abbrev'] ? localStorage.getItem('last_chapter_' + param['abbrev']) : null;
    if (saved_chapter !== null) {
        current_page = parseInt(saved_chapter);
    } else {
        current_page = 1;
    }
    change_chapter(current_page);
    applyFontSize();
};

// --------------------------------------------------------------------------------------------------
// Adjust Font Size Features

var minFontSize = 12;
var maxFontSize = 40;
var currentFontSize = parseInt(localStorage.getItem('reading_font_size')) || 17;

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
        localStorage.setItem('reading_font_size', currentFontSize);
        applyFontSize();
    }
}

function decreaseFontSize() {
    if (currentFontSize > minFontSize) {
        currentFontSize -= 2;
        localStorage.setItem('reading_font_size', currentFontSize);
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