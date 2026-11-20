/* LSPedia — visor del libro digital (núcleo)
   Lee libros/<id>/libro.json, arma las páginas con StPageFlip (vendor/page-flip) y
   ofrece: pasar páginas (clic, arrastre, flechas, teclado), zoom con
   arrastre y pinza, miniaturas, ir a una página, sonido y pantalla completa.
   También dibuja encima de cada página los botones y enlaces del PDF original
   (Índice, pestañas de capítulos, enlaces web) como zonas tocables, recuerda
   la última página leída y abre en la página de ?pagina=N.

   Las funciones extra (contenido, búsqueda, marcadores, menú «Más», ayuda)
   viven en js/libro-extras.js y usan la API pública window.LSPediaLibro.

   Protección (solo disuasoria): sin menú contextual, sin arrastrar, sin
   selección ni impresión, páginas como imágenes de fondo (no <img>) y una
   marca de agua tenue. Nada de esto impide una captura de pantalla. */
(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    // Cada libro vive en libros/<id>/ y se abre con herramientas/libro-digital.html?libro=<id>.
    // Sin un id válido se muestra la biblioteca (libros-digitales.html).
    const ID_LIBRO = (function () {
        try {
            const v = String(new URLSearchParams(window.location.search).get('libro') || '').toLowerCase();
            return /^[a-z0-9][a-z0-9-]{0,60}$/.test(v) ? v : '';
        } catch (_e) { return ''; }
    })();
    if (!ID_LIBRO) { window.location.replace('libros-digitales.html'); return; }
    const BASE = '../libros/' + ID_LIBRO + '/';
    const CLAVE_SONIDO = 'lspedia_libro_sonido';
    const CLAVE_PAGINA = 'lspedia_libro_pagina_';
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
    let vistaUna = false;
    let inicio = { tipo: '', pagina: 0 };
    const escuchas = { cambio: [], listo: [] };

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

    /* ---------- Sonido de página (sintetizado, sin archivos) ----------
       Un «fsshh» suave de papel, como al pasar la hoja de un libro: ruido rosado
       (grave, sin el siseo agudo del ruido blanco) que sube y se apaga despacio,
       un filtro que se abre y se cierra mientras la hoja se mueve y un roce muy
       leve cuando se posa. Cada vuelta suena un poquito distinta.
       Para cambiarlo: VOLUMEN_PAGINA (fuerza) y BRILLO_PAGINA (más alto = más agudo). */
    const VOLUMEN_PAGINA = 0.24;
    const BRILLO_PAGINA = 1;
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
            const tasa = audio.sampleRate;
            const duracion = 0.55;
            const muestras = Math.floor(tasa * duracion);
            const buffer = audio.createBuffer(1, muestras, tasa);
            const datos = buffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, pico = 0;
            for (let i = 0; i < muestras; i++) {
                const s = i / tasa;
                const blanco = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + blanco * 0.0555179;
                b1 = 0.99332 * b1 + blanco * 0.0750759;
                b2 = 0.96900 * b2 + blanco * 0.1538520;
                b3 = 0.86650 * b3 + blanco * 0.3104856;
                b4 = 0.55000 * b4 + blanco * 0.5329522;
                b5 = -0.7616 * b5 - blanco * 0.0168980;
                const rosa = b0 + b1 + b2 + b3 + b4 + b5 + b6 + blanco * 0.5362;
                b6 = blanco * 0.115926;
                const sube = s < 0.16 ? 0.5 * (1 - Math.cos(Math.PI * s / 0.16)) : 1;
                const baja = Math.exp(-Math.max(0, s - 0.16) / 0.12);
                const roce = 0.22 * Math.exp(-Math.pow((s - 0.33) / 0.035, 2));
                const fin = Math.min(1, (duracion - s) / 0.04);
                const v = rosa * (sube * baja + roce) * fin;
                datos[i] = v;
                const a = Math.abs(v);
                if (a > pico) pico = a;
            }
            if (pico > 0) for (let i = 0; i < muestras; i++) datos[i] /= pico;

            const fuente = audio.createBufferSource();
            fuente.buffer = buffer;
            fuente.playbackRate.value = 0.94 + Math.random() * 0.12;
            const quitaGraves = audio.createBiquadFilter();
            quitaGraves.type = 'highpass';
            quitaGraves.frequency.value = 220;
            quitaGraves.Q.value = 0.5;
            const quitaAgudos = audio.createBiquadFilter();
            quitaAgudos.type = 'lowpass';
            quitaAgudos.Q.value = 0.4;
            const t0 = audio.currentTime;
            quitaAgudos.frequency.setValueAtTime(1200 * BRILLO_PAGINA, t0);
            quitaAgudos.frequency.linearRampToValueAtTime(3000 * BRILLO_PAGINA, t0 + 0.14);
            quitaAgudos.frequency.exponentialRampToValueAtTime(1000 * BRILLO_PAGINA, t0 + duracion);
            const volumen = audio.createGain();
            volumen.gain.value = VOLUMEN_PAGINA * (0.92 + Math.random() * 0.16);
            fuente.connect(quitaGraves);
            quitaGraves.connect(quitaAgudos);
            quitaAgudos.connect(volumen);
            volumen.connect(audio.destination);
            fuente.start(t0);
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

    function entero(v, min, max) {
        const n = Math.round(Number(v));
        return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null;
    }
    // Índice del PDF: [[nivel, título, página], ...] con páginas desde 1.
    function limpiarIndice(lista, cantidad) {
        if (!Array.isArray(lista)) return [];
        const salida = [];
        lista.slice(0, 600).forEach((fila) => {
            if (!Array.isArray(fila)) return;
            const nivel = entero(fila[0], 1, 4);
            const pagina = entero(fila[2], 1, cantidad);
            const titulo = String(fila[1] || '').trim().slice(0, 140);
            if (nivel && pagina && titulo) salida.push({ nivel: nivel, titulo: titulo, pagina: pagina });
        });
        return salida;
    }
    // Botones del PDF por página: { "11": [[x, y, ancho, alto, destino], ...] } (milésimas de la página).
    function limpiarEnlaces(mapa, cantidad) {
        const salida = {};
        if (!mapa || typeof mapa !== 'object') return salida;
        Object.keys(mapa).forEach((clave) => {
            const n = parseInt(clave, 10);
            if (!(n >= 1 && n <= cantidad) || !Array.isArray(mapa[clave])) return;
            const zonas = [];
            mapa[clave].slice(0, 400).forEach((z) => {
                if (!Array.isArray(z) || z.length < 5) return;
                const x = entero(z[0], 0, 1000), y = entero(z[1], 0, 1000);
                const w = entero(z[2], 1, 1000), h = entero(z[3], 1, 1000);
                if (x === null || y === null || w === null || h === null) return;
                let destino = null;
                if (typeof z[4] === 'number') {
                    destino = entero(z[4], 1, cantidad);
                } else if (typeof z[4] === 'string' && z[4].length <= 400) {
                    try {
                        const u = new URL(z[4]);
                        if (u.protocol === 'https:' || u.protocol === 'http:') destino = u.href;
                    } catch (_e) { destino = null; }
                }
                if (destino !== null) zonas.push({ x: x, y: y, w: w, h: h, destino: destino });
            });
            if (zonas.length) salida[n - 1] = zonas;
        });
        return salida;
    }

    function validarLibro(datos) {
        if (!datos || !Array.isArray(datos.paginas) || !datos.paginas.length) throw new Error('libro.json sin páginas');
        if (!datos.paginas.every((n) => typeof n === 'string' && NOMBRE_VALIDO.test(n))) throw new Error('nombre de página no válido');
        const carpeta = typeof datos.carpeta === 'string' ? datos.carpeta : 'paginas/';
        if (!CARPETA_VALIDA.test(carpeta)) throw new Error('carpeta no válida');
        const mini = typeof datos.miniaturas === 'string' ? datos.miniaturas : '';
        if (mini && !CARPETA_VALIDA.test(mini)) throw new Error('carpeta de miniaturas no válida');
        const cantidad = datos.paginas.length;
        const titulo = String(datos.titulo || 'Libro digital').slice(0, 120);
        const id = String(datos.id || titulo).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'libro';
        return {
            id: id,
            indice: limpiarIndice(datos.indice, cantidad),
            enlaces: limpiarEnlaces(datos.enlaces, cantidad),
            texto: typeof datos.texto === 'string' && /^[\w\-. ]+\.json$/i.test(datos.texto) ? datos.texto : '',
            titulo: titulo,
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

    // Un libro oculto desde el Panel no se abre ni escribiendo su enlace. Si el catálogo no
    // responde (sin conexión, por ejemplo) se sigue como antes para no romper la lectura.
    function libroDisponible() {
        return fetch('../libros/catalogo.json', { cache: 'no-cache' })
            .then((r) => (r.ok ? r.json() : null))
            .then((c) => {
                const lista = c && Array.isArray(c.libros) ? c.libros : [];
                const entrada = lista.filter((l) => l && String(l.id || '').toLowerCase() === ID_LIBRO)[0];
                return !(entrada && entrada.publicado === false);
            })
            .catch(() => true);
    }

    function cargarLibro() {
        mostrarEstado('Cargando libro…', false);
        libroDisponible().then((disponible) => {
            if (!disponible) {
                mostrarEstado('Este libro estará disponible próximamente. Mira los demás en Libros digitales.', true);
                $('btnReintentar').hidden = true;
                return null;
            }
            return cargarDatosLibro();
        });
    }

    function cargarDatosLibro() {
        return fetch(BASE + 'libro.json', { cache: 'no-cache' })
            .then((r) => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then((datos) => {
                libro = validarLibro(datos);
                document.title = libro.titulo + ' | LSPedia';
                iniciarLector();
            })
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
            crearEnlaces(hoja, i);
            contenedor.appendChild(hoja);
            paginas.push({ el: hoja, img: img, pedida: false });
        }
    }

    // Botones y enlaces del PDF original, como zonas tocables sobre la página.
    function crearEnlaces(hoja, i) {
        const zonas = libro.enlaces[i];
        if (!zonas) return;
        zonas.forEach((z) => {
            const a = document.createElement('a');
            a.className = 'enlace-libro';
            a.style.left = (z.x / 10) + '%';
            a.style.top = (z.y / 10) + '%';
            a.style.width = (z.w / 10) + '%';
            a.style.height = (z.h / 10) + '%';
            if (typeof z.destino === 'number') {
                a.href = '#pagina-' + z.destino;
                a.setAttribute('data-ir', String(z.destino - 1));
                a.title = 'Ir a la página ' + z.destino;
                a.setAttribute('aria-label', 'Ir a la página ' + z.destino);
            } else {
                a.href = z.destino;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.className += ' enlace-externo';
                a.title = 'Abrir en una pestaña nueva';
                a.setAttribute('aria-label', 'Abrir enlace externo en una pestaña nueva');
            }
            hoja.appendChild(a);
        });
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
        if (actual > 0) guardar(CLAVE_PAGINA + libro.id, String(actual));
        escuchas.cambio.forEach((fn) => { try { fn(actual); } catch (e) { if (window.console) console.warn(e); } });
    }

    function irA(n, animar) {
        if (!pf) return;
        const destino = Math.max(0, Math.min(total - 1, n));
        if (animar && !reducirMovimiento && destino !== actual) {
            try { pf.flip(destino); } catch (_e) { pf.turnToPage(destino); }
        } else {
            pf.turnToPage(destino);
        }
        sincronizar();
    }

    // Vista de una página o de libro abierto (dos páginas).
    function fijarVista(una) {
        vistaUna = !!una;
        if (!pf) return;
        try {
            const ajustes = pf.getSettings();
            if (!ajustes.__minWidthOriginal) ajustes.__minWidthOriginal = ajustes.minWidth;
            ajustes.minWidth = vistaUna ? 100000 : ajustes.__minWidthOriginal;
        } catch (_e) { /* versión sin getSettings */ }
        reajustar();
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
        let pellizcando = false; // dos dedos haciendo zoom ahora mismo
        let bloqueando = false;  // el gesto de dos dedos sigue vivo: el libro no debe enterarse
        let pz = null;           // datos del pellizco en curso

        /* Arrastre con un dedo (o el mouse) cuando hay zoom. */
        escena.addEventListener('pointerdown', (e) => {
            if (zoom <= 1 || (e.target.closest && e.target.closest('button, a.enlace-libro'))) return;
            try { escena.setPointerCapture(e.pointerId); } catch (_e) { /* sin captura */ }
            punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (punteros.size === 1) {
                inicio = { x: e.clientX, y: e.clientY, px: panX, py: panY };
                escena.classList.add('lector-arrastrando');
            }
        });
        escena.addEventListener('pointermove', (e) => {
            if (!punteros.has(e.pointerId)) return;
            punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (punteros.size === 1 && inicio && !pellizcando) {
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

        /* Zoom con dos dedos (pellizcar). Funciona también con el libro a tamaño normal:
           se escuchan los toques en la ventana, antes que StPageFlip, para que el pellizco
           no pase ni gire páginas. El zoom se hace alrededor del punto entre los dedos. */
        function dosDedosEnEscena(toques) {
            return toques.length >= 2 && escena.contains(toques[0].target) && escena.contains(toques[1].target);
        }
        function iniciarPellizco(toques) {
            const capa = $('capaZoom');
            const r = capa.getBoundingClientRect();
            const a = toques[0], b = toques[1];
            const cx = (a.clientX + b.clientX) / 2;
            const cy = (a.clientY + b.clientY) / 2;
            const ox = r.left + r.width / 2 - panX;
            const oy = r.top + r.height / 2 - panY;
            pz = {
                d0: Math.max(10, Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)),
                z0: zoom,
                qx: (cx - ox - panX) / zoom,
                qy: (cy - oy - panY) / zoom,
                ox: ox,
                oy: oy
            };
            pellizcando = true;
        }
        function moverPellizco(toques) {
            const a = toques[0], b = toques[1];
            const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
            zoom = Math.max(1, Math.min(ZOOM_MAX, pz.z0 * (d / pz.d0)));
            panX = (a.clientX + b.clientX) / 2 - pz.ox - zoom * pz.qx;
            panY = (a.clientY + b.clientY) / 2 - pz.oy - zoom * pz.qy;
            aplicarZoom(false);
        }
        function soltarGiroDelLibro() {
            // Si el primer dedo ya había empezado a doblar una página, se termina ese gesto
            // (si no, la página quedaría doblada a medias al soltar).
            try {
                if (pf && typeof pf.getState === 'function' && pf.getState() === 'user_fold') pf.userStop({ x: 0, y: 0 }, false);
            } catch (_e) { /* sin acción */ }
        }
        window.addEventListener('touchstart', (e) => {
            if (!bloqueando) {
                if (!dosDedosEnEscena(e.touches)) return;
                bloqueando = true;
                soltarGiroDelLibro();
                iniciarPellizco(e.touches);
            } else if (!pellizcando && dosDedosEnEscena(e.touches)) {
                iniciarPellizco(e.touches);
            }
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
        }, { capture: true, passive: false });
        window.addEventListener('touchmove', (e) => {
            if (!bloqueando) return;
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            if (pellizcando && pz && e.touches.length >= 2) moverPellizco(e.touches);
        }, { capture: true, passive: false });
        function terminarToque(e) {
            if (!bloqueando) return;
            e.stopPropagation();
            if (e.cancelable) e.preventDefault();
            if (e.touches.length < 2) { pellizcando = false; pz = null; }
            if (e.touches.length === 0) {
                bloqueando = false;
                if (zoom < 1.08) { zoom = 1; aplicarZoom(true); } // casi al tamaño normal: vuelve a 100 %
            }
        }
        window.addEventListener('touchend', terminarToque, { capture: true, passive: false });
        window.addEventListener('touchcancel', terminarToque, { capture: true, passive: false });
        // Safari de iPhone/iPad trae su propio gesto de pellizco; se deja solo el del libro.
        ['gesturestart', 'gesturechange', 'gestureend'].forEach((nombre) => {
            escena.addEventListener(nombre, (e) => e.preventDefault());
        });
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
            // En celulares angostos (≤ 360 px) el libro no debe ser más ancho que la pantalla.
            minWidth: Math.max(240, Math.min(360, window.innerWidth - 16)),
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

        // Página inicial: ?pagina=N, o la última que se leyó en este navegador.
        const pedida = parseInt(new URLSearchParams(window.location.search).get('pagina'), 10);
        const guardada = parseInt(leer(CLAVE_PAGINA + libro.id), 10);
        if (pedida >= 1 && pedida <= total) {
            inicio = { tipo: 'url', pagina: pedida };
        } else if (guardada >= 1 && guardada < total - 1) {
            inicio = { tipo: 'guardada', pagina: guardada + 1 };
        }
        if (inicio.pagina > 1) pf.turnToPage(inicio.pagina - 1);

        cargarCercanas(Math.max(0, inicio.pagina - 1));
        sincronizar();
        aplicarZoom(false);

        // Se muestra el libro cuando las primeras páginas ya están listas
        // (o a los 6 segundos, para no dejar la pantalla de carga fija).
        Promise.race([
            Promise.all([cargarImagen(0), cargarImagen(1), cargarImagen(2)]),
            new Promise((r) => setTimeout(r, 6000))
        ]).then(() => {
            ocultarEstado();
            reajustar();
            escuchas.listo.forEach((fn) => { try { fn(); } catch (e) { if (window.console) console.warn(e); } });
            escuchas.listo.length = 0;
        });

        if ('ResizeObserver' in window) new ResizeObserver(reajustar).observe($('escena'));
    }

    /* ---------- Controles ---------- */
    function instalarControles() {
        // Botones del PDF (Índice, pestañas de capítulos…): se saltan con animación.
        $('libro').addEventListener('click', (e) => {
            const enlace = e.target.closest && e.target.closest('a.enlace-libro[data-ir]');
            if (!enlace) return;
            e.preventDefault();
            irA(parseInt(enlace.getAttribute('data-ir'), 10), true);
        });

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
            // Dentro del panel, el menú o la ayuda las teclas son de esos controles.
            if (e.target.closest && e.target.closest('#panelLateral, #menuMas, dialog')) return;
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

    // API para js/libro-extras.js
    window.LSPediaLibro = {
        datos: () => libro,
        idCarpeta: () => ID_LIBRO,
        base: () => BASE,
        actual: () => actual,
        total: () => total,
        inicio: () => inicio,
        orientacion: () => (pf ? pf.getOrientation() : 'portrait'),
        irA: irA,
        siguiente: () => { if (pf) pf.flipNext(); },
        anterior: () => { if (pf) pf.flipPrev(); },
        esUltima: esUltima,
        elementoPagina: (i) => (paginas[i] ? paginas[i].el : null),
        zoomActual: () => zoom,
        acercar: acercar,
        alejar: alejar,
        restablecerZoom: restablecerZoom,
        fijarVista: fijarVista,
        vistaUna: () => vistaUna,
        reajustar: reajustar,
        pantallaCompleta: pantallaCompleta,
        sonido: () => sonidoActivo,
        alternarSonido: () => { $('btnSonido').click(); return sonidoActivo; },
        alCambiar: (fn) => { escuchas.cambio.push(fn); },
        alEstarListo: (fn) => { if (pf && $('estado').classList.contains('oculto')) fn(); else escuchas.listo.push(fn); },
        urlMiniatura: urlMiniatura,
        leer: leer,
        guardar: guardar
    };

    sonidoActivo = leer(CLAVE_SONIDO) !== '0';
    pintarSonido();
    instalarControles();
    instalarGestos();
    cargarLibro();
})();
