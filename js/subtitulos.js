/* ============================================================
   LSPedia - SUBTÍTULOS EN TIEMPO REAL (SubtitulosV2)
   ------------------------------------------------------------
   Módulo independiente (mismo patrón que QuizV2 y AlfabetizacionV2).
   Usa la Web Speech API del navegador para escuchar el audio
   ambiente a través del micrófono del dispositivo y mostrarlo como
   subtítulos en vivo, con pantalla completa real (overlay fijo),
   modo cine (fondo negro, texto blanco) y modo horizontal
   automático al rotar el celular, pensado para que una persona
   sorda pueda seguir una película, serie, TV o conversación.

   ⚠️ LIMITACIONES IMPORTANTES A TENER EN CUENTA:
   - Solo funciona bien en navegadores basados en Chromium (Chrome,
     Edge, Opera, Chrome Android). Safari/iOS y Firefox todavía no
     soportan bien (o nada) la Web Speech API.
   - El navegador NO puede "escuchar" el audio interno de otra app
     (Netflix, YouTube, un proyector de cine digital, etc.)
     directamente: usa el MICRÓFONO del dispositivo, así que capta
     el sonido que sale por el parlante de la sala/TV/cine. Por eso
     la distancia al parlante importa tanto (ver medidor de nivel).
   - La Web Speech API no permite ajustar manualmente la ganancia o
     los filtros de ruido del reconocimiento de voz en sí (Chrome
     administra internamente su propio audio para ese motor). El
     medidor de nivel usa una captura de audio aparte (Web Audio
     API) solo para MOSTRAR qué tan fuerte llega el sonido y ayudar
     a ubicar el celular; no puede "amplificar" lo que el motor de
     reconocimiento recibe.
   - Requiere conexión a internet y permiso de micrófono.
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
        MAX_CARACTERES_TEXTO: 420 // ventana de texto visible antes de recortar por el inicio
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
        textoAcumulado: "",      // texto ya confirmado, como párrafo corrido (no por líneas separadas)
        ultimaFraseFinal: "",    // para detectar repeticiones cuando el reconocimiento se reinicia solo
        textoInterino: "",
        _reinicioProgramado: false,
        _eventosListos: false
    };

    // Medidor de nivel de micrófono: usa su propia captura de audio,
    // separada del reconocimiento de voz, solo para retroalimentación visual.
    const estadoMedidor = {
        stream: null,
        audioCtx: null,
        analyser: null,
        datos: null,
        animId: null
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
        // Por privacidad, siempre apagamos el micrófono (reconocimiento Y
        // medidor de nivel) al salir de la sección, aunque el usuario no
        // haya pulsado "Detener".
        detenerEscucha();
        detenerMedidorNivel();
        salirDeCine();
        salirDePantallaCompleta();
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
        // NOTA IMPORTANTE (Android Chrome): continuous:true es poco fiable en
        // Android — suele pedir permiso, "arrancar", y no disparar ningún
        // resultado nunca (se queda escuchando en el vacío). Por eso se usa
        // continuous:false (una frase/pausa a la vez) y se reinicia solo en
        // onend/manejarFin(); así sí funciona en Android y sigue funcionando
        // igual de bien en Chrome de escritorio.
        r.continuous = false;
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
        estado.textoAcumulado = "";
        estado.ultimaFraseFinal = "";
        estado.textoInterino = "";
        renderizarTexto();
        actualizarEtiquetaIdioma();
        mostrarPantalla("enVivo");

        try {
            estado.reconocimiento.start();
        } catch (err) {
            console.warn("No se pudo iniciar el reconocimiento de voz:", err);
        }

        iniciarMedidorNivel();
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
        detenerMedidorNivel();
        mostrarPantalla("intro");
    }

    function manejarResultado(evento) {
        let interina = "";
        for (let i = evento.resultIndex; i < evento.results.length; i++) {
            const resultado = evento.results[i];
            const texto = resultado[0].transcript;
            if (resultado.isFinal) {
                agregarTextoFinal(texto.trim());
            } else {
                interina += texto;
            }
        }
        estado.textoInterino = interina;
        renderizarTexto();
    }

    // Normaliza una frase para comparar (minúsculas, sin espacios extra,
    // sin signos de puntuación) y así detectar repeticiones aunque
    // vengan con mayúsculas o puntuación distinta.
    function normalizar(texto) {
        return texto
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita tildes
            .replace(/[^\p{L}\p{N}\s]/gu, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    // Agrega una frase finalizada al texto corrido, evitando duplicados
    // consecutivos: cuando el reconocimiento se reinicia solo (por
    // silencio o límite de tiempo), a veces vuelve a "finalizar" la
    // misma frase que ya se había mostrado justo antes.
    function agregarTextoFinal(texto) {
        if (!texto) return;

        const normalizado = normalizar(texto);
        if (!normalizado) return;

        const normalizadoAnterior = normalizar(estado.ultimaFraseFinal);
        if (normalizado === normalizadoAnterior) {
            return; // repetición exacta de la frase anterior: se ignora
        }
        // También ignora el caso en que la nueva frase está totalmente
        // contenida al final del texto ya acumulado (repetición parcial
        // típica tras un reinicio del reconocimiento).
        const acumuladoNormalizado = normalizar(estado.textoAcumulado);
        if (normalizado.length > 2 && acumuladoNormalizado.endsWith(normalizado)) {
            return;
        }

        estado.ultimaFraseFinal = texto;
        estado.textoAcumulado = (estado.textoAcumulado + " " + texto).trim();

        // Mantenemos solo los últimos N caracteres, cortando por palabra
        // completa, para que actúe como subtítulos "en vivo" que van
        // avanzando en vez de crecer para siempre.
        if (estado.textoAcumulado.length > CONFIG.MAX_CARACTERES_TEXTO) {
            const recorte = estado.textoAcumulado.length - CONFIG.MAX_CARACTERES_TEXTO;
            const primerEspacio = estado.textoAcumulado.indexOf(" ", recorte);
            estado.textoAcumulado = primerEspacio !== -1
                ? estado.textoAcumulado.slice(primerEspacio + 1)
                : estado.textoAcumulado.slice(recorte);
        }
    }

    function manejarError(evento) {
        console.warn("Error de reconocimiento de voz:", evento.error);
        if (evento.error === "not-allowed" || evento.error === "service-not-allowed") {
            estado.activo = false;
            alert("LSPedia necesita permiso para usar el micrófono para mostrar los subtítulos en tiempo real. Por favor, permite el acceso al micrófono e inténtalo de nuevo.");
            mostrarPantalla("intro");
            return;
        }
        if (evento.error === "language-not-supported") {
            // Común en algunos Android: el motor de voz del teléfono no tiene
            // instalado ese idioma/variante exacta (ej. es-419).
            estado.activo = false;
            alert("El idioma seleccionado no está disponible en el motor de voz de este celular. Prueba con 'Español (Perú)' o 'Español (España)'.");
            mostrarPantalla("intro");
            return;
        }
        // Otros errores (no-speech, network, aborted) se resuelven solos en
        // onend, reintentando automáticamente mientras estado.activo sea true.
    }

    function manejarFin() {
        // Con continuous:false, cada sesión termina apenas se detecta una
        // pausa (o al terminar una frase); si el usuario sigue con los
        // subtítulos activos, reiniciamos casi de inmediato para que la
        // escucha se sienta continua, sin perder lo que se hable después.
        if (estado.activo && !estado._reinicioProgramado) {
            estado._reinicioProgramado = true;
            setTimeout(() => {
                estado._reinicioProgramado = false;
                if (estado.activo && estado.reconocimiento) {
                    try { estado.reconocimiento.start(); } catch (e) { /* ya estaba iniciado, se ignora */ }
                }
            }, 120);
        }
    }

    // ---------------------------------------------------------
    // RENDER DEL TEXTO EN PANTALLA (párrafo corrido: la palabra
    // detectada continúa en el mismo renglón y pasa sola al
    // siguiente cuando ya no cabe, en vez de forzar un salto de
    // línea por cada frase reconocida).
    // ---------------------------------------------------------
    function renderizarTexto() {
        const contenedor = el("subtitulosTexto");
        if (!contenedor) return;

        if (!estado.textoAcumulado && !estado.textoInterino) {
            contenedor.innerHTML = '<span class="subtitulos-placeholder">Escuchando… acerca el celular al parlante de la película o de quien esté hablando.</span>';
            return;
        }

        const interina = estado.textoInterino
            ? ` <span class="subtitulos-interina">${escaparHtml(estado.textoInterino)}</span>`
            : "";

        contenedor.innerHTML = escaparHtml(estado.textoAcumulado) + interina;
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
    // MEDIDOR DE NIVEL DE MICRÓFONO
    // Captura de audio aparte (Web Audio API) solo para mostrar qué
    // tan fuerte está llegando el sonido, y así ayudar al usuario a
    // ubicar el celular más cerca del parlante si la barra está baja.
    // ---------------------------------------------------------
    function iniciarMedidorNivel() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

        navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: true
            }
        }).then((stream) => {
            estadoMedidor.stream = stream;
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;

            estadoMedidor.audioCtx = new AudioCtx();
            const fuente = estadoMedidor.audioCtx.createMediaStreamSource(stream);
            estadoMedidor.analyser = estadoMedidor.audioCtx.createAnalyser();
            estadoMedidor.analyser.fftSize = 512;
            estadoMedidor.datos = new Uint8Array(estadoMedidor.analyser.frequencyBinCount);
            fuente.connect(estadoMedidor.analyser);

            actualizarMedidorNivel();
        }).catch((err) => {
            // Si falla (permiso denegado, sin micrófono, etc.) simplemente
            // no mostramos el medidor; el reconocimiento de voz igual
            // pide su propio permiso de micrófono por separado.
            console.warn("No se pudo iniciar el medidor de nivel de micrófono:", err);
        });
    }

    function actualizarMedidorNivel() {
        if (!estadoMedidor.analyser) return;

        estadoMedidor.analyser.getByteTimeDomainData(estadoMedidor.datos);
        let suma = 0;
        for (let i = 0; i < estadoMedidor.datos.length; i++) {
            const valor = (estadoMedidor.datos[i] - 128) / 128;
            suma += valor * valor;
        }
        const rms = Math.sqrt(suma / estadoMedidor.datos.length); // 0..1 aprox
        const porcentaje = Math.min(100, Math.round(rms * 260));

        const barra = el("subtitulosMedidorBarra");
        if (barra) barra.style.width = porcentaje + "%";

        estadoMedidor.animId = requestAnimationFrame(actualizarMedidorNivel);
    }

    function detenerMedidorNivel() {
        if (estadoMedidor.animId) {
            cancelAnimationFrame(estadoMedidor.animId);
            estadoMedidor.animId = null;
        }
        if (estadoMedidor.stream) {
            estadoMedidor.stream.getTracks().forEach((t) => t.stop());
            estadoMedidor.stream = null;
        }
        if (estadoMedidor.audioCtx) {
            estadoMedidor.audioCtx.close().catch(() => {});
            estadoMedidor.audioCtx = null;
        }
        estadoMedidor.analyser = null;
        estadoMedidor.datos = null;

        const barra = el("subtitulosMedidorBarra");
        if (barra) barra.style.width = "0%";
    }

    // ---------------------------------------------------------
    // MODO CINE (fondo negro, subtítulos en blanco, sin controles)
    // ---------------------------------------------------------
    function alternarCine() {
        estado.cine = !estado.cine;
        actualizarModoInmersivo();
    }

    function salirDeCine() {
        estado.cine = false;
        actualizarModoInmersivo();
    }

    // El modo "inmersivo" (pantalla negra sin controles) se activa si
    // el usuario prendió el modo cine, si está en pantalla completa, o
    // ambos: cualquiera de los dos oculta el encabezado y los botones.
    function actualizarModoInmersivo() {
        const seccion = el("seccionSubtitulos");
        const inmersivo = estado.cine || estado.pantallaCompleta;
        if (seccion) seccion.classList.toggle("subtitulos-inmersivo", inmersivo);

        const btnCine = el("btnSubtitulosCine");
        if (btnCine) btnCine.textContent = estado.cine ? "🎬 Salir de cine" : "🎬 Cine";
    }

    // ---------------------------------------------------------
    // PANTALLA COMPLETA REAL (overlay fijo que cubre todo el
    // viewport; usa la API nativa cuando está disponible y, si no,
    // recurre al mismo efecto simulado con CSS position:fixed, para
    // que en móviles quede realmente a pantalla completa).
    // ---------------------------------------------------------
    function elementoPantallaCompletaActivo() {
        return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
    }

    function alternarPantallaCompleta() {
        if (estado.pantallaCompleta) {
            salirDePantallaCompleta();
            return;
        }

        const seccion = el("seccionSubtitulos");
        if (!seccion) return;

        const solicitarFn = seccion.requestFullscreen || seccion.webkitRequestFullscreen || seccion.msRequestFullscreen;
        if (solicitarFn) {
            Promise.resolve(solicitarFn.call(seccion)).then(activarPantallaCompleta).catch(activarPantallaCompleta);
        } else {
            activarPantallaCompleta();
        }
    }

    function activarPantallaCompleta() {
        const seccion = el("seccionSubtitulos");
        estado.pantallaCompleta = true;
        if (seccion) seccion.classList.add("quiz-fullscreen");
        document.body.classList.add("subtitulos-bloquear-scroll");
        actualizarModoInmersivo();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function salirDePantallaCompleta() {
        const seccion = el("seccionSubtitulos");
        estado.pantallaCompleta = false;
        if (seccion) seccion.classList.remove("quiz-fullscreen");
        document.body.classList.remove("subtitulos-bloquear-scroll");
        actualizarModoInmersivo();

        const salirFn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (elementoPantallaCompletaActivo() && salirFn) {
            salirFn.call(document);
        }
    }

    // Mantiene el estado sincronizado si el usuario sale de pantalla
    // completa con Esc, el gesto del navegador, etc.
    function manejarCambioPantallaCompleta() {
        if (!elementoPantallaCompletaActivo() && estado.pantallaCompleta) {
            // Ya salió de la pantalla completa nativa; limpiamos nuestro estado.
            const seccion = el("seccionSubtitulos");
            estado.pantallaCompleta = false;
            if (seccion) seccion.classList.remove("quiz-fullscreen");
            document.body.classList.remove("subtitulos-bloquear-scroll");
            actualizarModoInmersivo();
        }
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
        if (btnSalirCine) btnSalirCine.addEventListener("click", () => {
            // El botón flotante de "Salir" en modo inmersivo cierra TODO
            // (cine y pantalla completa) de un solo toque.
            salirDeCine();
            salirDePantallaCompleta();
        });

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