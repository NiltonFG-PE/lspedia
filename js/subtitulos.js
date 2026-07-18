/* ============================================================
   LSPedia - SUBTÍTULOS EN TIEMPO REAL (SubtitulosV2)
   ------------------------------------------------------------
   Módulo independiente (mismo patrón que QuizV2 y AlfabetizacionV2).
   Usa la Web Speech API del navegador para escuchar el audio
   ambiente a través del micrófono del dispositivo y mostrarlo como
   subtítulos en vivo, con pantalla completa y "modo cine" (fondo
   negro, texto blanco grande), pensado para que una persona sorda
   pueda seguir una película, serie, TV o conversación en tiempo real.

   ⚠️ LIMITACIONES IMPORTANTES A TENER EN CUENTA:
   - Solo funciona bien en navegadores basados en Chromium (Chrome,
     Edge, Opera, Chrome Android). Safari/iOS y Firefox todavía no
     soportan bien (o nada) la Web Speech API.
   - El navegador NO puede "escuchar" el audio interno de otra app
     (Netflix, YouTube, un reproductor de cine digital, etc.)
     directamente: usa el MICRÓFONO del dispositivo, así que capta
     el sonido que sale por el parlante de la sala/TV/cine. Para
     mejores resultados, hay que acercar el celular al parlante.
   - Requiere conexión a internet (Chrome envía el audio a un
     servicio en la nube para transcribirlo) y permiso de micrófono.
   - Al salir de la sección, el micrófono se apaga automáticamente
     por privacidad (ver salir()).
   ============================================================ */

const SubtitulosV2 = (function () {

    // ---------------------------------------------------------
    // CONFIGURACIÓN
    // ---------------------------------------------------------
    const CONFIG = {
        IDIOMA_POR_DEFECTO: "es-PE",
        TAMANOS: ["sm", "md", "lg", "xl"],
        TAMANO_INICIAL_INDEX: 1, // "md"
        MAX_LINEAS_HISTORIAL: 6  // cuántas frases finales se muestran a la vez
    };

    const NOMBRES_IDIOMA = {
        "es-PE": "Español (Perú)",
        "es-419": "Español (Latinoamérica)",
        "es-ES": "Español (España)",
        "en-US": "English (US)"
    };

    // ---------------------------------------------------------
    // ESTADO INTERNO
    // ---------------------------------------------------------
    const estado = {
        reconocimiento: null,
        activo: false,           // el usuario pidió escuchar (se mantiene true entre reinicios automáticos)
        idioma: CONFIG.IDIOMA_POR_DEFECTO,
        cine: false,
        pantallaCompleta: false,
        tamanoIndex: CONFIG.TAMANO_INICIAL_INDEX,
        lineasFinales: [],
        textoInterino: "",
        _reinicioProgramado: false,
        _eventosListos: false
    };

    function el(id) { return document.getElementById(id); }

    // ---------------------------------------------------------
    // SOPORTE DEL NAVEGADOR
    // ---------------------------------------------------------
    function obtenerConstructorReconocimiento() {
        return window.SpeechRecognition || window.webkitSpeechRecognition || null;
    }

    // ---------------------------------------------------------
    // PUNTO DE ENTRADA / SALIDA (llamados desde script.js)
    // ---------------------------------------------------------
    function iniciar() {
        enlazarEventos();

        if (!obtenerConstructorReconocimiento()) {
            mostrarPantalla("noSoportado");
            return;
        }

        // Si ya había una sesión activa (el usuario navegó a otra sección
        // sin pulsar "Detener" y volvió), mostramos la pantalla en vivo
        // otra vez en lugar de reiniciar desde cero.
        mostrarPantalla(estado.activo ? "enVivo" : "intro");
    }

    function salir() {
        // Por privacidad, siempre apagamos el micrófono al salir de la
        // sección, aunque el usuario no haya pulsado "Detener".
        detenerEscucha();
        salirDeCine();

        const seccion = el("seccionSubtitulos");
        const activo = elementoPantallaCompletaActivo();
        if (activo && seccion && activo === seccion) {
            const salirFn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
            if (salirFn) salirFn.call(document);
        }
        estado.pantallaCompleta = false;
        if (seccion) seccion.classList.remove("quiz-fullscreen");
    }

    function mostrarPantalla(nombre) {
        const intro = el("subtitulosIntro");
        const enVivo = el("subtitulosEnVivo");
        const noSoportado = el("subtitulosNoSoportado");
        [intro, enVivo, noSoportado].forEach((s) => { if (s) s.classList.add("d-none"); });
        if (nombre === "intro" && intro) intro.classList.remove("d-none");
        if (nombre === "enVivo" && enVivo) enVivo.classList.remove("d-none");
        if (nombre === "noSoportado" && noSoportado) noSoportado.classList.remove("d-none");
    }

    // ---------------------------------------------------------
    // RECONOCIMIENTO DE VOZ
    // ---------------------------------------------------------
    function crearReconocimiento() {
        const Ctor = obtenerConstructorReconocimiento();
        if (!Ctor) return null;

        const r = new Ctor();
        r.lang = estado.idioma;
        r.continuous = true;
        r.interimResults = true;

        r.onresult = manejarResultado;
        r.onerror = manejarError;
        r.onend = manejarFin;

        return r;
    }

    function iniciarEscucha() {
        const selectIdioma = el("subtitulosSelectIdioma");
        if (selectIdioma) estado.idioma = selectIdioma.value || CONFIG.IDIOMA_POR_DEFECTO;

        estado.reconocimiento = crearReconocimiento();
        if (!estado.reconocimiento) {
            mostrarPantalla("noSoportado");
            return;
        }

        estado.activo = true;
        estado.lineasFinales = [];
        estado.textoInterino = "";
        renderizarTexto();
        actualizarEtiquetaIdioma();
        mostrarPantalla("enVivo");

        try {
            estado.reconocimiento.start();
        } catch (err) {
            console.warn("No se pudo iniciar el reconocimiento de voz:", err);
        }
    }

    function detenerEscucha() {
        estado.activo = false;
        if (estado.reconocimiento) {
            try {
                estado.reconocimiento.onend = null; // evitamos que se auto-reinicie al detenerlo a propósito
                estado.reconocimiento.stop();
            } catch (e) { /* noop */ }
            estado.reconocimiento = null;
        }
        mostrarPantalla("intro");
    }

    function manejarResultado(evento) {
        let interina = "";
        for (let i = evento.resultIndex; i < evento.results.length; i++) {
            const resultado = evento.results[i];
            const texto = resultado[0].transcript;
            if (resultado.isFinal) {
                agregarLineaFinal(texto.trim());
            } else {
                interina += texto;
            }
        }
        estado.textoInterino = interina;
        renderizarTexto();
    }

    function agregarLineaFinal(texto) {
        if (!texto) return;
        estado.lineasFinales.push(texto);
        if (estado.lineasFinales.length > CONFIG.MAX_LINEAS_HISTORIAL) {
            estado.lineasFinales.shift();
        }
    }

    function manejarError(evento) {
        console.warn("Error de reconocimiento de voz:", evento.error);
        if (evento.error === "not-allowed" || evento.error === "service-not-allowed") {
            estado.activo = false;
            alert("LSPedia necesita permiso para usar el micrófono para mostrar los subtítulos en tiempo real. Por favor, permite el acceso al micrófono e inténtalo de nuevo.");
            mostrarPantalla("intro");
        }
        // Otros errores (no-speech, network, aborted) se resuelven solos en
        // onend, reintentando automáticamente mientras estado.activo sea true.
    }

    function manejarFin() {
        // Chrome corta la sesión de reconocimiento tras un rato de silencio
        // o alrededor de 60s; si el usuario sigue con los subtítulos
        // activos, reiniciamos automáticamente para simular escucha continua.
        if (estado.activo && !estado._reinicioProgramado) {
            estado._reinicioProgramado = true;
            setTimeout(() => {
                estado._reinicioProgramado = false;
                if (estado.activo && estado.reconocimiento) {
                    try { estado.reconocimiento.start(); } catch (e) { /* ya estaba iniciado */ }
                }
            }, 300);
        }
    }

    // ---------------------------------------------------------
    // RENDER DEL TEXTO EN PANTALLA
    // ---------------------------------------------------------
    function renderizarTexto() {
        const contenedor = el("subtitulosTexto");
        if (!contenedor) return;

        if (estado.lineasFinales.length === 0 && !estado.textoInterino) {
            contenedor.innerHTML = '<span class="subtitulos-placeholder">Escuchando… acerca el celular al parlante de la película o de quien esté hablando.</span>';
            return;
        }

        const finales = estado.lineasFinales
            .map((linea) => `<div class="subtitulos-linea">${escaparHtml(linea)}</div>`)
            .join("");
        const interina = estado.textoInterino
            ? `<div class="subtitulos-linea subtitulos-interina">${escaparHtml(estado.textoInterino)}</div>`
            : "";

        contenedor.innerHTML = finales + interina;
        contenedor.scrollTop = contenedor.scrollHeight;
    }

    function escaparHtml(texto) {
        const div = document.createElement("div");
        div.textContent = texto;
        return div.innerHTML;
    }

    function actualizarEtiquetaIdioma() {
        const etiqueta = el("subtitulosIdiomaActual");
        if (!etiqueta) return;
        etiqueta.textContent = NOMBRES_IDIOMA[estado.idioma] || estado.idioma;
    }

    // ---------------------------------------------------------
    // TAMAÑO DE TEXTO (accesibilidad)
    // ---------------------------------------------------------
    function ajustarTamano(delta) {
        estado.tamanoIndex = Math.min(CONFIG.TAMANOS.length - 1, Math.max(0, estado.tamanoIndex + delta));
        aplicarTamano();
    }

    function aplicarTamano() {
        const contenedor = el("subtitulosTexto");
        if (!contenedor) return;
        CONFIG.TAMANOS.forEach((t) => contenedor.classList.remove("tam-" + t));
        contenedor.classList.add("tam-" + CONFIG.TAMANOS[estado.tamanoIndex]);
    }

    // ---------------------------------------------------------
    // MODO CINE (fondo negro, subtítulos en blanco, sin controles)
    // ---------------------------------------------------------
    function alternarCine() {
        estado.cine = !estado.cine;
        aplicarCine();
    }

    function salirDeCine() {
        estado.cine = false;
        aplicarCine();
    }

    function aplicarCine() {
        const seccion = el("seccionSubtitulos");
        if (seccion) seccion.classList.toggle("subtitulos-cine", estado.cine);
        const btn = el("btnSubtitulosCine");
        if (btn) btn.textContent = estado.cine ? "🎬 Salir de cine" : "🎬 Cine";
    }

    // ---------------------------------------------------------
    // PANTALLA COMPLETA (mismo patrón "pseudo-fullscreen" que
    // QuizV2 / AlfabetizacionV2, compatible con móviles)
    // ---------------------------------------------------------
    function elementoPantallaCompletaActivo() {
        return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
    }

    function alternarPantallaCompleta() {
        const seccion = el("seccionSubtitulos");
        if (!seccion) return;

        if (elementoPantallaCompletaActivo() || estado.pantallaCompleta) {
            const salirFn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
            if (elementoPantallaCompletaActivo() && salirFn) {
                salirFn.call(document);
            } else {
                estado.pantallaCompleta = false;
                seccion.classList.remove("quiz-fullscreen");
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

    // Alternativa para navegadores que no soportan pantalla completa en
    // este elemento (por ejemplo, Safari en iOS): simulamos el efecto
    // con estilos a pantalla completa dentro de la propia página.
    function activarPantallaCompletaSimulada() {
        const seccion = el("seccionSubtitulos");
        if (!seccion) return;
        estado.pantallaCompleta = true;
        seccion.classList.add("quiz-fullscreen");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function manejarCambioPantallaCompleta() {
        const seccion = el("seccionSubtitulos");
        const activo = !!elementoPantallaCompletaActivo();
        estado.pantallaCompleta = activo;
        if (seccion) seccion.classList.toggle("quiz-fullscreen", activo);
    }

    // ---------------------------------------------------------
    // EVENTOS
    // ---------------------------------------------------------
    function enlazarEventos() {
        // iniciar() se llama cada vez que se abre la sección: nos aseguramos
        // de registrar los listeners una sola vez para no duplicarlos.
        if (estado._eventosListos) return;

        const btnIniciar = el("btnSubtitulosIniciar");
        if (btnIniciar) btnIniciar.addEventListener("click", iniciarEscucha);

        const btnDetener = el("btnSubtitulosDetener");
        if (btnDetener) btnDetener.addEventListener("click", detenerEscucha);

        const btnMas = el("btnSubtitulosTextoMas");
        if (btnMas) btnMas.addEventListener("click", () => ajustarTamano(1));

        const btnMenos = el("btnSubtitulosTextoMenos");
        if (btnMenos) btnMenos.addEventListener("click", () => ajustarTamano(-1));

        const btnCine = el("btnSubtitulosCine");
        if (btnCine) btnCine.addEventListener("click", alternarCine);

        const btnSalirCine = el("btnSubtitulosSalirCine");
        if (btnSalirCine) btnSalirCine.addEventListener("click", salirDeCine);

        const btnFullscreen = el("btnSubtitulosFullscreen");
        if (btnFullscreen) btnFullscreen.addEventListener("click", alternarPantallaCompleta);

        ["fullscreenchange", "webkitfullscreenchange", "MSFullscreenChange"].forEach((evt) => {
            document.addEventListener(evt, manejarCambioPantallaCompleta);
        });

        aplicarTamano();

        // Aviso de compatibilidad en la pantalla de intro.
        const aviso = el("subtitulosAvisoCompat");
        if (aviso) {
            const soportado = !!obtenerConstructorReconocimiento();
            aviso.textContent = soportado
                ? "Funciona mejor en Google Chrome. Se te pedirá permiso para usar el micrófono."
                : "Este navegador no admite el reconocimiento de voz en vivo. Ábrelo en Google Chrome.";
        }

        estado._eventosListos = true;
    }

    return { iniciar, salir };

})();

// Se expone explícitamente en window: una declaración "const" de nivel
// superior NO se agrega automáticamente a window, así que sin esta línea
// script.js nunca podría ver ni llamar a SubtitulosV2.
window.SubtitulosV2 = SubtitulosV2;
