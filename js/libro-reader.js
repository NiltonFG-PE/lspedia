/* LSPedia — visor del libro digital
   Lee libro/libro.json, arma las páginas con StPageFlip (vendor/page-flip) y
   ofrece: pasar páginas (clic, arrastre, flechas, teclado), zoom con
   arrastre y pinza, miniaturas, ir a una página, sonido y pantalla completa.

   Protección (solo disuasoria): sin menú contextual, sin arrastrar, sin
   selección ni impresión, páginas como imágenes de fondo (no <img>) y una
   marca de agua tenue. Nada de esto impide una captura de pantalla. */
(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const BASE = '../libro/';
    const CLAVE_SONIDO = 'lspedia_libro_sonido';
    const PASOS_ZOOM = [1, 1.5, 2, 3];
    const ZOOM_MAX = 4;
    const NOMBRE_VALIDO = /^[\w\-. ]+\.(webp|jpe?g|png|avif)$/i;
    const CARPETA_VALIDA = /^([\w\-]+\/)*$/;

    const reducirMovimiento = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    let libro = null;
    let pf = null;
    let paginas = [];
    let total = 0;
    let actual = 0;
    let zoom = 1;
    let panX = 0;
    let panY = 0;
    let sonidoActivo = true;
    let audio = null;
    let ultimoSonido = 0;
    let miniaturasListas = false;

    /* ---------- Almacenamiento (puede estar bloqueado) ---------- */
    function leer(clave) {
        try { return window.localStorage.getItem(clave); } catch (_e) { return null; }
    }
    function guardar(clave, valor) {
        try { window.localStorage.setItem(clave, valor); } catch (_e) { /* sin almacenamiento */ }
    }

    /* ---------- Protección disuasoria ---------- */
    function esCampoDeTexto(el) {
        return !!(el && el.closest && el.closest('input, textarea'));
    }
    ['contextmenu', 'dragstart', 'selectstart', 'copy', 'cut'].forEach((tipo) => {
        document.addEventListener(tipo, (e) => {
            if (esCampoDeTexto(e.target)) return;
            e.preventDefault();
        });
    });
    document.addEventListener('keydown', (e) => {
        if (esCampoDeTexto(e.target)) return;
        if ((e.ctrlKey || e.metaKey) && /^[spuca]$/i.test(e.key)) e.preventDefault();
    });

    /* ---------- Sonido de página (sintetizado, sin archivos) ---------- */
    function sonidoPagina() {
        if (!sonidoActivo) return;
        const ahora = Date.now();
        if (ahora - ultimoSonido < 180) return;
        ultimoSonido = ahora;
        try {
            const Contexto = window.AudioContext || window.webkitAudioContext;
            if (!Contexto) return;
            audio = audio || new Contexto();
            if (audio.state === 'suspended') audio.resume();
            const duracion = 0.34;
            const muestras = Math.floor(audio.sampleRate * duracion);
            const buffer = audio.createBuffer(1, muestras, audio.sampleRate);
            const datos = buffer.getChannelData(0);
            for (let i = 0; i < muestras; i++) {
                const t = i / muestras;
                const ataque = t < 0.05 ? t / 0.05 : 1;
                datos[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.4) * ataque;
            }
            const fuente = audio.createBufferSource();
            fuente.buffer = buffer;
            const filtro = audio.createBiquadFilter();
            filtro.type = 'bandpass';
            filtro.frequency.value = 2300;
            filtro.Q.value = 0.7;
            const volumen = audio.createGain();
            volumen.gain.value = 0.22;
            fuente.connect(filtro);
            filtro.connect(volumen);
            volumen.connect(audio.destination);
            fuente.start();
        } catch (_e) { /* el sonido es opcional */ }
    }

    function pintarSonido() {
        const btn = $('btnSonido');
        btn.setAttribute('aria-pressed', sonidoActivo ? 'true' : 'false');
        const texto = sonidoActivo ? 'Silenciar el sonido de las páginas' : 'Activar el sonido de las páginas';
        btn.setAttribute('aria-label', texto);
        btn.title = texto;
    }

    /* ---------- Carga del libro ---------- */
    function mostrarEstado(texto, error) {
        const caja = $('estado');
        caja.classList.remove('oculto');
        caja.classList.toggle('con-error', !!error);
        $('estadoTexto').textContent = texto;
        $('btnReintentar').hidden = !error;
    }
    function ocultarEstado() {
        $('estado').classList.add('oculto');
    }
    function errorCarga(motivo) {
        if (window.console) console.warn('[Libro digital]', motivo);
        mostrarEstado('No pudimos cargar el libro. Revisa tu conexión e inténtalo otra vez.', true);
    }

    function validarLibro(datos) {
        if (!datos || !Array.isArray(datos.paginas) || !datos.paginas.length) throw new Error('libro.json sin páginas');
        if (!datos.paginas.every((n) => typeof n === 'string' && NOMBRE_VALIDO.test(n))) throw new Error('nombre de página no válido');
        const carpeta = typeof datos.carpeta === 'string' ? datos.carpeta : 'paginas/';
        if (!CARPETA_VALIDA.test(carpeta)) throw new Error('carpeta no válida');
        const mini = typeof datos.miniaturas === 'string' ? datos.miniaturas : '';
        if (mini && !CARPETA_VALIDA.test(mini)) throw new Error('carpeta de miniaturas no válida');
        return {
            titulo: String(datos.titulo || 'Libro digital').slice(0, 120),
            autor: String(datos.autor || '').slice(0, 120),
            ancho: Number(datos.ancho) > 0 ? Number(datos.ancho) : 1000,
            alto: Number(datos.alto) > 0 ? Number(datos.alto) : 1414,
            tapaDura: datos.tapaDura !== false,
            marcaAgua: datos.marcaAgua === false ? '' : String(datos.marcaAgua || 'LSPedia').slice(0, 40),
            carpeta: carpeta,
            miniaturas: mini,
            paginas: datos.paginas
        };
    }

    function urlPagina(i) { return BASE + libro.carpeta + encodeURIComponent(libro.paginas[i]); }
    function urlMiniatura(i) {
        return libro.miniaturas ? BASE + libro.miniaturas + encodeURIComponent(libro.paginas[i]) : urlPagina(i);
    }

    function cargarLibro() {
        mostrarEstado('Cargando libro…', false);
        fetch(BASE + 'libro.json', { cache: 'no-cache' })
            .then((r) => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then((datos) => { libro = validarLibro(datos); iniciarLector(); })
            .catch(errorCarga);
    }

    /* ---------- Páginas ---------- */
    function construirPaginas() {
        const contenedor = $('libro');
        contenedor.textContent = '';
        paginas = [];
        total = libro.paginas.length;
        for (let i = 0; i < total; i++) {
            const hoja = document.createElement('div');
            hoja.className = 'pagina';
            if (libro.tapaDura && (i === 0 || i === total - 1)) hoja.setAttribute('data-density', 'hard');
            const img = document.createElement('div');
            img.className = 'pagina-img';
            img.setAttribute('role', 'img');
            img.setAttribute('aria-label', 'Página ' + (i + 1) + ' de ' + total);
            hoja.appendChild(img);
            contenedor.appendChild(hoja);
            paginas.push({ el: hoja, img: img, pedida: false });
        }
    }

    function cargarImagen(i) {
        if (i < 0 || i >= total) return Promise.resolve();
        const p = paginas[i];
        if (p.pedida) return Promise.resolve();
        p.pedida = true;
        const url = urlPagina(i);
        return new Promise((resolver) => {
            const im = new Image();
            im.onload = () => {
                p.img.style.backgroundImage = 'url("' + url + '")';
                p.img.classList.add('lista');
                resolver();
            };
            im.onerror = () => { p.pedida = false; resolver(); };
            im.src = url;
        });
    }
    function cargarCercanas(idx) {
        for (let j = idx - 2; j <= idx + 5; j++) cargarImagen(j);
    }

    /* ---------- Estado visible (indicador, flechas, miniaturas) ---------- */
    function esUltima() {
        if (!pf) return true;
        const doble = pf.getOrientation() === 'landscape' && actual > 0;
        return actual + (doble ? 1 : 0) >= total - 1;
    }
    // En pantallas anchas StPageFlip muestra la portada en la mitad derecha y la
    // contraportada en la izquierda. Se desplaza el libro media página para que
    // la portada y la contraportada queden centradas, como un libro real cerrado.
    function centrarLibro() {
        const contenedor = $('libro');
        let dx = 0;
        if (pf && pf.getOrientation() === 'landscape') {
            const bloque = contenedor.querySelector('.stf__block');
            const anchoPagina = bloque ? bloque.offsetHeight * (libro.ancho / libro.alto) : 0;
            if (actual === 0) dx = -anchoPagina / 2;
            else if (actual === total - 1 && total % 2 === 0) dx = anchoPagina / 2;
        }
        contenedor.style.setProperty('--libro-desplaza', dx.toFixed(1) + 'px');
    }
    function sincronizar() {
        if (!pf) return;
        actual = pf.getCurrentPageIndex();
        centrarLibro();
        const campo = $('inpPagina');
        if (document.activeElement !== campo) campo.value = String(actual + 1);
        $('btnPrev').disabled = actual <= 0;
        $('btnNext').disabled = esUltima();
        const botones = document.querySelectorAll('.lector-mini');
        botones.forEach((b, i) => {
            const esta = i === actual || (pf.getOrientation() === 'landscape' && actual > 0 && i === actual + 1);
            b.classList.toggle('actual', esta);
            if (esta) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
        });
        cargarCercanas(actual);
    }

    function irA(n) {
        if (!pf) return;
        const destino = Math.max(0, Math.min(total - 1, n));
        pf.turnToPage(destino);
        sincronizar();
    }

    /* ---------- Miniaturas ---------- */
    function construirMiniaturas() {
        if (miniaturasListas) return;
        miniaturasListas = true;
        const lista = $('listaMiniaturas');
        const observador = 'IntersectionObserver' in window
            ? new IntersectionObserver((entradas) => {
                entradas.forEach((en) => {
                    if (!en.isIntersecting) return;
                    const img = en.target;
                    img.style.backgroundImage = 'url("' + img.getAttribute('data-src') + '")';
                    observador.unobserve(img);
                });
            }, { root: lista, rootMargin: '0px 240px' })
            : null;
        for (let i = 0; i < total; i++) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'lector-mini';
            b.setAttribute('aria-label', 'Ir a la página ' + (i + 1));
            const img = document.createElement('span');
            img.className = 'lector-mini-img';
            img.setAttribute('data-src', urlMiniatura(i));
            const num = document.createElement('span');
            num.textContent = String(i + 1);
            b.appendChild(img);
            b.appendChild(num);
            b.addEventListener('click', () => irA(i));
            lista.appendChild(b);
            if (observador) observador.observe(img);
            else img.style.backgroundImage = 'url("' + img.getAttribute('data-src') + '")';
        }
        sincronizar();
    }
    function alternarMiniaturas(forzar) {
        const panel = $('panelMiniaturas');
        const abrir = typeof forzar === 'boolean' ? forzar : panel.hidden;
        if (abrir) construirMiniaturas();
        panel.hidden = !abrir;
        $('btnMiniaturas').setAttribute('aria-expanded', abrir ? 'true' : 'false');
        if (abrir) {
            const actualBtn = panel.querySelector('.lector-mini.actual');
            if (actualBtn && actualBtn.scrollIntoView) actualBtn.scrollIntoView({ inline: 'center', block: 'nearest' });
        }
        reajustar();
    }

    /* ---------- Zoom y arrastre ---------- */
    function limitarPan() {
        const capa = $('capaZoom');
        const maxX = (capa.offsetWidth * (zoom - 1)) / 2;
        const maxY = (capa.offsetHeight * (zoom - 1)) / 2;
        panX = Math.max(-maxX, Math.min(maxX, panX));
        panY = Math.max(-maxY, Math.min(maxY, panY));
    }
    function aplicarZoom(animar) {
        if (zoom <= 1.001) { zoom = 1; panX = 0; panY = 0; }
        limitarPan();
        const capa = $('capaZoom');
        capa.classList.toggle('lector-zoom-animado', !!animar && !reducirMovimiento);
        capa.style.transform = zoom === 1 ? '' : 'translate(' + panX.toFixed(1) + 'px,' + panY.toFixed(1) + 'px) scale(' + zoom.toFixed(3) + ')';
        $('libro').classList.toggle('libro-sin-eventos', zoom > 1);
        $('escena').classList.toggle('lector-arrastrable', zoom > 1);
        $('btnZoomRestablecer').textContent = Math.round(zoom * 100) + '%';
        $('btnZoomMenos').disabled = zoom <= 1;
        $('btnZoomMas').disabled = zoom >= ZOOM_MAX - 0.001;
    }
    function acercar() {
        const siguiente = PASOS_ZOOM.find((z) => z > zoom + 0.01);
        zoom = siguiente || ZOOM_MAX;
        aplicarZoom(true);
    }
    function alejar() {
        const anteriores = PASOS_ZOOM.filter((z) => z < zoom - 0.01);
        zoom = anteriores.length ? anteriores[anteriores.length - 1] : 1;
        aplicarZoom(true);
    }
    function restablecerZoom() {
        zoom = 1;
        aplicarZoom(true);
    }

    function instalarGestos() {
        const escena = $('escena');
        const punteros = new Map();
        let inicio = null;
        let distanciaInicial = 0;
        let zoomInicial = 1;

        function distancia() {
            const v = Array.from(punteros.values());
            return Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y);
        }

        escena.addEventListener('pointerdown', (e) => {
            if (zoom <= 1 || (e.target.closest && e.target.closest('button'))) return;
            try { escena.setPointerCapture(e.pointerId); } catch (_e) { /* sin captura */ }
            punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (punteros.size === 1) {
                inicio = { x: e.clientX, y: e.clientY, px: panX, py: panY };
                escena.classList.add('lector-arrastrando');
            } else if (punteros.size === 2) {
                distanciaInicial = distancia();
                zoomInicial = zoom;
            }
        });
        escena.addEventListener('pointermove', (e) => {
            if (!punteros.has(e.pointerId)) return;
            punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (punteros.size === 2 && distanciaInicial > 0) {
                zoom = Math.max(1, Math.min(ZOOM_MAX, zoomInicial * (distancia() / distanciaInicial)));
                aplicarZoom(false);
            } else if (punteros.size === 1 && inicio) {
                panX = inicio.px + (e.clientX - inicio.x);
                panY = inicio.py + (e.clientY - inicio.y);
                aplicarZoom(false);
            }
        });
        function soltar(e) {
            punteros.delete(e.pointerId);
            if (punteros.size === 1) {
                const resto = Array.from(punteros.values())[0];
                inicio = { x: resto.x, y: resto.y, px: panX, py: panY };
            } else if (punteros.size === 0) {
                inicio = null;
                distanciaInicial = 0;
                escena.classList.remove('lector-arrastrando');
            }
        }
        escena.addEventListener('pointerup', soltar);
        escena.addEventListener('pointercancel', soltar);

        escena.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                zoom = Math.max(1, Math.min(ZOOM_MAX, zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
                aplicarZoom(false);
            } else if (zoom > 1) {
                e.preventDefault();
                panX -= e.deltaX;
                panY -= e.deltaY;
                aplicarZoom(false);
            }
        }, { passive: false });
    }

    /* ---------- Pantalla completa ---------- */
    function pantallaCompleta() {
        const doc = document;
        const activa = doc.fullscreenElement || doc.webkitFullscreenElement;
        try {
            if (activa) {
                (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
            } else {
                const raiz = doc.documentElement;
                (raiz.requestFullscreen || raiz.webkitRequestFullscreen).call(raiz);
            }
        } catch (_e) { /* el navegador no lo permite */ }
    }
    function pintarPantalla() {
        const activa = !!(document.fullscreenElement || document.webkitFullscreenElement);
        const btn = $('btnPantalla');
        btn.classList.toggle('activo', activa);
        const texto = activa ? 'Salir de pantalla completa' : 'Pantalla completa';
        btn.setAttribute('aria-label', texto);
        btn.title = texto;
        reajustar();
    }

    /* ---------- Reajuste del libro cuando cambia el espacio ---------- */
    let reajusteProgramado = 0;
    function reajustar() {
        if (!pf) return;
        window.cancelAnimationFrame(reajusteProgramado);
        reajusteProgramado = window.requestAnimationFrame(() => {
            try { pf.update(); } catch (_e) { /* aún no está listo */ }
            limitarPan();
            sincronizar();
        });
    }

    /* ---------- Arranque ---------- */
    function aplicarMarcaDeAgua() {
        const capa = $('capaZoom');
        if (!libro.marcaAgua) return;
        const texto = libro.marcaAgua.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='280' height='200'>" +
            "<text x='140' y='104' text-anchor='middle' transform='rotate(-24 140 104)' " +
            "font-family='Poppins,Arial,sans-serif' font-size='16' font-weight='600' " +
            "fill='#0f1e3c' fill-opacity='0.07'>" + texto + '</text></svg>';
        capa.style.setProperty('--lector-marca-img', 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")');
        capa.classList.add('con-marca');
    }

    function iniciarLector() {
        if (typeof window.St === 'undefined' || !window.St.PageFlip) {
            errorCarga('StPageFlip no se cargó');
            return;
        }
        document.title = libro.titulo + ' | LSPedia';
        $('tituloLibro').textContent = libro.titulo;
        if (libro.autor) {
            const autor = $('autorLibro');
            autor.textContent = libro.autor;
            autor.hidden = false;
        }
        document.documentElement.style.setProperty('--lector-prop', (libro.ancho / libro.alto).toFixed(4));
        $('inpPagina').max = String(libro.paginas.length);
        $('totalPaginas').textContent = '/ ' + libro.paginas.length;

        construirPaginas();
        aplicarMarcaDeAgua();

        pf = new window.St.PageFlip($('libro'), {
            width: libro.ancho,
            height: libro.alto,
            size: 'stretch',
            minWidth: 360,
            maxWidth: 1400,
            minHeight: 480,
            maxHeight: 2200,
            maxShadowOpacity: 0.45,
            showCover: true,
            flippingTime: reducirMovimiento ? 250 : 850,
            usePortrait: true,
            mobileScrollSupport: false,
            swipeDistance: 24,
            drawShadow: true,
            autoSize: true,
            useMouseEvents: true
        });
        pf.loadFromHTML(document.querySelectorAll('#libro .pagina'));

        pf.on('flip', sincronizar);
        pf.on('changeOrientation', sincronizar);
        pf.on('changeState', (e) => { if (e.data === 'flipping') sonidoPagina(); });

        cargarCercanas(0);
        sincronizar();
        aplicarZoom(false);

        // Se muestra el libro cuando las primeras páginas ya están listas
        // (o a los 6 segundos, para no dejar la pantalla de carga fija).
        Promise.race([
            Promise.all([cargarImagen(0), cargarImagen(1), cargarImagen(2)]),
            new Promise((r) => setTimeout(r, 6000))
        ]).then(() => { ocultarEstado(); reajustar(); });

        if ('ResizeObserver' in window) new ResizeObserver(reajustar).observe($('escena'));
    }

    /* ---------- Controles ---------- */
    function instalarControles() {
        $('btnPrev').addEventListener('click', () => { if (pf) pf.flipPrev(); });
        $('btnNext').addEventListener('click', () => { if (pf) pf.flipNext(); });
        $('btnMiniaturas').addEventListener('click', () => alternarMiniaturas());
        $('btnZoomMas').addEventListener('click', acercar);
        $('btnZoomMenos').addEventListener('click', alejar);
        $('btnZoomRestablecer').addEventListener('click', restablecerZoom);
        $('btnReintentar').addEventListener('click', cargarLibro);

        $('btnSonido').addEventListener('click', () => {
            sonidoActivo = !sonidoActivo;
            guardar(CLAVE_SONIDO, sonidoActivo ? '1' : '0');
            pintarSonido();
            if (sonidoActivo) { ultimoSonido = 0; sonidoPagina(); }
        });

        const puedePantalla = document.fullscreenEnabled || document.webkitFullscreenEnabled;
        if (puedePantalla) {
            $('btnPantalla').addEventListener('click', pantallaCompleta);
            document.addEventListener('fullscreenchange', pintarPantalla);
            document.addEventListener('webkitfullscreenchange', pintarPantalla);
        } else {
            $('btnPantalla').hidden = true;
        }

        const campo = $('inpPagina');
        function aplicarCampo() {
            const n = parseInt(campo.value, 10);
            if (Number.isFinite(n)) irA(n - 1);
            else campo.value = String(actual + 1);
        }
        campo.addEventListener('change', aplicarCampo);
        campo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { aplicarCampo(); campo.blur(); }
            e.stopPropagation();
        });
        campo.addEventListener('focus', () => campo.select());

        document.addEventListener('keydown', (e) => {
            if (esCampoDeTexto(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
            switch (e.key) {
                case 'ArrowLeft': case 'PageUp': if (pf) pf.flipPrev(); e.preventDefault(); break;
                case 'ArrowRight': case 'PageDown': case ' ': if (pf) pf.flipNext(); e.preventDefault(); break;
                case 'Home': irA(0); e.preventDefault(); break;
                case 'End': irA(total - 1); e.preventDefault(); break;
                case '+': case '=': acercar(); break;
                case '-': case '_': alejar(); break;
                case '0': restablecerZoom(); break;
                case 'f': case 'F': if (!$('btnPantalla').hidden) pantallaCompleta(); break;
                case 'Escape':
                    if (zoom > 1) restablecerZoom();
                    else if (!$('panelMiniaturas').hidden) alternarMiniaturas(false);
                    break;
                default: break;
            }
        });

        window.addEventListener('resize', reajustar);
        window.addEventListener('orientationchange', () => setTimeout(reajustar, 250));
    }

    sonidoActivo = leer(CLAVE_SONIDO) !== '0';
    pintarSonido();
    instalarControles();
    instalarGestos();
    cargarLibro();
})();
