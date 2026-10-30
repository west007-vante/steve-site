// A 404 do GitHub Pages é servida em qualquer profundidade: a base do site sai do caminho, não de link relativo.
(function () { var b = location.pathname.indexOf('/steve-site/') === 0 ? '/steve-site' : ''; document.getElementById('home').href = b + '/'; document.getElementById('diag').href = b + '/diagnostico/'; })();
