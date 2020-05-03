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
                    //data[book]['name'], data[book]['chapters'];
                    //console.log(book_name);
                    //console.log(book_chapters);
                }
            }
        },
        error: function(xhr, ajaxOptions, thrownError) {
            var errorMsg = 'Ajax request failed: ' + xhr.responseText;
        }
    });
    return book_name, book_chapters;
}

var book_chapters = info_book();
//console.log(book_name);
//console.log(book_chapters);

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
            listing_table.innerHTML += " <b><sup>" + versicle + ".</sup></b>" + book_chapters[i][versicle];
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
}

function num_chapters() {
    return Math.ceil(book_chapters.length / records_per_page);
}

window.onload = function() {
    change_chapter(1);
};