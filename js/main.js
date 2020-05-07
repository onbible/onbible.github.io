/*
$(window).load(function() {
    swal("Sermão", "Bem vindo!", {
        buttons: false,
        timer: 3000,
    });
});
*/



var bible_url;
var bible_version = localStorage.getItem("bible_version");
// console.log(bible_version);
//var bible_version = localStorage['bible_version'] || 'defaultValue';

switch (bible_version) {
    case 'pt_acf':
        bible_url = 'https://raw.githubusercontent.com/rodriguesfas/biblie/master/db/books/json/pt_acf.json'
        break;
    case 'pt_nvi':
        bible_url = 'https://raw.githubusercontent.com/rodriguesfas/biblie/master/db/books/json/pt_nvi.json'
        break;
    case 'pt_aa':
        bible_url = 'https://raw.githubusercontent.com/rodriguesfas/biblie/master/db/books/json/pt_aa.json'
        break;

    case 'en_bbe':
        bible_url = 'https://raw.githubusercontent.com/rodriguesfas/biblie/master/db/books/json/en_bbe.json'
        break;
    case 'en_kjv':
        bible_url = 'https://raw.githubusercontent.com/rodriguesfas/biblie/master/db/books/json/en_kjv.json'
        break;

    default:
        bible_url = 'https://raw.githubusercontent.com/rodriguesfas/biblie/master/db/books/json/pt_aa.json'
        break;
}



function about() {
    swal("Sobre", "App Sermão, versão 2.0.0, desenvolvido por RodriguesFAS.");
}


function search() {
    swal({
            text: 'Search for a movie. e.g. "La La Land".',
            content: "input",
            button: {
                text: "Search!",
                closeModal: false,
            },
        })
        .then(name => {
            if (!name) throw null;
            //https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/nvi.json
            return fetch('https://itunes.apple.com/search?term=${name}&entity=movie');
        })
        .then(results => {
            return results.json();
        })
        .then(json => {
            const movie = json.results[0];

            if (!movie) {
                return swal("No movie was found!");
            }

            const name = movie.trackName;
            const imageURL = movie.artworkUrl100;

            swal({
                title: "Top result:",
                text: name,
                icon: imageURL,
            });
        })
        .catch(err => {
            if (err) {
                swal("Oh noes!", "The AJAX request failed!", "error");
            } else {
                swal.stopLoading();
                swal.close();
            }
        });
}
