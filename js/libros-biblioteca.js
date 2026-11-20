/* LSPedia — biblioteca «Libros digitales» (herramientas/libros-digitales.html).
   Lee libros/catalogo.json y muestra una tapa por libro. Al elegir una, se abre
   el visor (herramientas/libro-digital.html?libro=<id>). Para agregar un libro
   basta con correr scripts/pdf_a_libro.py: el script actualiza el catálogo. */
(function () {
    'use strict';

    const ID_VALIDO = /^[a-z0-9][a-z0-9-]{0,60}$/;
    const ARCHIVO_VALIDO = /^[\w\-. ]+\.(webp|jpe?g|png|avif)$/i;
    const estante = document.getElementById('estante');
    const estado = document.getElementById('bibEstado');
    if (!estante || !estado) return;

    function texto(valor, max) {
        return String(valor == null ? '' : valor).trim().slice(0, max);
    }

    function limpiar(lista) {
        if (!Array.isArray(lista)) return [];
        const vistos = {};
        const salida = [];
        lista.slice(0, 200).forEach(function (l) {
            if (!l || typeof l !== 'object') return;
            const id = texto(l.id, 61).toLowerCase();
            const carpeta = texto(l.carpeta || l.id, 61).toLowerCase();
            if (!ID_VALIDO.test(id) || !ID_VALIDO.test(carpeta) || vistos[id]) return;
            vistos[id] = true;
            const titulo = texto(l.titulo, 120) || 'Libro sin título';
            salida.push({
                id: id,
                carpeta: carpeta,
                titulo: titulo,
                autor: texto(l.autor, 120),
                paginas: Math.max(0, Math.round(Number(l.paginas)) || 0),
                portada: ARCHIVO_VALIDO.test(String(l.portada || '')) ? String(l.portada) : '',
                // Oculto desde el Panel LSPedia: sigue en la biblioteca, en gris y sin poder abrirse.
                // Sin el campo, el libro está disponible (así funcionan los libros anteriores).
                disponible: l.publicado !== false
            });
        });
        return salida;
    }

    function crearTarjeta(libro) {
        const li = document.createElement('li');
        li.className = 'bib-item';

        // Disponible: enlace al visor. No disponible: tarjeta en gris, sin enlace.
        const enlace = document.createElement(libro.disponible ? 'a' : 'div');
        enlace.className = 'bib-libro';
        if (libro.disponible) {
            enlace.href = 'libro-digital.html?libro=' + encodeURIComponent(libro.id);
            enlace.setAttribute('aria-label', 'Leer «' + libro.titulo + '»' + (libro.autor ? ', de ' + libro.autor : ''));
        } else {
            enlace.classList.add('bib-libro-no-disponible');
            enlace.setAttribute('aria-disabled', 'true');
            enlace.setAttribute('role', 'group');
            enlace.setAttribute('aria-label', '«' + libro.titulo + '»' + (libro.autor ? ', de ' + libro.autor : '') + '. Próximamente.');
        }

        const tapa = document.createElement('span');
        tapa.className = 'bib-tapa';
        if (libro.portada) {
            const img = document.createElement('img');
            img.src = '../libros/' + libro.carpeta + '/' + encodeURIComponent(libro.portada);
            img.alt = '';
            img.width = 520;
            img.height = 735;
            img.decoding = 'async';
            img.draggable = false;
            img.addEventListener('error', function () { tapa.classList.add('bib-tapa-vacia'); img.remove(); });
            tapa.appendChild(img);
        } else {
            tapa.classList.add('bib-tapa-vacia');
        }

        const datos = document.createElement('span');
        datos.className = 'bib-datos';
        const titulo = document.createElement('strong');
        titulo.className = 'bib-libro-titulo';
        titulo.textContent = libro.titulo;
        datos.appendChild(titulo);
        if (libro.autor) {
            const autor = document.createElement('span');
            autor.className = 'bib-libro-autor';
            autor.textContent = libro.autor;
            datos.appendChild(autor);
        }
        const pie = document.createElement('span');
        pie.className = 'bib-libro-pie';
        const paginas = document.createElement('span');
        paginas.textContent = libro.paginas ? libro.paginas + ' páginas' : 'Libro digital';
        const leer = document.createElement('span');
        leer.className = libro.disponible ? 'bib-leer' : 'bib-no-disponible';
        leer.textContent = libro.disponible ? 'Leer' : 'Próximamente';
        pie.appendChild(paginas);
        pie.appendChild(leer);
        datos.appendChild(pie);

        enlace.appendChild(tapa);
        enlace.appendChild(datos);
        li.appendChild(enlace);
        return li;
    }

    function error() {
        estante.setAttribute('aria-busy', 'false');
        estado.textContent = 'No pudimos cargar los libros. Revisa tu conexión e inténtalo otra vez.';
        estado.classList.add('bib-estado-error');
        const reintentar = document.createElement('button');
        reintentar.type = 'button';
        reintentar.className = 'bib-reintentar';
        reintentar.textContent = 'Intentar de nuevo';
        reintentar.addEventListener('click', function () { window.location.reload(); });
        estado.appendChild(document.createTextNode(' '));
        estado.appendChild(reintentar);
    }

    fetch('../libros/catalogo.json', { cache: 'no-cache' })
        .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(function (json) {
            const libros = limpiar(json && json.libros);
            estante.setAttribute('aria-busy', 'false');
            if (!libros.length) {
                estado.textContent = 'Todavía no hay libros publicados.';
                return;
            }
            libros.forEach(function (l) { estante.appendChild(crearTarjeta(l)); });
            estado.hidden = true;
        })
        .catch(function (e) {
            if (window.console) console.warn('[Libros digitales]', e);
            error();
        });
})();
