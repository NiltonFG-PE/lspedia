/* ============================================================
   LSPedia Aventura — videojuego educativo principal (v1)
   Español + Matemáticas, móvil primero, progreso local.
   ============================================================ */
(function () {
    'use strict';

    const CLAVE_PROGRESO = 'lspedia_aventura_progreso_v1';
    const URL_BANCO = 'data/aventura-actividades.json?v=20260911';
    const IDS_OTROS_JUEGOS = [
        'quizMenuJuegos', 'quizCargando', 'quizError', 'quizIntro',
        'quizActivo', 'quizMemoria', 'quizResultados', 'alfabCompletar',
        'alfabUnir', 'alfabResultados', 'matApp'
    ];

    let banco = null;
    let progreso = leerProgreso();
    let zonaActiva = 'mercado';
    let actividadActiva = null;
    let intentos = 0;
    let ordenTokens = [];
    let ordenSeleccion = [];
    let toastTimer = null;

    function $(id) { return document.getElementById(id); }

    function leerProgreso() {
        try {
            const guardado = JSON.parse(localStorage.getItem(CLAVE_PROGRESO) || 'null');
            if (!guardado || typeof guardado !== 'object') throw new Error('sin progreso');
            return {
                version: 1,
                completadas: Array.isArray(guardado.completadas) ? [...new Set(guardado.completadas.map(String))] : [],
                monedas: Math.max(0, Number(guardado.monedas) || 0),
                ultimaZona: String(guardado.ultimaZona || 'mercado')
            };
        } catch (_e) {
            return { version: 1, completadas: [], monedas: 0, ultimaZona: 'mercado' };
        }
    }

    function guardarProgreso() {
        try {
            localStorage.setItem(CLAVE_PROGRESO, JSON.stringify({
                version: 1,
                completadas: progreso.completadas,
                monedas: progreso.monedas,
                ultimaZona: progreso.ultimaZona,
                actualizado: Date.now()
            }));
        } catch (_e) {}
    }

    function estrellas() {
        return progreso.completadas.length;
    }

    function barajar(lista) {
        const salida = lista.slice();
        for (let i = salida.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [salida[i], salida[j]] = [salida[j], salida[i]];
        }
        return salida;
    }

    function gtagEvento(nombre, parametros) {
        try {
            if (typeof window.gtag === 'function') window.gtag('event', nombre, parametros || {});
        } catch (_e) {}
    }

    function bancoRespaldo() {
        return {
            version: 1,
            titulo: 'LSPedia Aventura',
            zonas: [
                { id: 'mercado', nombre: 'Mercado', icono: '🛒', descripcion: 'Compra, compara y forma oraciones.', desbloqueoEstrellas: 0 },
                { id: 'escuela', nombre: 'Escuela', icono: '🏫', descripcion: 'Palabras, verbos y problemas matemáticos.', desbloqueoEstrellas: 3 },
                { id: 'ciudad', nombre: 'Ciudad', icono: '🏙️', descripcion: 'Retos de la vida diaria.', desbloqueoEstrellas: 6 }
            ],
            actividades: [
                {
                    id: 'respaldo-oracion', zona: 'mercado', area: 'espanol', tipo: 'ordenar', nivel: 'facil',
                    titulo: 'Ordena la compra', instruccion: 'Forma una oración correcta.', visual: '🥖 🛒',
                    palabras: ['La', 'niña', 'compra', 'pan'], respuesta: ['La', 'niña', 'compra', 'pan']
                },
                {
                    id: 'respaldo-matematica', zona: 'mercado', area: 'matematicas', tipo: 'opcion', nivel: 'facil',
                    titulo: '¿Cuánto pagas?', instruccion: 'Compras 2 panes. Cada pan cuesta S/ 3.', visual: '🥖🥖 × S/ 3',
                    opciones: ['S/ 5', 'S/ 6', 'S/ 8', 'S/ 9'], respuesta: 'S/ 6'
                }
            ]
        };
    }

    async function cargarBanco() {
        if (banco) return banco;
        try {
            const respuesta = await fetch(URL_BANCO, { cache: 'no-store' });
            if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
            const datos = await respuesta.json();
            if (!datos || !Array.isArray(datos.zonas) || !Array.isArray(datos.actividades)) throw new Error('Banco inválido');
            banco = datos;
        } catch (error) {
            console.warn('[LSPedia Aventura] No se pudo cargar el banco; se usa respaldo.', error);
            banco = bancoRespaldo();
        }
        return banco;
    }

    function crearTarjetaMenu() {
        const menu = $('quizMenuJuegos');
        if (!menu || $('btnMenuJuegoAventura')) return;
        const fila = menu.querySelector('.row.g-3');
        if (!fila) return;

        const col = document.createElement('div');
        col.className = 'col-12 aventura-menu-col';
        col.innerHTML = `
            <button type="button" class="quiz-selector-btn menu-juego-btn aventura-menu-card w-100" id="btnMenuJuegoAventura" aria-label="Abrir LSPedia Aventura">
                <span class="aventura-menu-contenido">
                    <span class="aventura-menu-copy">
                        <span class="aventura-menu-nuevo">NUEVO · VIDEOJUEGO</span>
                        <span class="aventura-menu-titulo">LSPedia Aventura</span>
                        <span class="aventura-menu-desc">Explora lugares, supera misiones y aprende español y matemáticas jugando.</span>
                        <span class="aventura-menu-desc" id="aventuraMenuProgreso">⭐ 0 misiones superadas</span>
                    </span>
                    <span class="aventura-menu-preview" aria-hidden="true">
                        <span class="amp-sol"></span><span class="amp-camino"></span>
                        <span class="amp-zona">🛒</span><span class="amp-zona">🏫</span><span class="amp-zona">🏙️</span>
                    </span>
                </span>
            </button>`;
        fila.insertBefore(col, fila.firstChild);
        $('btnMenuJuegoAventura').addEventListener('click', abrirAventura);
        actualizarProgresoMenu();
    }

    function crearApp() {
        if ($('aventuraApp')) return;
        const seccion = $('seccionQuiz');
        if (!seccion) return;

        const app = document.createElement('div');
        app.id = 'aventuraApp';
        app.className = 'd-none';
        app.innerHTML = `
            <div class="aventura-shell" id="aventuraShell">
                <header class="aventura-topbar">
                    <button type="button" class="aventura-btn-volver" id="btnAventuraVolverMenu" aria-label="Volver a la lista de juegos">←</button>
                    <div class="aventura-topbar-titulo">
                        <strong>LSPedia Aventura</strong>
                        <span>Español + Matemáticas en misiones visuales</span>
                    </div>
                    <div class="aventura-hud" aria-label="Progreso">
                        <span class="aventura-hud-chip" title="Estrellas"><span>⭐</span><b id="aventuraHudEstrellas">0</b></span>
                        <span class="aventura-hud-chip" title="Monedas"><span>🪙</span><b id="aventuraHudMonedas">0</b></span>
                    </div>
                </header>

                <main class="aventura-mapa-wrap" id="aventuraMapa">
                    <span class="aventura-nube aventura-nube-1" aria-hidden="true"></span>
                    <span class="aventura-nube aventura-nube-2" aria-hidden="true"></span>
                    <div class="aventura-colinas" aria-hidden="true"></div>
                    <svg class="aventura-ruta-svg" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
                        <path class="ruta-base" d="M120 470 C210 390 270 420 350 360 C455 280 520 295 595 340 C695 400 760 440 905 425"></path>
                        <path class="ruta-linea" d="M120 470 C210 390 270 420 350 360 C455 280 520 295 595 340 C695 400 760 440 905 425"></path>
                    </svg>
                    <div class="aventura-mapa-titulo">
                        <strong>Elige un lugar</strong>
                        <span>Cada misión te da una estrella. Desbloquea nuevas zonas.</span>
                    </div>
                    <div id="aventuraZonas"></div>
                    <div class="aventura-avatar" id="aventuraAvatar" data-pos="mercado" aria-hidden="true">
                        <span class="aventura-avatar-cabeza"></span>
                        <span class="aventura-avatar-cuerpo"></span>
                    </div>
                </main>

                <div class="aventura-panel d-none" id="aventuraPanel" role="dialog" aria-modal="true" aria-label="Misiones de LSPedia Aventura">
                    <div class="aventura-panel-card" id="aventuraPanelCard"></div>
                </div>
                <div class="aventura-confeti" id="aventuraConfeti" aria-hidden="true"></div>
                <div class="aventura-toast" id="aventuraToast" role="status" aria-live="polite"></div>
            </div>`;
        seccion.appendChild(app);

        $('btnAventuraVolverMenu').addEventListener('click', cerrarAventura);
        $('aventuraPanel').addEventListener('click', (e) => {
            if (e.target === $('aventuraPanel')) cerrarPanel();
        });

        const salirGeneral = $('btnQuizSalir');
        if (salirGeneral) salirGeneral.addEventListener('click', () => {
            if (!$('aventuraApp').classList.contains('d-none')) prepararCierreSilencioso();
        });
    }

    function actualizarProgresoMenu() {
        const el = $('aventuraMenuProgreso');
        if (!el) return;
        const n = estrellas();
        el.textContent = `⭐ ${n} ${n === 1 ? 'misión superada' : 'misiones superadas'} · 🪙 ${progreso.monedas}`;
    }

    function actualizarHUD() {
        if ($('aventuraHudEstrellas')) $('aventuraHudEstrellas').textContent = String(estrellas());
        if ($('aventuraHudMonedas')) $('aventuraHudMonedas').textContent = String(progreso.monedas);
        actualizarProgresoMenu();
    }

    function zonaDisponible(zona) {
        return estrellas() >= Math.max(0, Number(zona.desbloqueoEstrellas) || 0);
    }

    function actividadesZona(idZona) {
        return banco && Array.isArray(banco.actividades)
            ? banco.actividades.filter(a => a && a.zona === idZona)
            : [];
    }

    function renderZonas() {
        const cont = $('aventuraZonas');
        if (!cont || !banco) return;
        cont.textContent = '';

        banco.zonas.forEach((zona) => {
            const desbloqueada = zonaDisponible(zona);
            const hechas = actividadesZona(zona.id).filter(a => progreso.completadas.includes(a.id)).length;
            const total = actividadesZona(zona.id).length;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'aventura-zona' + (desbloqueada ? '' : ' bloqueada');
            btn.dataset.zona = zona.id;
            btn.setAttribute('aria-disabled', desbloqueada ? 'false' : 'true');
            btn.setAttribute('aria-label', desbloqueada
                ? `${zona.nombre}. ${hechas} de ${total} misiones completadas`
                : `${zona.nombre} bloqueada. Necesitas ${zona.desbloqueoEstrellas} estrellas`);

            const edificio = document.createElement('span');
            edificio.className = 'aventura-zona-edificio';
            edificio.textContent = zona.icono || '📍';
            const info = document.createElement('span');
            info.className = 'aventura-zona-info';
            const nombre = document.createElement('strong');
            nombre.textContent = zona.nombre;
            const detalle = document.createElement('span');
            detalle.textContent = desbloqueada
                ? `${hechas}/${total} misiones`
                : `⭐ ${zona.desbloqueoEstrellas} para abrir`;
            info.append(nombre, detalle);
            btn.append(edificio, info);
            btn.addEventListener('click', () => seleccionarZona(zona));
            cont.appendChild(btn);
        });
    }

    function seleccionarZona(zona) {
        if (!zonaDisponible(zona)) {
            const faltan = Math.max(0, Number(zona.desbloqueoEstrellas) - estrellas());
            mostrarToast(`🔒 Completa ${faltan} ${faltan === 1 ? 'misión más' : 'misiones más'} para entrar a ${zona.nombre}.`);
            return;
        }
        zonaActiva = zona.id;
        progreso.ultimaZona = zona.id;
        guardarProgreso();
        const avatar = $('aventuraAvatar');
        if (avatar) avatar.dataset.pos = zona.id;
        setTimeout(() => abrirPanelZona(zona.id), 260);
        gtagEvento('educational_game_zone', { game_name: 'lspedia_aventura', zone: zona.id });
    }

    function abrirPanelZona(idZona) {
        const zona = banco.zonas.find(z => z.id === idZona) || banco.zonas[0];
        if (!zona) return;
        zonaActiva = zona.id;
        actividadActiva = null;
        const panel = $('aventuraPanel');
        const card = $('aventuraPanelCard');
        if (!panel || !card) return;
        card.textContent = '';

        const cerrar = document.createElement('button');
        cerrar.type = 'button';
        cerrar.className = 'aventura-panel-cerrar';
        cerrar.setAttribute('aria-label', 'Cerrar misiones');
        cerrar.textContent = '×';
        cerrar.addEventListener('click', cerrarPanel);

        const cab = document.createElement('div');
        cab.className = 'aventura-panel-zona';
        const icono = document.createElement('span');
        icono.className = 'aventura-panel-zona-icono';
        icono.textContent = zona.icono || '📍';
        const copy = document.createElement('div');
        const h = document.createElement('h3');
        h.textContent = zona.nombre;
        const p = document.createElement('p');
        p.textContent = zona.descripcion || 'Supera las misiones para avanzar.';
        copy.append(h, p);
        cab.append(icono, copy);
        card.append(cerrar, cab);

        const misiones = document.createElement('div');
        misiones.className = 'aventura-misiones';
        actividadesZona(zona.id).forEach((actividad, indice) => {
            const completada = progreso.completadas.includes(actividad.id);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'aventura-mision' + (completada ? ' completada' : '');
            btn.dataset.area = actividad.area || 'espanol';
            btn.setAttribute('aria-label', `${actividad.titulo}. ${completada ? 'Completada' : 'Pendiente'}`);

            const ico = document.createElement('span');
            ico.className = 'aventura-mision-icono';
            ico.textContent = actividad.area === 'matematicas' ? '➗' : '📝';
            const mc = document.createElement('span');
            mc.className = 'aventura-mision-copy';
            const titulo = document.createElement('strong');
            titulo.textContent = `${indice + 1}. ${actividad.titulo}`;
            const desc = document.createElement('span');
            desc.textContent = actividad.area === 'matematicas' ? 'Matemáticas' : 'Español';
            const nivel = document.createElement('span');
            nivel.className = 'aventura-nivel';
            nivel.textContent = actividad.nivel || 'fácil';
            mc.append(titulo, desc, nivel);
            const estado = document.createElement('span');
            estado.className = 'aventura-mision-estado';
            estado.textContent = completada ? '★' : '→';
            btn.append(ico, mc, estado);
            btn.addEventListener('click', () => iniciarMision(actividad.id));
            misiones.appendChild(btn);
        });
        card.appendChild(misiones);

        const proxima = banco.zonas.find(z => Number(z.desbloqueoEstrellas) > estrellas());
        if (proxima) {
            const aviso = document.createElement('div');
            aviso.className = 'aventura-desbloqueo';
            const faltan = Math.max(0, Number(proxima.desbloqueoEstrellas) - estrellas());
            aviso.textContent = `🔒 ${proxima.nombre}: ${faltan} ${faltan === 1 ? 'estrella más' : 'estrellas más'} para desbloquear.`;
            card.appendChild(aviso);
        }

        panel.classList.remove('d-none');
        setTimeout(() => cerrar.focus(), 60);
    }

    function cerrarPanel() {
        const panel = $('aventuraPanel');
        if (panel) panel.classList.add('d-none');
        actividadActiva = null;
        ordenTokens = [];
        ordenSeleccion = [];
    }

    function iniciarMision(idActividad) {
        const actividad = banco.actividades.find(a => a.id === idActividad);
        if (!actividad) return;
        actividadActiva = actividad;
        intentos = 0;
        ordenSeleccion = [];
        renderReto();
        gtagEvento('educational_game_mission_start', {
            game_name: 'lspedia_aventura',
            area: actividad.area,
            level: actividad.nivel,
            zone: actividad.zona
        });
    }

    function crearCabeceraReto(card, actividad) {
        const arriba = document.createElement('div');
        arriba.className = 'aventura-reto-cabecera';
        const volver = document.createElement('button');
        volver.type = 'button';
        volver.className = 'aventura-btn aventura-btn-secundario';
        volver.textContent = '← Misiones';
        volver.addEventListener('click', () => abrirPanelZona(zonaActiva));
        const area = document.createElement('span');
        area.className = 'aventura-reto-area' + (actividad.area === 'matematicas' ? ' matematicas' : '');
        area.textContent = actividad.area === 'matematicas' ? '➗ Matemáticas' : '📝 Español';
        arriba.append(volver, area);
        card.appendChild(arriba);
    }

    function renderReto() {
        const card = $('aventuraPanelCard');
        const actividad = actividadActiva;
        if (!card || !actividad) return;
        card.textContent = '';
        crearCabeceraReto(card, actividad);

        const reto = document.createElement('section');
        reto.className = 'aventura-reto';
        const visual = document.createElement('div');
        visual.className = 'aventura-reto-visual';
        visual.textContent = actividad.visual || (actividad.area === 'matematicas' ? '🔢' : '📝');
        const h = document.createElement('h4');
        h.textContent = actividad.titulo || 'Misión';
        const ins = document.createElement('p');
        ins.className = 'aventura-reto-instruccion';
        ins.textContent = actividad.instruccion || 'Resuelve el reto.';
        reto.append(visual, h, ins);

        if (actividad.tipo === 'ordenar') renderOrdenar(reto, actividad);
        else renderOpciones(reto, actividad);

        const feedback = document.createElement('div');
        feedback.className = 'aventura-feedback';
        feedback.id = 'aventuraFeedback';
        feedback.setAttribute('aria-live', 'polite');
        reto.appendChild(feedback);
        card.appendChild(reto);
    }

    function renderOpciones(reto, actividad) {
        const caja = document.createElement('div');
        caja.className = 'aventura-opciones';
        barajar(Array.isArray(actividad.opciones) ? actividad.opciones : []).forEach((valor) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'aventura-opcion';
            btn.textContent = String(valor);
            btn.addEventListener('click', () => responderOpcion(btn, String(valor)));
            caja.appendChild(btn);
        });
        reto.appendChild(caja);
    }

    function responderOpcion(btn, valor) {
        if (!actividadActiva || btn.disabled) return;
        const correcta = String(actividadActiva.respuesta);
        intentos += 1;
        if (valor === correcta) {
            document.querySelectorAll('#aventuraPanelCard .aventura-opcion').forEach(b => { b.disabled = true; });
            btn.classList.add('acierto');
            resolverCorrecto();
        } else {
            btn.classList.remove('error');
            void btn.offsetWidth;
            btn.classList.add('error');
            feedback('Todavía no. Mira el reto y prueba otra vez.', false);
            setTimeout(() => btn.classList.remove('error'), 500);
        }
    }

    function renderOrdenar(reto, actividad) {
        const palabras = Array.isArray(actividad.palabras) ? actividad.palabras : [];
        ordenTokens = barajar(palabras.map((texto, indice) => ({ id: `${indice}-${texto}`, texto: String(texto) })));
        const orden = document.createElement('div');
        orden.className = 'aventura-orden-zona';
        const respuesta = document.createElement('div');
        respuesta.className = 'aventura-orden-respuesta vacia';
        respuesta.id = 'aventuraOrdenRespuesta';
        const fichas = document.createElement('div');
        fichas.className = 'aventura-palabras';
        fichas.id = 'aventuraPalabras';
        orden.append(respuesta, fichas);
        reto.appendChild(orden);

        const acciones = document.createElement('div');
        acciones.className = 'aventura-reto-acciones';
        const limpiar = document.createElement('button');
        limpiar.type = 'button';
        limpiar.className = 'aventura-btn aventura-btn-secundario';
        limpiar.textContent = '↺ Limpiar';
        limpiar.addEventListener('click', () => { ordenSeleccion = []; renderFichasOrden(); });
        const comprobar = document.createElement('button');
        comprobar.type = 'button';
        comprobar.className = 'aventura-btn aventura-btn-principal';
        comprobar.id = 'btnAventuraComprobarOrden';
        comprobar.textContent = 'Comprobar ✓';
        comprobar.addEventListener('click', comprobarOrden);
        acciones.append(limpiar, comprobar);
        reto.appendChild(acciones);
        renderFichasOrden();
    }

    function renderFichasOrden() {
        const respuesta = $('aventuraOrdenRespuesta');
        const fichas = $('aventuraPalabras');
        if (!respuesta || !fichas) return;
        respuesta.textContent = '';
        fichas.textContent = '';
        respuesta.classList.toggle('vacia', ordenSeleccion.length === 0);

        ordenSeleccion.forEach((id) => {
            const token = ordenTokens.find(t => t.id === id);
            if (!token) return;
            const span = document.createElement('span');
            span.className = 'aventura-palabra-chip seleccionada';
            span.textContent = token.texto;
            respuesta.appendChild(span);
        });

        ordenTokens.forEach((token) => {
            const seleccionado = ordenSeleccion.includes(token.id);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'aventura-palabra-chip' + (seleccionado ? ' seleccionada' : '');
            btn.textContent = token.texto;
            btn.setAttribute('aria-pressed', seleccionado ? 'true' : 'false');
            btn.addEventListener('click', () => {
                if (seleccionado) ordenSeleccion = ordenSeleccion.filter(x => x !== token.id);
                else ordenSeleccion.push(token.id);
                renderFichasOrden();
            });
            fichas.appendChild(btn);
        });
    }

    function comprobarOrden() {
        if (!actividadActiva) return;
        const respuesta = Array.isArray(actividadActiva.respuesta) ? actividadActiva.respuesta.map(String) : [];
        if (ordenSeleccion.length !== respuesta.length) {
            feedback('Usa todas las palabras antes de comprobar.', false);
            return;
        }
        const construida = ordenSeleccion.map(id => {
            const token = ordenTokens.find(t => t.id === id);
            return token ? token.texto : '';
        });
        intentos += 1;
        const correcta = construida.every((valor, i) => valor === respuesta[i]);
        if (correcta) {
            document.querySelectorAll('#aventuraPanelCard .aventura-palabra-chip, #aventuraPanelCard .aventura-btn').forEach(b => {
                if (b.tagName === 'BUTTON') b.disabled = true;
            });
            resolverCorrecto();
        } else {
            feedback('El orden todavía no es correcto. Inténtalo otra vez.', false);
            const caja = $('aventuraOrdenRespuesta');
            if (caja) {
                caja.classList.remove('aventura-error-orden');
                void caja.offsetWidth;
                caja.classList.add('aventura-error-orden');
            }
        }
    }

    function feedback(mensaje, ok) {
        const el = $('aventuraFeedback');
        if (!el) return;
        el.textContent = mensaje;
        el.className = 'aventura-feedback ' + (ok ? 'ok' : 'error');
    }

    function resolverCorrecto() {
        if (!actividadActiva) return;
        const anteriores = estrellas();
        const primeraVez = !progreso.completadas.includes(actividadActiva.id);
        if (primeraVez) progreso.completadas.push(actividadActiva.id);
        progreso.monedas += primeraVez ? (intentos <= 1 ? 10 : 7) : 2;
        progreso.ultimaZona = actividadActiva.zona;
        guardarProgreso();
        actualizarHUD();
        renderZonas();
        feedback(primeraVez ? '¡Muy bien! Ganaste ⭐ 1 y monedas.' : '¡Correcto! Ya habías superado esta misión.', true);
        lanzarConfeti();

        const reto = document.querySelector('#aventuraPanelCard .aventura-reto');
        if (reto && !$('btnAventuraContinuar')) {
            const acciones = document.createElement('div');
            acciones.className = 'aventura-reto-acciones';
            const seguir = document.createElement('button');
            seguir.type = 'button';
            seguir.id = 'btnAventuraContinuar';
            seguir.className = 'aventura-btn aventura-btn-principal';
            seguir.textContent = 'Continuar →';
            seguir.addEventListener('click', () => abrirPanelZona(zonaActiva));
            acciones.appendChild(seguir);
            reto.appendChild(acciones);
            setTimeout(() => seguir.focus(), 150);
        }

        const nuevas = banco.zonas.filter(z => Number(z.desbloqueoEstrellas) > anteriores && Number(z.desbloqueoEstrellas) <= estrellas());
        if (nuevas.length) {
            setTimeout(() => mostrarToast(`🔓 ¡Nueva zona desbloqueada: ${nuevas[0].nombre}!`), 450);
        }

        gtagEvento('educational_game_mission_complete', {
            game_name: 'lspedia_aventura',
            area: actividadActiva.area,
            level: actividadActiva.nivel,
            zone: actividadActiva.zona,
            first_completion: primeraVez ? 'yes' : 'no',
            attempts: Math.min(intentos, 9)
        });
    }

    function lanzarConfeti() {
        const caja = $('aventuraConfeti');
        if (!caja) return;
        caja.textContent = '';
        const colores = ['#ffc83d', '#2fa7e4', '#42ba78', '#f47777', '#936ed4'];
        for (let i = 0; i < 26; i += 1) {
            const pieza = document.createElement('i');
            pieza.style.left = `${8 + Math.random() * 84}%`;
            pieza.style.background = colores[i % colores.length];
            pieza.style.setProperty('--x', `${-70 + Math.random() * 140}px`);
            pieza.style.animationDelay = `${Math.random() * .18}s`;
            caja.appendChild(pieza);
        }
        setTimeout(() => { caja.textContent = ''; }, 1500);
    }

    function mostrarToast(texto) {
        const toast = $('aventuraToast');
        if (!toast) return;
        clearTimeout(toastTimer);
        toast.textContent = texto;
        toast.classList.add('visible');
        toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
    }

    function ocultarOtrosJuegos() {
        IDS_OTROS_JUEGOS.forEach((id) => {
            const el = $(id);
            if (el) el.classList.add('d-none');
        });
    }

    async function abrirAventura() {
        await cargarBanco();
        crearApp();
        ocultarOtrosJuegos();
        const app = $('aventuraApp');
        if (!app) return;
        app.classList.remove('d-none');
        progreso = leerProgreso();
        const ultima = banco.zonas.find(z => z.id === progreso.ultimaZona && zonaDisponible(z));
        zonaActiva = ultima ? ultima.id : 'mercado';
        const avatar = $('aventuraAvatar');
        if (avatar) avatar.dataset.pos = zonaActiva;
        cerrarPanel();
        actualizarHUD();
        renderZonas();
        setTimeout(() => app.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
        gtagEvento('educational_game_open', { game_name: 'lspedia_aventura' });
    }

    function prepararCierreSilencioso() {
        const app = $('aventuraApp');
        if (app) app.classList.add('d-none');
        cerrarPanel();
    }

    function cerrarAventura() {
        prepararCierreSilencioso();
        const menu = $('quizMenuJuegos');
        if (menu) menu.classList.remove('d-none');
        actualizarProgresoMenu();
        if (menu) setTimeout(() => menu.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
        gtagEvento('educational_game_close', { game_name: 'lspedia_aventura' });
    }

    function montar() {
        crearTarjetaMenu();
        crearApp();
        actualizarProgresoMenu();

        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            const panel = $('aventuraPanel');
            const app = $('aventuraApp');
            if (panel && !panel.classList.contains('d-none')) cerrarPanel();
            else if (app && !app.classList.contains('d-none')) cerrarAventura();
        });
    }

    window.LSPediaAventura = Object.freeze({
        abrir: abrirAventura,
        cerrar: cerrarAventura,
        progreso: () => ({ estrellas: estrellas(), monedas: progreso.monedas, completadas: progreso.completadas.slice() })
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar, { once: true });
    else montar();
})();
