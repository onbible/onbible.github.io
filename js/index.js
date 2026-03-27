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
                <div class="col-xl-3 col-md-6 mb-4 book-item" data-name="' + data[book]['name'].toLowerCase() + '">\
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

            // Filter logic using vanilla JS to avoid any potential jQuery version conflicts
            var filterInput = document.getElementById('filterBooks');
            if (filterInput) {
                filterInput.addEventListener('input', function(e) {
                    var searchTerm = e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    var items = document.querySelectorAll('.book-item');
                    items.forEach(function(item) {
                        var bookName = String(item.getAttribute('data-name')).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        if (bookName.includes(searchTerm)) {
                            item.style.display = '';
                        } else {
                            item.style.display = 'none';
                        }
                    });
                });
                
                // Trigger filter initially in case user typed something while the skeleton loader was running
                if (filterInput.value.trim() !== '') {
                    filterInput.dispatchEvent(new Event('input'));
                }
            }
        },
        error: function(xhr, ajaxOptions, thrownError) {
            var errorMsg = 'Ajax request failed: ' + xhr.responseText;
            $('#books').html(errorMsg);
        }
    });
});