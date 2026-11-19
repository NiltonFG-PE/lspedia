/* LSPedia — visor del libro digital: funciones extra
   Se apoya en la API de js/libro-reader.js (window.LSPediaLibro) y agrega:
   · Panel lateral con Contenido (índice del PDF), Buscar y Marcadores.
   · Búsqueda de texto con resaltado de las líneas encontradas en la página.
   · Marcadores guardados en este dispositivo y aviso «seguir donde te quedaste».
   · Menú «Más»: compartir la página, una página o libro abierto, color de las
     páginas, pasar páginas solo y ayuda con atajos del teclado.

   Todo se guarda solo en el navegador de cada lector (localStorage). */
(function () {
    'use strict';

    const LB = window.LSPediaLibro;
    if (!LB) return;

    const $ = (id) => document.getElementById(id);
    const CLAVE_MARCADORES = 'lspedia_libro_marcadores_';
    const CLAVE_COLOR = 'lspedia_libro_color';
    const CLAVE_VISTA = 'lspedia_libro_vista';
    const CLAVE_CONSEJO = 'lspedia_libro_consejo';
    const MAX_MARCADORES = 60;
    const MAX_RESULTADOS = 200;
    const SEGUNDOS_AUTO = 10;

    const reducirMovimiento = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const pantallaChica = window.matchMedia ? window.matchMedia('(max-width: 899.98px)') : { matches: false };

    let datos = null;
    let total = 0;

    /* ---------- Avisos breves ---------- */
    let temporizadorAviso = 0;
    function aviso(texto, accion, segundos) {
        const caja = $('aviso');
        $('avisoTexto').textContent = texto;
        const boton = $('avisoAccion');
        boton.onclick = null;
        if (accion && accion.texto) {
            boton.textContent = accion.texto;
            boton.hidden = false;
            boton.onclick = () => { ocultarAviso(); accion.alHacerClic(); };
        } else {
            boton.hidden = true;
        }
        caja.hidden = false;
        window.clearTimeout(temporizadorAviso);
        temporizadorAviso = window.setTimeout(ocultarAviso, (segundos || 4.5) * 1000);
    }
    function ocultarAviso() {
        window.clearTimeout(temporizadorAviso);
        $('aviso').hidden = true;
    }

    /* ---------- Texto normalizado (sin tildes, mayúsculas ni letras matemáticas) ---------- */
    function normalizarCaracter(ch) {
        return ch.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[−–—]/g, '-').toLowerCase();
    }
    function normalizar(texto) {
        let salida = '';
        for (const ch of String(texto)) salida += normalizarCaracter(ch);
        return salida.replace(/\s+/g, ' ').trim();
    }
    // Devuelve el texto normalizado y, por cada letra, su posición en el original.
    function normalizarConMapa(texto) {
        let n = '';
        const mapa = [];
        let pos = 0;
        for (const ch of String(texto)) {
            const x = normalizarCaracter(ch);
            for (let k = 0; k < x.length; k++) { n += x[k]; mapa.push(pos); }
            pos += ch.length;
        }
        return { n: n, m: mapa };
    }

    /* ---------- Capítulo de cada página ---------- */
    function ultimaVisible() {
        const a = LB.actual();
        const doble = LB.orientacion() === 'landscape' && a > 0 && a + 1 < total;
        return a + (doble ? 1 : 0);
    }
    function entradaDe(indicePagina, soloNivel1) {
        let hallada = null;
        datos.indice.forEach((e) => {
            if (soloNivel1 && e.nivel !== 1) return;
            if (e.pagina - 1 <= indicePagina) hallada = e;
        });
        return hallada;
    }
    function capituloDe(indicePagina) {
        const e = entradaDe(indicePagina, true);
        return e ? e.titulo : '';
    }

    /* ---------- Panel lateral ---------- */
    const panel = $('panelLateral');
    const pestanas = {
        contenido: { tab: $('tabContenido'), vista: $('vistaContenido') },
        buscar: { tab: $('tabBuscar'), vista: $('vistaBuscar') },
        marcadores: { tab: $('tabMarcadores'), vista: $('vistaMarcadores') }
    };
    let pestanaActual = 'contenido';

    function panelAbierto() { return !panel.hidden; }

    function mostrarPestana(nombre) {
        pestanaActual = nombre;
        Object.keys(pestanas).forEach((k) => {
            const activa = k === nombre;
            pestanas[k].tab.setAttribute('aria-selected', activa ? 'true' : 'false');
            pestanas[k].tab.tabIndex = activa ? 0 : -1;
            pestanas[k].vista.hidden = !activa;
        });
        pintarBotonesPanel();
    }
    function pintarBotonesPanel() {
        const abierto = panelAbierto();
        $('btnContenido').setAttribute('aria-expanded', abierto && pestanaActual === 'contenido' ? 'true' : 'false');
        $('btnBuscar').classList.toggle('activo', abierto && pestanaActual === 'buscar');
    }
    function abrirPanel(nombre, enfocar) {
        mostrarPestana(nombre);
        panel.hidden = false;
        pintarBotonesPanel();
        LB.reajustar();
        if (nombre === 'contenido') {
            const actual = $('listaContenido').querySelector('.actual');
            if (actual && actual.scrollIntoView) actual.scrollIntoView({ block: 'center' });
        }
        if (nombre === 'buscar' && enfocar) {
            window.setTimeout(() => { $('inpBuscar').focus(); $('inpBuscar').select(); }, 30);
        }
    }
    function cerrarPanel() {
        panel.hidden = true;
        pintarBotonesPanel();
        LB.reajustar();
    }
    function alternarPanel(nombre) {
        if (panelAbierto() && pestanaActual === nombre) cerrarPanel();
        else abrirPanel(nombre, true);
    }
    function irDesdePanel(indice, cerrarEnChicas) {
        LB.irA(indice, true);
        if (cerrarEnChicas && pantallaChica.matches) cerrarPanel();
    }

    function instalarPanel() {
        Object.keys(pestanas).forEach((k) => {
            pestanas[k].tab.addEventListener('click', () => { mostrarPestana(k); if (k === 'buscar') $('inpBuscar').focus(); });
            pestanas[k].tab.addEventListener('keydown', (e) => {
                const orden = ['contenido', 'buscar', 'marcadores'].filter((n) => !pestanas[n].tab.hidden);
                const i = orden.indexOf(k);
                let destino = null;
                if (e.key === 'ArrowRight') destino = orden[(i + 1) % orden.length];
                else if (e.key === 'ArrowLeft') destino = orden[(i - 1 + orden.length) % orden.length];
                if (destino) { e.preventDefault(); mostrarPestana(destino); pestanas[destino].tab.focus(); }
            });
        });
        $('btnCerrarPanel').addEventListener('click', cerrarPanel);
        $('btnContenido').addEventListener('click', () => alternarPanel('contenido'));
        $('btnBuscar').addEventListener('click', () => alternarPanel('buscar'));
    }

    /* ---------- Contenido (índice del PDF) ---------- */
    let botonesContenido = [];
    function construirContenido() {
        const lista = $('listaContenido');
        lista.textContent = '';
        botonesContenido = [];
        if (!datos.indice.length) {
            $('vacioContenido').hidden = false;
            return;
        }
        datos.indice.forEach((e) => {
            const li = document.createElement('li');
            li.className = 'nivel-' + e.nivel;
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'lector-item-contenido';
            const t = document.createElement('span');
            t.textContent = e.titulo;
            const n = document.createElement('span');
            n.className = 'lector-item-pagina';
            n.textContent = String(e.pagina);
            b.appendChild(t);
            b.appendChild(n);
            b.addEventListener('click', () => irDesdePanel(e.pagina - 1, true));
            li.appendChild(b);
            lista.appendChild(li);
            botonesContenido.push(b);
        });
    }
    function marcarContenidoActual() {
        if (!botonesContenido.length) return;
        const visible = ultimaVisible();
        let marcada = -1;
        datos.indice.forEach((e, k) => { if (e.pagina - 1 <= visible) marcada = k; });
        botonesContenido.forEach((b, k) => {
            b.classList.toggle('actual', k === marcada);
            if (k === marcada) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
        });
    }

    /* ---------- Marcadores ---------- */
    let marcadores = [];
    function cargarMarcadores() {
        let lista = [];
        try { lista = JSON.parse(LB.leer(CLAVE_MARCADORES + datos.id) || '[]'); } catch (_e) { lista = []; }
        if (!Array.isArray(lista)) lista = [];
        marcadores = Array.from(new Set(lista.map((n) => parseInt(n, 10)).filter((n) => n >= 0 && n < total))).sort((a, b) => a - b).slice(0, MAX_MARCADORES);
    }
    function guardarMarcadores() {
        LB.guardar(CLAVE_MARCADORES + datos.id, JSON.stringify(marcadores));
    }
    function pintarMarcador() {
        const a = LB.actual();
        const marcada = marcadores.indexOf(a) !== -1;
        const btn = $('btnMarcador');
        btn.setAttribute('aria-pressed', marcada ? 'true' : 'false');
        const texto = marcada ? 'Quitar el marcador de la página ' + (a + 1) : 'Marcar la página ' + (a + 1);
        btn.setAttribute('aria-label', texto);
        btn.title = texto + ' (M)';
    }
    function pintarListaMarcadores() {
        const lista = $('listaMarcadores');
        lista.textContent = '';
        $('vacioMarcadores').hidden = marcadores.length > 0;
        marcadores.forEach((i) => {
            const li = document.createElement('li');
            const ir = document.createElement('button');
            ir.type = 'button';
            ir.className = 'lector-marcador-ir';
            const num = document.createElement('strong');
            num.textContent = 'Página ' + (i + 1);
            const cap = document.createElement('span');
            cap.textContent = capituloDe(i) || datos.titulo;
            ir.appendChild(num);
            ir.appendChild(cap);
            ir.addEventListener('click', () => irDesdePanel(i, true));
            const quitar = document.createElement('button');
            quitar.type = 'button';
            quitar.className = 'lector-btn lector-marcador-quitar';
            quitar.setAttribute('aria-label', 'Quitar el marcador de la página ' + (i + 1));
            quitar.title = 'Quitar marcador';
            quitar.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
            quitar.addEventListener('click', () => { quitarMarcador(i); });
            li.appendChild(ir);
            li.appendChild(quitar);
            lista.appendChild(li);
        });
    }
    function quitarMarcador(i) {
        marcadores = marcadores.filter((n) => n !== i);
        guardarMarcadores();
        pintarListaMarcadores();
        pintarMarcador();
    }
    function alternarMarcador() {
        const a = LB.actual();
        if (marcadores.indexOf(a) !== -1) {
            quitarMarcador(a);
            aviso('Marcador quitado de la página ' + (a + 1) + '.');
            return;
        }
        if (marcadores.length >= MAX_MARCADORES) {
            aviso('Llegaste al máximo de ' + MAX_MARCADORES + ' marcadores. Quita alguno para guardar otro.');
            return;
        }
        marcadores.push(a);
        marcadores.sort((x, y) => x - y);
        guardarMarcadores();
        pintarListaMarcadores();
        pintarMarcador();
        aviso('Página ' + (a + 1) + ' guardada en tus marcadores.', { texto: 'Ver marcadores', alHacerClic: () => abrirPanel('marcadores') });
    }

    /* ---------- Búsqueda ---------- */
    let indiceTexto = null;       // [{ texto, lineas: [{x,y,w,h,t,n,m}] }]
    let promesaTexto = null;
    let consultaActual = '';
    let paginasHalladas = [];
    let resultadoActual = -1;
    let lineasPorPagina = {};     // indicePagina -> [linea resaltada]

    function cargarTexto() {
        if (indiceTexto) return Promise.resolve(indiceTexto);
        if (promesaTexto) return promesaTexto;
        promesaTexto = fetch(LB.base() + datos.texto, { cache: 'no-cache' })
            .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .then((json) => {
                if (!json || !Array.isArray(json.paginas)) throw new Error('texto.json no válido');
                indiceTexto = json.paginas.slice(0, total).map((lineas) => {
                    const limpias = [];
                    (Array.isArray(lineas) ? lineas : []).slice(0, 800).forEach((l) => {
                        if (!Array.isArray(l) || l.length < 5 || typeof l[4] !== 'string') return;
                        const t = l[4].slice(0, 400);
                        const mapa = normalizarConMapa(t);
                        if (!mapa.n.trim()) return;
                        limpias.push({ x: +l[0] || 0, y: +l[1] || 0, w: +l[2] || 0, h: +l[3] || 0, t: t, n: mapa.n, m: mapa.m });
                    });
                    return { lineas: limpias, texto: limpias.map((l) => l.n).join(' ') };
                });
                while (indiceTexto.length < total) indiceTexto.push({ lineas: [], texto: '' });
                return indiceTexto;
            })
            .catch((e) => { promesaTexto = null; throw e; });
        return promesaTexto;
    }

    function quitarResaltes() {
        document.querySelectorAll('.resalte-busqueda').forEach((el) => el.remove());
        lineasPorPagina = {};
    }
    function dibujarResaltes() {
        Object.keys(lineasPorPagina).forEach((clave) => {
            const hoja = LB.elementoPagina(parseInt(clave, 10));
            if (!hoja) return;
            lineasPorPagina[clave].forEach((l) => {
                const d = document.createElement('div');
                d.className = 'resalte-busqueda';
                d.style.left = Math.max(0, l.x / 10 - 0.35) + '%';
                d.style.top = Math.max(0, l.y / 10 - 0.18) + '%';
                d.style.width = (l.w / 10 + 0.7) + '%';
                d.style.height = (l.h / 10 + 0.36) + '%';
                hoja.appendChild(d);
            });
        });
    }

    function limpiarBusqueda(mantenerTexto) {
        quitarResaltes();
        paginasHalladas = [];
        resultadoActual = -1;
        consultaActual = '';
        $('listaResultados').textContent = '';
        $('barraResultados').hidden = true;
        if (!mantenerTexto) {
            $('inpBuscar').value = '';
            $('infoBuscar').textContent = 'Escribe una palabra o una frase, por ejemplo «exponente» o «ley de signos».';
        }
    }

    function fragmentoCon(linea, inicioN, finN) {
        const original = linea.t;
        const desde = linea.m[inicioN];
        const ultimo = linea.m[finN - 1];
        const hasta = ultimo + (/[\ud800-\udbff]/.test(original.charAt(ultimo)) ? 2 : 1);
        const antes = original.slice(Math.max(0, desde - 34), desde);
        const centro = original.slice(desde, hasta);
        const despues = original.slice(hasta, hasta + 60);
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode((desde > 34 ? '…' : '') + antes));
        const marca = document.createElement('mark');
        marca.textContent = centro;
        frag.appendChild(marca);
        frag.appendChild(document.createTextNode(despues + (hasta + 60 < original.length ? '…' : '')));
        return frag;
    }

    function ejecutarBusqueda(consulta) {
        const q = normalizar(consulta);
        $('listaResultados').textContent = '';
        quitarResaltes();
        paginasHalladas = [];
        resultadoActual = -1;
        $('barraResultados').hidden = true;
        consultaActual = '';

        if (q.length < 2) {
            $('infoBuscar').textContent = q.length ? 'Escribe al menos 2 letras.' : 'Escribe una palabra o una frase, por ejemplo «exponente» o «ley de signos».';
            return;
        }
        $('infoBuscar').textContent = 'Buscando…';
        cargarTexto().then((indice) => {
            if (normalizar($('inpBuscar').value) !== q) return; // el lector siguió escribiendo
            const palabras = q.split(' ').filter((p) => p.length >= 2);
            const hallazgos = [];   // { pagina, lineas, linea, desde, hasta }
            const probar = (modo) => {
                indice.forEach((pg, i) => {
                    if (!pg.texto) return;
                    let lineas = [];
                    let primera = null;
                    if (modo === 'frase') {
                        if (pg.texto.indexOf(q) === -1) return;
                        pg.lineas.forEach((l) => {
                            const pos = l.n.indexOf(q);
                            if (pos !== -1) { lineas.push(l); if (!primera) primera = { l: l, a: pos, b: pos + q.length }; }
                        });
                        if (!lineas.length) {   // la frase cruza dos líneas: se marca la que tiene la primera palabra
                            const p0 = palabras[0] || q;
                            pg.lineas.forEach((l) => {
                                const pos = l.n.indexOf(p0);
                                if (pos !== -1) { lineas.push(l); if (!primera) primera = { l: l, a: pos, b: pos + p0.length }; }
                            });
                        }
                    } else {
                        if (!palabras.every((p) => pg.texto.indexOf(p) !== -1)) return;
                        pg.lineas.forEach((l) => {
                            palabras.forEach((p) => {
                                const pos = l.n.indexOf(p);
                                if (pos !== -1) { if (lineas.indexOf(l) === -1) lineas.push(l); if (!primera) primera = { l: l, a: pos, b: pos + p.length }; }
                            });
                        });
                    }
                    if (primera) hallazgos.push({ pagina: i, lineas: lineas, primera: primera });
                });
            };
            probar('frase');
            if (!hallazgos.length && palabras.length > 1) probar('palabras');

            consultaActual = q;
            paginasHalladas = hallazgos.slice(0, MAX_RESULTADOS).map((h) => h.pagina);
            hallazgos.slice(0, MAX_RESULTADOS).forEach((h) => { lineasPorPagina[h.pagina] = h.lineas; });

            if (!hallazgos.length) {
                $('infoBuscar').textContent = 'No encontramos «' + consulta.trim() + '». Prueba con otra palabra o con menos letras.';
                return;
            }
            $('infoBuscar').textContent = hallazgos.length + (hallazgos.length === 1 ? ' página con «' : ' páginas con «') + consulta.trim() + '»' +
                (hallazgos.length > MAX_RESULTADOS ? ' (se muestran las primeras ' + MAX_RESULTADOS + ')' : '') + '.';

            const lista = $('listaResultados');
            hallazgos.slice(0, MAX_RESULTADOS).forEach((h, k) => {
                const li = document.createElement('li');
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'lector-resultado';
                const pag = document.createElement('strong');
                pag.textContent = 'Página ' + (h.pagina + 1);
                const cap = document.createElement('small');
                cap.textContent = capituloDe(h.pagina);
                const txt = document.createElement('span');
                txt.appendChild(fragmentoCon(h.primera.l, h.primera.a, h.primera.b));
                b.appendChild(pag);
                if (cap.textContent) b.appendChild(cap);
                b.appendChild(txt);
                b.addEventListener('click', () => { irAResultado(k); if (pantallaChica.matches) cerrarPanel(); });
                li.appendChild(b);
                lista.appendChild(li);
            });
            dibujarResaltes();
            pintarBarraResultados();
        }).catch(() => {
            $('infoBuscar').textContent = 'No pudimos preparar la búsqueda. Revisa tu conexión e inténtalo otra vez.';
        });
    }

    function pintarBarraResultados() {
        const hay = paginasHalladas.length > 0;
        $('barraResultados').hidden = !hay;
        if (!hay) return;
        $('textoResultado').textContent = resultadoActual < 0
            ? paginasHalladas.length + (paginasHalladas.length === 1 ? ' resultado' : ' resultados')
            : 'Resultado ' + (resultadoActual + 1) + ' de ' + paginasHalladas.length;
        document.querySelectorAll('.lector-resultado').forEach((b, k) => b.classList.toggle('actual', k === resultadoActual));
    }
    function irAResultado(k) {
        if (!paginasHalladas.length) return;
        resultadoActual = ((k % paginasHalladas.length) + paginasHalladas.length) % paginasHalladas.length;
        LB.irA(paginasHalladas[resultadoActual], true);
        pintarBarraResultados();
        const activo = document.querySelector('.lector-resultado.actual');
        if (activo && activo.scrollIntoView && panelAbierto()) activo.scrollIntoView({ block: 'nearest' });
    }

    function instalarBusqueda() {
        const campo = $('inpBuscar');
        let espera = 0;
        $('formBuscar').addEventListener('submit', (e) => {
            e.preventDefault();
            window.clearTimeout(espera);
            ejecutarBusqueda(campo.value);
            if (paginasHalladas.length === 0) return;
        });
        campo.addEventListener('input', () => {
            window.clearTimeout(espera);
            if (!campo.value.trim()) { limpiarBusqueda(false); return; }
            espera = window.setTimeout(() => ejecutarBusqueda(campo.value), 280);
        });
        campo.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && paginasHalladas.length) {
                // Enter con resultados: pasa al siguiente resultado.
                e.preventDefault();
                window.clearTimeout(espera);
                if (normalizar(campo.value) !== consultaActual) { ejecutarBusqueda(campo.value); return; }
                irAResultado(resultadoActual + 1);
            }
            e.stopPropagation();
        });
        $('btnResultadoPrev').addEventListener('click', () => irAResultado(resultadoActual < 0 ? paginasHalladas.length - 1 : resultadoActual - 1));
        $('btnResultadoSig').addEventListener('click', () => irAResultado(resultadoActual + 1));
        $('btnResultadoCerrar').addEventListener('click', () => limpiarBusqueda(false));
    }

    /* ---------- Menú «Más» ---------- */
    const menu = $('menuMas');
    function menuAbierto() { return !menu.hidden; }
    function abrirMenu(abrir) {
        menu.hidden = !abrir;
        $('btnMas').setAttribute('aria-expanded', abrir ? 'true' : 'false');
        $('btnMas').classList.toggle('activo', abrir);
        if (!abrir) return;
        pintarMenu();
        const r = $('btnMas').getBoundingClientRect();
        menu.style.bottom = Math.max(8, window.innerHeight - r.top + 10) + 'px';
        menu.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
        const visibles = Array.from(menu.querySelectorAll('button')).filter((b) => b.offsetParent !== null);
        if (visibles[0]) visibles[0].focus({ preventScroll: true });
    }
    function pintarMenu() {
        $('mnuZoomValor').textContent = Math.round(LB.zoomActual() * 100) + '%';
        $('mnuZoomMenos').disabled = LB.zoomActual() <= 1;
        $('mnuZoomMas').disabled = LB.zoomActual() >= 3.999;
        $('mnuSonido').setAttribute('aria-pressed', LB.sonido() ? 'true' : 'false');
        $('estadoSonido').textContent = LB.sonido() ? 'Sí' : 'No';
        $('mnuVista').setAttribute('aria-pressed', LB.vistaUna() ? 'true' : 'false');
        $('estadoVista').textContent = LB.vistaUna() ? 'Sí' : 'No';
        $('mnuAuto').setAttribute('aria-pressed', autoActiva ? 'true' : 'false');
        $('estadoAuto').textContent = autoActiva ? 'Sí' : 'No';
        menu.querySelectorAll('.lector-segmentos button').forEach((b) => {
            b.setAttribute('aria-pressed', b.getAttribute('data-color') === document.body.getAttribute('data-color') ? 'true' : 'false');
        });
    }

    /* Compartir el enlace de la página actual */
    function copiarTexto(texto) {
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(texto);
        return new Promise((resolver, rechazar) => {
            const campo = document.createElement('textarea');
            campo.value = texto;
            campo.setAttribute('readonly', '');
            campo.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
            document.body.appendChild(campo);
            campo.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch (_e) { ok = false; }
            campo.remove();
            if (ok) resolver(); else rechazar(new Error('no se pudo copiar'));
        });
    }
    function compartirPagina() {
        const pagina = LB.actual() + 1;
        const url = window.location.origin + window.location.pathname + '?libro=' + encodeURIComponent(LB.idCarpeta()) + '&pagina=' + pagina;
        const carga = { title: datos.titulo, text: datos.titulo + ' · página ' + pagina, url: url };
        const copiar = () => copiarTexto(url).then(
            () => aviso('Enlace de la página ' + pagina + ' copiado.'),
            () => aviso('No pudimos copiar el enlace. Copia esta dirección: ' + url, null, 9)
        );
        if (navigator.share) {
            navigator.share(carga).catch((e) => { if (!e || e.name !== 'AbortError') copiar(); });
        } else {
            copiar();
        }
    }

    /* Una página o libro abierto */
    function aplicarVista(una, guardarPreferencia) {
        LB.fijarVista(una);
        if (guardarPreferencia) LB.guardar(CLAVE_VISTA, una ? 'una' : 'doble');
        pintarMenu();
    }

    /* Color de las páginas */
    function aplicarColor(color, guardarPreferencia) {
        const valido = ['normal', 'calido', 'tenue'].indexOf(color) !== -1 ? color : 'normal';
        document.body.setAttribute('data-color', valido);
        if (guardarPreferencia) LB.guardar(CLAVE_COLOR, valido);
        pintarMenu();
    }

    /* Pasar páginas solo */
    let autoActiva = false;
    let temporizadorAuto = 0;
    function reiniciarAuto() {
        window.clearInterval(temporizadorAuto);
        if (!autoActiva) return;
        temporizadorAuto = window.setInterval(() => {
            if (document.hidden || LB.zoomActual() > 1) return;
            if (LB.esUltima()) { alternarAuto(false); aviso('Llegaste al final del libro.'); return; }
            LB.siguiente();
        }, SEGUNDOS_AUTO * 1000);
    }
    function alternarAuto(forzar) {
        autoActiva = typeof forzar === 'boolean' ? forzar : !autoActiva;
        reiniciarAuto();
        pintarMenu();
        if (autoActiva) aviso('Las páginas pasan solas cada ' + SEGUNDOS_AUTO + ' segundos. Tócalo de nuevo para detenerlo.');
    }

    /* Ayuda */
    function abrirAyuda() {
        const dlg = $('dlgAyuda');
        const partes = [datos.titulo];
        if (datos.autor) partes.push(datos.autor);
        partes.push(total + ' páginas');
        $('ayudaLibro').textContent = partes.join(' · ');
        if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
        $('btnCerrarAyuda').focus();
    }
    function cerrarAyuda() {
        const dlg = $('dlgAyuda');
        if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
    }

    function instalarMenu() {
        $('btnMas').addEventListener('click', () => abrirMenu(!menuAbierto()));
        document.addEventListener('pointerdown', (e) => {
            if (!menuAbierto()) return;
            if (menu.contains(e.target) || $('btnMas').contains(e.target)) return;
            abrirMenu(false);
        });
        const cerrarYHacer = (fn) => () => { abrirMenu(false); fn(); };

        $('mnuZoomMenos').addEventListener('click', () => { LB.alejar(); pintarMenu(); });
        $('mnuZoomMas').addEventListener('click', () => { LB.acercar(); pintarMenu(); });
        $('mnuZoomValor').addEventListener('click', () => { LB.restablecerZoom(); pintarMenu(); });
        $('mnuSonido').addEventListener('click', () => { LB.alternarSonido(); pintarMenu(); });
        $('mnuCompartir').addEventListener('click', cerrarYHacer(compartirPagina));
        $('mnuVista').addEventListener('click', () => aplicarVista(!LB.vistaUna(), true));
        $('mnuAuto').addEventListener('click', () => { alternarAuto(); });
        $('mnuAyuda').addEventListener('click', cerrarYHacer(abrirAyuda));
        menu.querySelectorAll('.lector-segmentos button').forEach((b) => {
            b.addEventListener('click', () => aplicarColor(b.getAttribute('data-color'), true));
        });

        $('btnCerrarAyuda').addEventListener('click', cerrarAyuda);
        $('dlgAyuda').addEventListener('click', (e) => { if (e.target === $('dlgAyuda')) cerrarAyuda(); });
    }

    /* ---------- Teclado ---------- */
    function instalarTeclado() {
        document.addEventListener('keydown', (e) => {
            if ($('dlgAyuda').open) return;
            const enCampo = !!(e.target.closest && e.target.closest('input, textarea'));
            if (e.ctrlKey || e.metaKey) {
                if (/^f$/i.test(e.key) && datos.texto) { e.preventDefault(); abrirPanel('buscar', true); }
                return;
            }
            if (e.key === 'Escape') {
                if (menuAbierto()) { abrirMenu(false); $('btnMas').focus(); return; }
                if (enCampo && e.target.id === 'inpBuscar') { e.target.blur(); return; }
                if (!enCampo && LB.zoomActual() <= 1 && panelAbierto() && $('panelMiniaturas').hidden) cerrarPanel();
                return;
            }
            if (enCampo || e.altKey) return;
            const dentroDePanel = !!(e.target.closest && e.target.closest('#panelLateral, #menuMas'));
            if (dentroDePanel && e.key !== '?') return;
            switch (e.key) {
                case 'i': case 'I': alternarPanel('contenido'); e.preventDefault(); break;
                case '/': if (datos.texto) { abrirPanel('buscar', true); e.preventDefault(); } break;
                case 'm': case 'M': alternarMarcador(); e.preventDefault(); break;
                case 'g': case 'G': $('inpPagina').focus(); e.preventDefault(); break;
                case '?': abrirAyuda(); e.preventDefault(); break;
                default: break;
            }
        });
    }

    /* ---------- Capítulo en la barra de arriba ---------- */
    function pintarCapitulo() {
        const cap = capituloDe(ultimaVisible());
        const caja = $('autorLibro');
        if (cap) { caja.textContent = cap; caja.hidden = false; }
        else if (datos.autor) { caja.textContent = datos.autor; caja.hidden = false; }
    }

    /* ---------- Arranque ---------- */
    function alCambiarPagina() {
        pintarMarcador();
        marcarContenidoActual();
        pintarCapitulo();
        if (autoActiva) reiniciarAuto();
    }

    function iniciar() {
        datos = LB.datos();
        total = LB.total();

        instalarPanel();
        instalarMenu();
        instalarTeclado();
        $('btnMarcador').addEventListener('click', alternarMarcador);

        construirContenido();
        cargarMarcadores();
        pintarListaMarcadores();

        if (datos.texto) {
            instalarBusqueda();
        } else {
            $('btnBuscar').hidden = true;
            $('tabBuscar').hidden = true;
        }
        if (!datos.indice.length) {
            $('btnContenido').hidden = true;
            $('tabContenido').hidden = true;
            mostrarPestana('marcadores');
        }

        LB.alCambiar(alCambiarPagina);

        // Preferencias del lector.
        aplicarColor(LB.leer(CLAVE_COLOR) || 'normal', false);
        if (LB.leer(CLAVE_VISTA) === 'una') LB.fijarVista(true);
        pintarMenu();
        alCambiarPagina();

        // Avisos de bienvenida.
        const inicio = LB.inicio();
        if (inicio.tipo === 'guardada') {
            aviso('Seguimos en la página ' + inicio.pagina + ', donde te quedaste.', { texto: 'Ir al inicio', alHacerClic: () => LB.irA(0, true) }, 7);
        } else if (inicio.tipo === '' && !LB.leer(CLAVE_CONSEJO) && Object.keys(datos.enlaces).length) {
            LB.guardar(CLAVE_CONSEJO, '1');
            aviso('Los botones del libro funcionan: toca «Índice», las pestañas de capítulos o cualquier entrada del índice.', { texto: 'Entendido', alHacerClic: () => {} }, 9);
        }
    }

    LB.alEstarListo(iniciar);
})();
