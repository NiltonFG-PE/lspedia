/* ============================================================
   LSPedia - ALFABETIZACIÓN v2 (independiente del diccionario y del Quiz)
   ------------------------------------------------------------
   Sigue el mismo patrón que js/quiz.js (namespace QuizV2):
   caché local de 5 min + JSONP contra el Web App de Apps Script.

   ⚠️ MODO MOCK (mientras el Apps Script no está listo):
   Con MOCK_ACTIVO en true, los datos se leen de
   data/alfabetizacion-mock.json (mismo origen, sin problemas de
   CORS). Cuando el doGet combinado esté desplegado, basta con:
     1) Pegar la URL real en CONFIG.APPS_SCRIPT_URL
     2) Poner MOCK_ACTIVO en false
   El resto del módulo no necesita cambios: cargarDatos() ya
   entrega los datos en la misma forma { alfabeto, ejemplos }
   sin importar el origen.

   ARCHIVOS POR CARÁCTER (todos generados por ti, en el propio repo):
     img/alfabetizacion/boca/{CARACTER}.png                              (fonética, sí viene del Sheet -> campo imagenBoca)
     img/alfabetizacion/grafias/{CARACTER}-mayuscula.mp4                 (video de grafía, variante mayúscula)
     img/alfabetizacion/grafias/{CARACTER}-minuscula.mp4                 (video de grafía, variante minúscula)
     img/alfabetizacion/grafias/{CARACTER}-cursiva-mayuscula.mp4         (video de grafía, variante cursiva mayúscula)
     img/alfabetizacion/grafias/{CARACTER}-cursiva-minuscula.mp4         (video de grafía, variante cursiva minúscula)
   Estos 4 videos NO vienen del Sheet: se arman por convención de
   nombre a partir del carácter + variante activa (ver rutaVideoGrafia
   más abajo), para no tener que agregar columnas a la hoja de cálculo.
   El usuario elige la variante con 4 chips flotantes (mayúscula/
   minúscula/cursiva mayúscula/cursiva minúscula); el video de la caja
   "✏️ Grafía" cambia según el chip activo, con los mismos controles
   de velocidad 🐢/🐇 y 🔁 Reiniciar de siempre.
   Si en algún momento prefieres manejarlas desde Sheets también,
   avísame y lo cambiamos por 4 campos más en el JSON.
   ============================================================ */

const AlfabetizacionV2 = (function () {

    // ---------------------------------------------------------
    // CONFIGURACIÓN
    // ---------------------------------------------------------
    const CONFIG = {
        MOCK_ACTIVO: true, // 👉 cambiar a false cuando el Apps Script combinado esté listo
        MOCK_URL: "data/alfabetizacion-mock.json",

        // 👉 Pega aquí la URL de tu Web App de Apps Script (termina en /exec)
        //    (puede ser la misma del Quiz si el doGet combinado responde
        //     también a este endpoint, o una nueva si prefieres separarlo)
        APPS_SCRIPT_URL: "PEGA_AQUI_LA_URL_DEL_APPS_SCRIPT",

        CLAVE_CACHE: "lspedia_alfabetizacion_cache_v1",
        DURACION_CACHE_MS: 5 * 60 * 1000, // 5 minutos, igual que el Quiz

        VELOCIDADES_TRAZO: [0.5, 1, 1.5, 2],
        VELOCIDAD_INDEX_INICIAL: 1, // 1x

        // Las 4 variantes tipográficas, en el mismo orden que los chips del HTML.
        VARIANTES_TIPO: ["mayuscula", "minuscula", "cursiva-mayuscula", "cursiva-minuscula"]
    };

    // ---------------------------------------------------------
    // ESTADO INTERNO
    // ---------------------------------------------------------
    const estado = {
        datos: { alfabeto: [], ejemplos: [] },
        cargando: false,
        moduloActivo: "aprender", // aprender | completar | unir
        pantallaCompleta: false,

        aprender: {
            tipo: "letra",           // letra | numero
            indiceCaracter: 0,       // índice dentro de la lista filtrada por tipo
            velocidadIndex: CONFIG.VELOCIDAD_INDEX_INICIAL,
            ejemploIndice: 0,
            variante: "mayuscula"    // variante tipográfica activa (chip seleccionado)
        }
    };

    // ---------------------------------------------------------
    // REFERENCIAS AL DOM (perezosas, igual que en quiz.js)
    // ---------------------------------------------------------
    const el = (id) => document.getElementById(id);

    // ---------------------------------------------------------
    // CARGA DE DATOS (mock local o Apps Script real, mismo contrato)
    // ---------------------------------------------------------
    function cargarDatos(forzar) {
        mostrarBloque("alfabCargando");
        el("alfabError").classList.add("d-none");

        const cache = leerCache();
        if (cache && !forzar) {
            estado.datos = cache;
            alTerminarCarga();
            return;
        }

        if (CONFIG.MOCK_ACTIVO) {
            fetch(CONFIG.MOCK_URL)
                .then((res) => {
                    if (!res.ok) throw new Error("No se pudo leer " + CONFIG.MOCK_URL);
                    return res.json();
                })
                .then((data) => {
                    if (!data.ok) throw new Error(data.error || "Respuesta inválida del mock.");
                    guardarDatos(data);
                })
                .catch((err) => manejarErrorCarga(err));
            return;
        }

        fetchRemoto();
    }

    // Igual que quiz.js: JSONP porque Apps Script + GitHub Pages suele
    // bloquear la lectura por CORS aunque la URL funcione directamente.
    function fetchRemoto() {
        if (!CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.indexOf("PEGA_AQUI") > -1) {
            mostrarError("Alfabetización aún no está conectada a Google Sheets. Falta pegar la URL de Apps Script en js/alfabetizacion.js.");
            return;
        }

        const nombreCallback = "alfabV2Callback_" + Date.now();
        let resuelto = false;

        const limpiar = () => {
            delete window[nombreCallback];
            const s = document.getElementById(nombreCallback);
            if (s) s.remove();
        };

        window[nombreCallback] = function (data) {
            resuelto = true;
            limpiar();
            try {
                if (!data.ok) throw new Error(data.error || "Respuesta inválida del servidor.");
                guardarDatos(data);
            } catch (err) {
                manejarErrorCarga(err);
            }
        };

        const separador = CONFIG.APPS_SCRIPT_URL.indexOf("?") > -1 ? "&" : "?";
        const script = document.createElement("script");
        script.id = nombreCallback;
        script.src = CONFIG.APPS_SCRIPT_URL + separador + "callback=" + nombreCallback;
        script.onerror = () => {
            if (!resuelto) {
                limpiar();
                manejarErrorCarga(new Error("No se pudo conectar con Google Apps Script (revisa la URL o el despliegue)."));
            }
        };
        document.body.appendChild(script);

        setTimeout(() => {
            if (!resuelto) {
                limpiar();
                manejarErrorCarga(new Error("Tiempo de espera agotado al conectar con Google Sheets."));
            }
        }, 10000);
    }

    function guardarDatos(data) {
        estado.datos = { alfabeto: data.alfabeto || [], ejemplos: data.ejemplos || [] };
        guardarCache(estado.datos);
        alTerminarCarga();
    }

    function alTerminarCarga() {
        mostrarBloque("alfabAprender");
        renderModuloActivo();
    }

    function manejarErrorCarga(err) {
        console.error("Error cargando Alfabetización:", err);
        const cache = leerCache(true); // ignora expiración como último recurso
        if (cache) {
            estado.datos = cache;
            alTerminarCarga();
        } else {
            mostrarError("No se pudo cargar Alfabetización. Detalle técnico: " + (err && err.message ? err.message : err));
        }
    }

    function guardarCache(datos) {
        try {
            localStorage.setItem(CONFIG.CLAVE_CACHE, JSON.stringify({ ts: Date.now(), datos: datos }));
        } catch (e) { /* almacenamiento no disponible: se ignora silenciosamente */ }
    }

    function leerCache(ignorarExpiracion) {
        try {
            const crudo = localStorage.getItem(CONFIG.CLAVE_CACHE);
            if (!crudo) return null;
            const parsed = JSON.parse(crudo);
            const vencido = (Date.now() - parsed.ts) > CONFIG.DURACION_CACHE_MS;
            if (vencido && !ignorarExpiracion) return null;
            return parsed.datos || null;
        } catch (e) {
            return null;
        }
    }

    function mostrarError(msg) {
        ocultarTodosLosBloques();
        const cont = el("alfabError");
        cont.textContent = "⚠️ " + msg;
        cont.classList.remove("d-none");
    }

    // ---------------------------------------------------------
    // NAVEGACIÓN ENTRE BLOQUES (cargando / error / los 3 módulos / resultados)
    // ---------------------------------------------------------
    function ocultarTodosLosBloques() {
        ["alfabCargando", "alfabAprender", "alfabCompletar", "alfabUnir", "alfabResultados"].forEach((id) => {
            const bloque = el(id);
            if (bloque) bloque.classList.add("d-none");
        });
    }

    function mostrarBloque(id) {
        ocultarTodosLosBloques();
        const bloque = el(id);
        if (bloque) bloque.classList.remove("d-none");
        el("alfabError").classList.add("d-none");
    }

    function cambiarModulo(modulo) {
        estado.moduloActivo = modulo;

        document.querySelectorAll("[data-alfab-modulo]").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.alfabModulo === modulo);
        });

        const idBloque = modulo === "aprender" ? "alfabAprender" : modulo === "completar" ? "alfabCompletar" : "alfabUnir";
        mostrarBloque(idBloque);
        renderModuloActivo();
    }

    function renderModuloActivo() {
        if (estado.moduloActivo === "aprender") {
            renderAprender();
        }
        // "completar" y "unir" se implementan en el siguiente paso;
        // por ahora sus pantallas de intro ya están en el HTML y no
        // requieren datos para mostrarse.
    }

    // ===========================================================
    // MÓDULO 1: APRENDER
    // ===========================================================

    function listaFiltradaPorTipo() {
        return estado.datos.alfabeto.filter((c) => c.tipo === estado.aprender.tipo);
    }

    function caracterActual() {
        const lista = listaFiltradaPorTipo();
        if (!lista.length) return null;
        // por seguridad, si el índice quedó fuera de rango (p.ej. al cambiar de tipo)
        if (estado.aprender.indiceCaracter >= lista.length) estado.aprender.indiceCaracter = 0;
        return lista[estado.aprender.indiceCaracter];
    }

    function renderAprender() {
        renderIndiceCaracteres();
        renderCaracterActual();
    }

    // Índice de caracteres (mismo estilo .btn-abc del índice del diccionario)
    function renderIndiceCaracteres() {
        const cont = el("alfabIndiceCaracteres");
        if (!cont) return;
        const lista = listaFiltradaPorTipo();
        cont.innerHTML = lista.map((c, i) => {
            const activo = i === estado.aprender.indiceCaracter ? " fw-bold text-primary" : "";
            return `<button type="button" class="btn btn-link btn-abc text-decoration-none${activo}" data-indice="${i}">${c.caracter}</button>`;
        }).join("");

        cont.querySelectorAll("[data-indice]").forEach((btn) => {
            btn.addEventListener("click", () => {
                estado.aprender.indiceCaracter = Number(btn.dataset.indice);
                estado.aprender.ejemploIndice = 0;
                renderAprender();
            });
        });
    }

    // Convención de nombre para los 4 videos de grafía por variante
    // (mayúscula, minúscula, cursiva mayúscula, cursiva minúscula).
    // No vienen del Sheet: se arman a partir del carácter + variante.
    function rutaVideoGrafia(caracter, variante) {
        return "img/alfabetizacion/grafias/" + encodeURIComponent(caracter) + "-" + variante + ".mp4";
    }

    // Misma convención que rutaVideoGrafia, pero para la imagen estática
    // que se muestra DENTRO de cada chip (una por variante, del carácter
    // actual). Tampoco viene del Sheet.
    function rutaImagenGrafia(caracter, variante) {
        return "img/alfabetizacion/grafias/" + encodeURIComponent(caracter) + "-" + variante + ".png";
    }

    // Actualiza las 4 imágenes de los chips (mayúscula/minúscula/cursiva
    // mayúscula/cursiva minúscula) para que muestren el carácter actual.
    // Se llama una vez por carácter (no por cambio de variante activa,
    // ya que las 4 imágenes están siempre visibles a la vez).
    function actualizarImagenesChips(c) {
        CONFIG.VARIANTES_TIPO.forEach((v) => {
            const img = document.querySelector('[data-alfab-chip-img="' + v + '"]');
            if (!img) return;
            img.src = rutaImagenGrafia(c.caracter, v);
            img.alt = c.caracter + " (" + v + ")";
        });
    }

    // Pinta el chip activo y carga el video de grafía de esa variante
    // para el carácter actual, conservando la velocidad ya elegida.
    function renderVarianteActiva() {
        const c = caracterActual();
        if (!c) return;

        CONFIG.VARIANTES_TIPO.forEach((v) => {
            const chip = document.querySelector('[data-alfab-variante="' + v + '"]');
            if (chip) chip.classList.toggle("active", v === estado.aprender.variante);
        });

        const video = el("alfabTrazoVideo");
        if (!video) return;
        video.src = rutaVideoGrafia(c.caracter, estado.aprender.variante);
        video.playbackRate = CONFIG.VELOCIDADES_TRAZO[estado.aprender.velocidadIndex];
        video.load();
        video.play().catch(() => { /* el autoplay puede requerir un gesto del usuario en algunos navegadores */ });
    }

    function cambiarVarianteTipo(variante) {
        if (estado.aprender.variante === variante) return;
        estado.aprender.variante = variante;
        renderVarianteActiva();
    }

    // Las 4 cajas tipográficas (ahora chips) + fonética + grafía (video) + carrusel de ejemplos
    function renderCaracterActual() {
        const c = caracterActual();
        if (!c) return; // lista vacía (p.ej. mock sin números todavía)

        el("alfabCaracterActual").textContent = c.caracter;
        actualizarImagenesChips(c);

        el("alfabBocaImg").src = c.imagenBoca || "";

        actualizarLabelVelocidad();
        renderVarianteActiva();

        renderEjemploActual();
    }

    function irACaracter(delta) {
        const lista = listaFiltradaPorTipo();
        if (!lista.length) return;
        estado.aprender.indiceCaracter = (estado.aprender.indiceCaracter + delta + lista.length) % lista.length;
        estado.aprender.ejemploIndice = 0;
        estado.aprender.variante = "mayuscula";
        renderAprender();
    }

    function cambiarTipo(tipo) {
        estado.aprender.tipo = tipo;
        estado.aprender.indiceCaracter = 0;
        estado.aprender.ejemploIndice = 0;
        estado.aprender.variante = "mayuscula";

        el("btnAlfabTipoLetras").classList.toggle("active", tipo === "letra");
        el("btnAlfabTipoNumeros").classList.toggle("active", tipo === "numero");

        renderAprender();
    }

    // --- Control de velocidad de la grafía (video) ---
    // Al ser <video> (y no GIF), la velocidad es real: se aplica
    // directamente con .playbackRate, sin trucos ni recargas.
    function cambiarVelocidad(delta) {
        const max = CONFIG.VELOCIDADES_TRAZO.length - 1;
        estado.aprender.velocidadIndex = Math.min(max, Math.max(0, estado.aprender.velocidadIndex + delta));
        const video = el("alfabTrazoVideo");
        if (video) video.playbackRate = CONFIG.VELOCIDADES_TRAZO[estado.aprender.velocidadIndex];
        actualizarLabelVelocidad();
    }

    function actualizarLabelVelocidad() {
        const label = el("alfabTrazoVelocidadLabel");
        if (label) label.textContent = CONFIG.VELOCIDADES_TRAZO[estado.aprender.velocidadIndex] + "x";
    }

    function reiniciarTrazo() {
        const video = el("alfabTrazoVideo");
        if (!video || !video.src) return;
        video.currentTime = 0;
        video.play().catch(() => { /* el autoplay puede requerir un gesto del usuario en algunos navegadores */ });
    }

    // --- Carrusel de ejemplos del carácter actual ---
    function ejemplosDelCaracterActual() {
        const c = caracterActual();
        if (!c) return [];
        return estado.datos.ejemplos
            .filter((e) => e.caracter === c.caracter)
            .sort((a, b) => (a.orden || 0) - (b.orden || 0));
    }

    function renderEjemploActual() {
        const ejemplos = ejemplosDelCaracterActual();
        const imgEl = el("alfabEjemploImagen");
        const palabraEl = el("alfabEjemploPalabra");
        const contadorEl = el("alfabEjemploContador");

        if (!ejemplos.length) {
            imgEl.src = "";
            palabraEl.textContent = "—";
            contadorEl.textContent = "0 / 0";
            return;
        }

        if (estado.aprender.ejemploIndice >= ejemplos.length) estado.aprender.ejemploIndice = 0;
        const ejemplo = ejemplos[estado.aprender.ejemploIndice];

        imgEl.src = ejemplo.imagen || "";
        imgEl.alt = ejemplo.palabra || "";
        palabraEl.innerHTML = resaltarLetraInicial(ejemplo.palabra || "—");
        contadorEl.textContent = (estado.aprender.ejemploIndice + 1) + " / " + ejemplos.length;
    }

    // Envuelve la primera letra de la palabra en un span más grande y en
    // negrita (la letra/número que se está enseñando en este momento).
    function resaltarLetraInicial(palabra) {
        if (!palabra) return "—";
        const primera = palabra.charAt(0);
        const resto = palabra.slice(1);
        return '<span class="alfab-ejemplo-letra-inicial">' + escaparHtml(primera) + "</span>" + escaparHtml(resto);
    }

    function escaparHtml(texto) {
        const div = document.createElement("div");
        div.textContent = texto;
        return div.innerHTML;
    }

    function irAEjemplo(delta) {
        const ejemplos = ejemplosDelCaracterActual();
        if (!ejemplos.length) return;
        estado.aprender.ejemploIndice = (estado.aprender.ejemploIndice + delta + ejemplos.length) % ejemplos.length;
        renderEjemploActual();
    }

    // ---------------------------------------------------------
    // PANTALLA COMPLETA (mismo patrón que quiz.js)
    // ---------------------------------------------------------
    function elementoPantallaCompletaActivo() {
        return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
    }

    function alternarPantallaCompleta() {
        const seccion = el("seccionAlfabetizacion");
        if (!seccion) return;

        if (elementoPantallaCompletaActivo() || estado.pantallaCompleta) {
            const salirFn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
            if (elementoPantallaCompletaActivo() && salirFn) {
                salirFn.call(document);
            } else {
                estado.pantallaCompleta = false;
                seccion.classList.remove("quiz-fullscreen");
                actualizarIconoPantallaCompleta();
            }
            return;
        }

        const solicitarFn = seccion.requestFullscreen || seccion.webkitRequestFullscreen || seccion.msRequestFullscreen;
        if (solicitarFn) {
            Promise.resolve(solicitarFn.call(seccion)).catch(activarPantallaCompletaSimulada);
        } else {
            activarPantallaCompletaSimulada();
        }
    }

    function activarPantallaCompletaSimulada() {
        const seccion = el("seccionAlfabetizacion");
        if (!seccion) return;
        estado.pantallaCompleta = true;
        seccion.classList.add("quiz-fullscreen");
        actualizarIconoPantallaCompleta();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function actualizarIconoPantallaCompleta() {
        const btn = el("btnAlfabFullscreen");
        if (btn) btn.textContent = estado.pantallaCompleta ? "⤢" : "⛶";
    }

    function manejarCambioPantallaCompleta() {
        const seccion = el("seccionAlfabetizacion");
        const activo = !!elementoPantallaCompletaActivo();
        estado.pantallaCompleta = activo;
        if (seccion) seccion.classList.toggle("quiz-fullscreen", activo);
        actualizarIconoPantallaCompleta();
    }

    // ---------------------------------------------------------
    // SALIR
    // ---------------------------------------------------------
    function salir() {
        if (estado.pantallaCompleta || elementoPantallaCompletaActivo()) alternarPantallaCompleta();
    }

    // ---------------------------------------------------------
    // ENLAZAR BOTONES ESTÁTICOS (una sola vez)
    // ---------------------------------------------------------
    function enlazarEventos() {
        if (estado._listenersListos) return; // evita duplicar listeners cada vez que se abre la sección

        document.querySelectorAll("[data-alfab-modulo]").forEach((btn) => {
            btn.addEventListener("click", () => cambiarModulo(btn.dataset.alfabModulo));
        });

        const btnTipoLetras = el("btnAlfabTipoLetras");
        if (btnTipoLetras) btnTipoLetras.addEventListener("click", () => cambiarTipo("letra"));

        const btnTipoNumeros = el("btnAlfabTipoNumeros");
        if (btnTipoNumeros) btnTipoNumeros.addEventListener("click", () => cambiarTipo("numero"));

        const btnCarActualAnterior = el("btnAlfabCaracterAnterior");
        if (btnCarActualAnterior) btnCarActualAnterior.addEventListener("click", () => irACaracter(-1));

        const btnCarActualSiguiente = el("btnAlfabCaracterSiguiente");
        if (btnCarActualSiguiente) btnCarActualSiguiente.addEventListener("click", () => irACaracter(1));

        // Chips de las 4 variantes tipográficas (mayúscula/minúscula/cursivas)
        document.querySelectorAll(".alfab-chip-tipo").forEach((chip) => {
            chip.addEventListener("click", () => cambiarVarianteTipo(chip.dataset.alfabVariante));
        });

        const btnTrazoLento = el("btnAlfabTrazoLento");
        if (btnTrazoLento) btnTrazoLento.addEventListener("click", () => cambiarVelocidad(-1));

        const btnTrazoRapido = el("btnAlfabTrazoRapido");
        if (btnTrazoRapido) btnTrazoRapido.addEventListener("click", () => cambiarVelocidad(1));

        const btnTrazoReiniciar = el("btnAlfabTrazoReiniciar");
        if (btnTrazoReiniciar) btnTrazoReiniciar.addEventListener("click", reiniciarTrazo);

        const btnEjemploAnterior = el("btnAlfabEjemploAnterior");
        if (btnEjemploAnterior) btnEjemploAnterior.addEventListener("click", () => irAEjemplo(-1));

        const btnEjemploSiguiente = el("btnAlfabEjemploSiguiente");
        if (btnEjemploSiguiente) btnEjemploSiguiente.addEventListener("click", () => irAEjemplo(1));

        const btnFullscreen = el("btnAlfabFullscreen");
        if (btnFullscreen) btnFullscreen.addEventListener("click", alternarPantallaCompleta);

        const btnSalir = el("btnAlfabSalir");
        if (btnSalir) btnSalir.addEventListener("click", () => {
            salir();
            const seccion = el("seccionAlfabetizacion");
            if (seccion) seccion.classList.add("d-none");
        });

        ["fullscreenchange", "webkitfullscreenchange", "MSFullscreenChange"].forEach((evt) => {
            document.addEventListener(evt, manejarCambioPantallaCompleta);
        });

        estado._listenersListos = true;
    }

    // ---------------------------------------------------------
    // PUNTO DE ENTRADA PÚBLICO (llamado desde script.js)
    // ---------------------------------------------------------
    function iniciar() {
        enlazarEventos();
        cambiarModulo("aprender");
        cargarDatos(false);
    }

    return { iniciar, salir };
})();

window.AlfabetizacionV2 = AlfabetizacionV2;