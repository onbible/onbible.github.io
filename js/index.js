$(document).ready(function() {
    $.ajax({
        url: bible_url,
        type: 'GET',
        dataType: "json",
        success: function(data) {
            var book_list = '';
            for (book in data) {
                //console.log(data[book]);
                book_list += '\
                <div class="col-xl-3 col-md-6 mb-4">\
                    <a href="book.html?abbrev=' + data[book]['abbrev'] + '">\
                        <div class="card border-left-primary shadow h-100 py-2">\
                            <div class="card-body">\
                                <div class="row no-gutters align-items-center">\
                                    <div class="col mr-2">\
                                        <div class="h5 mb-0 font-weight-bold text-gray-800">' + data[book]['name'] + '</div>\
                                            <div class="h5 mb-0 font-weight-bold text-gray-800"><small class="btn-sm btn-primary btn-circle">' + data[book]['chapters'].length + '</small> <small>Capítulos</small></div>\
                                        </div>\
                                    <div class="col-auto">\
                                        <i class="fas fa-2x text-gray-300"> ' + data[book]['abbrev'].toUpperCase() + '</i>\
                                    </div>\
                                </div>\
                            </div>\
                        </div>\
                    </a>\
                </div>';
            }
            $('#books').html(book_list);
        },
        error: function(xhr, ajaxOptions, thrownError) {
            var errorMsg = 'Ajax request failed: ' + xhr.responseText;
            $('#books').html(errorMsg);
        }
    });
});