/* ============================================================
   LSPedia - SUBTÍTULOS EN TIEMPO REAL (SubtitulosV2)
   ------------------------------------------------------------
   Módulo independiente (mismo patrón que QuizV2 y AlfabetizacionV2).
   Usa la Web Speech API del navegador para escuchar el audio
   ambiente a través del micrófono del dispositivo y mostrarlo como
   subtítulos en vivo, con pantalla completa real (overlay fijo) que
   ya se ve tipo "cine" (fondo negro, texto blanco grande) sin
   necesitar un modo aparte, más un botón para copiar toda la
   transcripción y otro para resaltar en color la palabra que se
   está reconociendo en ese momento. Pensado para que una persona
   sorda pueda seguir una película, serie, TV o conversación.

   ⚠️ LIMITACIONES IMPORTANTES A TENER EN CUENTA:
   - Solo funciona bien en navegadores basados en Chromium (Chrome,
     Edge, Opera, Chrome Android). Safari/iOS y Firefox todavía no
     soportan bien (o nada) la Web Speech API.
   - El navegador NO puede "escuchar" el audio interno de otra app
     (Netflix, YouTube, un proyector de cine digital, etc.)
     directamente: usa el MICRÓFONO del dispositivo, así que capta
     el sonido que sale por el parlante de la sala/TV/cine. Por eso
     la distancia al parlante importa tanto: mientras más cerca del
     parlante esté el celular, mejor se transcribe.
   - IMPORTANTE (Android): en versiones anteriores este módulo abría
     un segundo flujo de micrófono (getUserMedia) en paralelo al que
     usa el reconocimiento de voz, para mostrar un medidor de nivel.
     En varios Android eso impedía que el reconocimiento capturara
     audio real (pedía permiso pero nunca transcribía), porque el
     sistema solo entrega el micrófono a una app/proceso a la vez.
     Por eso se quitó: ahora SOLO el reconocimiento de voz usa el
     micrófono.
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
        MAX_CARACTERES_TEXTO: 420, // ventana de texto visible antes de recortar por el inicio
        COLORES_RESALTADO: ["verde", "amarillo", "azul"]
    };

    const COLOR_INFO = {
        verde: { emoji: "🟢", nombre: "Verde" },
        amarillo: { emoji: "🟡", nombre: "Amarillo" },
        azul: { emoji: "🔵", nombre: "Azul" }
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
        pantallaCompleta: false,
        tamanoIndex: CONFIG.TAMANO_INICIAL_INDEX,
        colorResaltado: "verde",
        textoAcumulado: "",      // ventana visible en pantalla (se recorta para no crecer sin límite)
        textoCompleto: "",       // transcripción completa de toda la sesión, sin recortar (para "Guardar")
        ultimaFraseFinal: "",    // para detectar repeticiones cuando el reconocimiento se reinicia solo
        textoInterino: "",
        _reinicioProgramado: false,
        _eventosListos: false,
        _flashTextoNuevo: false, // dispara la animación de "llegada" del texto (ver renderizarTexto)
        // SUBTITULOS_V3_ESTABLE_20260909
        pausado: false,
        _ultimoError: "",
        _intentosReinicio: 0,
        _timeoutReinicio: null,
        wakeLock: null,
        // --- Medidor de nivel de audio (pantalla intro, ver más abajo) ---
        medidor: {
            activo: false,
            stream: null,
            audioContext: null,
            analyser: null,
            datos: null,
            rafId: null
        }
    };

    function el(id) { return document.getElementById(id); }


    // ---------------------------------------------------------
    // INTERFAZ V3: guía visual, estado del motor y pausa/reanudar.
    // Se crea desde JS para mantener el HTML principal más liviano.
    // ---------------------------------------------------------
    function asegurarMejorasInterfaz() {
        const introCard = document.querySelector("#subtitulosIntro .card");
        if (introCard && !introCard.querySelector(".subtitulos-intro-hero-v3")) {
            const hero = document.createElement("div");
            hero.className = "subtitulos-intro-hero-v3";
            hero.innerHTML = `
                <div class="subtitulos-hero-icono" aria-hidden="true">CC</div>
                <div class="subtitulos-hero-textos">
                    <span class="subtitulos-hero-eyebrow">ACCESIBILIDAD EN TIEMPO REAL</span>
                    <h3>Convierte voz en texto al instante</h3>
                    <p>Acerca el celular a quien habla o al parlante y sigue la conversación en pantalla.</p>
                </div>
                <div class="subtitulos-pasos-v3" aria-label="Cómo usar Subtítulos">
                    <span><b>1</b> Prueba el audio</span>
                    <span><b>2</b> Elige idioma</span>
                    <span><b>3</b> Inicia</span>
                </div>`;
            introCard.insertBefore(hero, introCard.firstChild);
        }

        const barra = el("subtitulosBarraControles");
        if (barra && !el("subtitulosEstadoMotor")) {
            const grupoIzq = barra.firstElementChild || barra;
            const estadoMotor = document.createElement("span");
            estadoMotor.id = "subtitulosEstadoMotor";
            estadoMotor.className = "subtitulos-estado-motor estado-listo";
            estadoMotor.innerHTML = '<i aria-hidden="true"></i><span>Listo</span>';
            grupoIzq.appendChild(estadoMotor);
        }

        const inferiores = el("subtitulosControlesInferiores");
        if (inferiores && !el("btnSubtitulosPausar")) {
            const btn = document.createElement("button");
            btn.id = "btnSubtitulosPausar";
            btn.type = "button";
            btn.className = "btn subtitulos-btn-pausa fw-bold rounded-pill px-4 me-2";
            btn.innerHTML = '<span aria-hidden="true">⏸</span> Pausar';
            btn.title = "Pausar temporalmente el micrófono";
            inferiores.insertBefore(btn, inferiores.firstChild);
        }

        const btnIniciar = el("btnSubtitulosIniciar");
        if (btnIniciar) {
            btnIniciar.innerHTML = '🎙️ Iniciar subtítulos <span class="subtitulos-icono-grabar" aria-hidden="true"></span>';
        }
    }

    function actualizarEstadoMotor(tipo, textoPersonalizado) {
        const chip = el("subtitulosEstadoMotor");
        if (!chip) return;
        const info = {
            listo: ["Listo", "estado-listo"],
            escuchando: ["Escuchando", "estado-escuchando"],
            reconectando: ["Reconectando…", "estado-reconectando"],
            pausado: ["Pausado", "estado-pausado"],
            error: ["Revisa el micrófono", "estado-error"]
        }[tipo] || ["Listo", "estado-listo"];
        chip.className = "subtitulos-estado-motor " + info[1];
        chip.innerHTML = '<i aria-hidden="true"></i><span>' + (textoPersonalizado || info[0]) + '</span>';
        const seccion = el("seccionSubtitulos");
        if (seccion) seccion.dataset.estadoSubtitulos = tipo;
    }

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
        asegurarMejorasInterfaz();
        enlazarEventos();
        actualizarEstadoMotor(estado.activo ? (estado.pausado ? "pausado" : "escuchando") : "listo");

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
        detenerMedidorNivel();
        salirDePantallaCompleta();
    }

    function mostrarPantalla(nombre) {
        const intro = el("subtitulosIntro");
        const enVivo = el("subtitulosEnVivo");
        const noSoportado = el("subtitulosNoSoportado");
        [intro, enVivo, noSoportado].forEach((s) => { if (s) s.classList.add("d-none"); });
        // Reutilizamos la misma animación de entrada suave que ya usa el
        // Quiz (.quiz-fade-in, definida en quiz.css) para que cambiar de
        // pantalla dentro de Subtítulos se sienta igual de moderno.
        const activa = nombre === "intro" ? intro : nombre === "enVivo" ? enVivo : nombre === "noSoportado" ? noSoportado : null;
        if (activa) {
            activa.classList.remove("d-none");
            activa.classList.remove("quiz-fade-in");
            void activa.offsetWidth; // reinicia la animación aunque se repita la misma pantalla
            activa.classList.add("quiz-fade-in");
        }
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
        r.maxAlternatives = 1;

        r.onresult = manejarResultado;
        r.onerror = manejarError;
        r.onend = manejarFin;

        return r;
    }

    function arrancarReconocimientoNuevo() {
        if (!estado.activo || estado.pausado) return;

        const reconocimiento = crearReconocimiento();
        if (!reconocimiento) {
            estado.activo = false;
            mostrarPantalla("noSoportado");
            return;
        }

        estado.reconocimiento = reconocimiento;
        actualizarEstadoMotor("escuchando");
        try {
            reconocimiento.start();
        } catch (err) {
            console.warn("No se pudo iniciar el reconocimiento de voz:", err);
            estado.reconocimiento = null;
            estado._ultimoError = "aborted";
            programarReinicioReconocimiento();
        }
    }

    function iniciarEscucha() {
        detenerMedidorNivel();

        const selectIdioma = el("subtitulosSelectIdioma");
        if (selectIdioma) estado.idioma = selectIdioma.value || CONFIG.IDIOMA_POR_DEFECTO;

        if (!obtenerConstructorReconocimiento()) {
            mostrarPantalla("noSoportado");
            return;
        }

        clearTimeout(estado._timeoutReinicio);
        estado._timeoutReinicio = null;
        estado.activo = true;
        estado.pausado = false;
        estado._ultimoError = "";
        estado._intentosReinicio = 0;
        estado.textoAcumulado = "";
        estado.textoCompleto = "";
        estado.ultimaFraseFinal = "";
        estado.textoInterino = "";
        renderizarTexto();
        actualizarEtiquetaIdioma();
        actualizarBotonPausa();
        mostrarPantalla("enVivo");
        actualizarEstadoMotor("escuchando");
        solicitarWakeLock();
        arrancarReconocimientoNuevo();
    }

    function detenerMotorActual() {
        if (!estado.reconocimiento) return;
        const r = estado.reconocimiento;
        estado.reconocimiento = null;
        try {
            r.onend = null;
            r.onerror = null;
            r.stop();
        } catch (e) { /* noop */ }
    }

    function detenerEscucha() {
        estado.activo = false;
        estado.pausado = false;
        estado._ultimoError = "";
        estado._intentosReinicio = 0;
        clearTimeout(estado._timeoutReinicio);
        estado._timeoutReinicio = null;
        detenerMotorActual();
        liberarWakeLock();
        actualizarBotonPausa();
        actualizarEstadoMotor("listo");
        mostrarPantalla("intro");
    }

    function alternarPausa() {
        if (!estado.activo) return;
        if (!estado.pausado) {
            estado.pausado = true;
            clearTimeout(estado._timeoutReinicio);
            estado._timeoutReinicio = null;
            detenerMotorActual();
            liberarWakeLock();
            actualizarEstadoMotor("pausado");
            actualizarBotonPausa();
            return;
        }

        estado.pausado = false;
        estado._ultimoError = "";
        estado._intentosReinicio = 0;
        actualizarBotonPausa();
        actualizarEstadoMotor("escuchando");
        solicitarWakeLock();
        arrancarReconocimientoNuevo();
    }

    function actualizarBotonPausa() {
        const btn = el("btnSubtitulosPausar");
        if (!btn) return;
        if (estado.pausado) {
            btn.classList.add("esta-pausado");
            btn.innerHTML = '<span aria-hidden="true">▶</span> Reanudar';
            btn.title = "Reanudar los subtítulos";
        } else {
            btn.classList.remove("esta-pausado");
            btn.innerHTML = '<span aria-hidden="true">⏸</span> Pausar';
            btn.title = "Pausar temporalmente el micrófono";
        }
    }

    // ---------------------------------------------------------
    // MEDIDOR DE NIVEL DE AUDIO AMBIENTE (solo pantalla intro)
    // ------------------------------------------------------------
    // Objetivo: antes de iniciar la escucha real, dejar que el usuario
    // vea si el celular está captando suficiente volumen del parlante
    // del cine (o de quien esté hablando) y ajuste la posición.
    //
    // ⚠️ Usa su PROPIO stream de micrófono (getUserMedia), separado del
    // que usará después SpeechRecognition. Por eso:
    //   - Solo se activa cuando el usuario pulsa "Probar nivel de audio"
    //     en la pantalla intro, nunca junto con el reconocimiento real.
    //   - Se apaga automáticamente al pulsar "Activar micrófono y
    //     empezar" (iniciarEscucha) y al salir de la sección (salir()),
    //     para no competir por el micrófono con SpeechRecognition en
    //     Android (mismo motivo por el que se quitó el medidor anterior
    //     que corría en paralelo al reconocimiento; ver notas arriba).
    // ---------------------------------------------------------
    function medidorSoportado() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.AudioContext || window.webkitAudioContext);
    }

    function iniciarMedidorNivel() {
        if (estado.medidor.activo) return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            actualizarEtiquetaMedidor("Tu navegador no admite probar el nivel de audio aquí.", "bajo");
            return;
        }

        const btnProbar = el("btnSubtitulosProbarNivel");
        const cajaMedidor = el("subtitulosMedidorNivel");
        if (btnProbar) { btnProbar.disabled = true; btnProbar.textContent = "🎚️ Conectando micrófono…"; }

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                // El usuario pudo haber cambiado de pantalla mientras se
                // esperaba el permiso; si ya no corresponde, cerramos el
                // stream inmediatamente sin mostrar nada.
                if (!el("subtitulosIntro") || el("subtitulosIntro").classList.contains("d-none")) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                const Ctor = window.AudioContext || window.webkitAudioContext;
                const audioContext = new Ctor();
                const fuente = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = 0.6;
                fuente.connect(analyser);

                estado.medidor.activo = true;
                estado.medidor.stream = stream;
                estado.medidor.audioContext = audioContext;
                estado.medidor.analyser = analyser;
                estado.medidor.datos = new Uint8Array(analyser.frequencyBinCount);

                if (btnProbar) { btnProbar.classList.add("d-none"); }
                if (cajaMedidor) { cajaMedidor.classList.remove("d-none"); }

                bucleMedidor();
            })
            .catch((err) => {
                console.warn("No se pudo abrir el micrófono para el medidor de nivel:", err);
                if (btnProbar) { btnProbar.disabled = false; btnProbar.textContent = "🎚️ Probar nivel de audio"; }
                actualizarEtiquetaMedidor("No se pudo acceder al micrófono. Revisa los permisos del navegador.", "bajo");
                if (cajaMedidor) cajaMedidor.classList.remove("d-none");
            });
    }

    function bucleMedidor() {
        if (!estado.medidor.activo || !estado.medidor.analyser) return;

        estado.medidor.analyser.getByteTimeDomainData(estado.medidor.datos);

        // RMS (root-mean-square) del buffer de forma de onda: una medida
        // simple y estable del volumen general captado, de 0 a ~1.
        let sumaCuadrados = 0;
        for (let i = 0; i < estado.medidor.datos.length; i++) {
            const muestra = (estado.medidor.datos[i] - 128) / 128;
            sumaCuadrados += muestra * muestra;
        }
        const rms = Math.sqrt(sumaCuadrados / estado.medidor.datos.length);

        // Escalamos el RMS (típicamente pequeño, ~0 a 0.3 en voz/ambiente
        // normal) a un porcentaje 0-100 más expresivo para la barra.
        const porcentaje = Math.min(100, Math.round(rms * 100 * 3.2));

        const barra = el("subtitulosMedidorBarra");
        let nivel = "bajo";
        if (porcentaje >= 55) nivel = "bien";
        else if (porcentaje >= 25) nivel = "regular";

        if (barra) {
            barra.style.width = porcentaje + "%";
            barra.classList.remove("nivel-regular", "nivel-bien");
            if (nivel === "regular") barra.classList.add("nivel-regular");
            if (nivel === "bien") barra.classList.add("nivel-bien");
        }

        const MENSAJES_NIVEL = {
            bajo: "🔴 Muy bajo — acerca más el celular al parlante o sube el volumen.",
            regular: "🟡 Regular — puede funcionar, pero mejor acércalo un poco más.",
            bien: "🟢 ¡Bien! Este nivel debería transcribirse correctamente."
        };
        actualizarEtiquetaMedidor(MENSAJES_NIVEL[nivel], nivel);

        estado.medidor.rafId = requestAnimationFrame(bucleMedidor);
    }

    function actualizarEtiquetaMedidor(texto, nivel) {
        const etiqueta = el("subtitulosMedidorEtiqueta");
        if (!etiqueta) return;
        etiqueta.textContent = texto;
        etiqueta.classList.remove("etiqueta-bajo", "etiqueta-regular", "etiqueta-bien");
        etiqueta.classList.add("etiqueta-" + nivel);
    }

    function detenerMedidorNivel() {
        if (estado.medidor.rafId) {
            cancelAnimationFrame(estado.medidor.rafId);
            estado.medidor.rafId = null;
        }
        if (estado.medidor.stream) {
            estado.medidor.stream.getTracks().forEach((t) => t.stop());
            estado.medidor.stream = null;
        }
        if (estado.medidor.audioContext) {
            try { estado.medidor.audioContext.close(); } catch (e) { /* noop */ }
            estado.medidor.audioContext = null;
        }
        estado.medidor.analyser = null;
        estado.medidor.datos = null;
        estado.medidor.activo = false;

        // Reset visual: vuelve a mostrarse el botón "Probar nivel de audio"
        // listo para la próxima vez que se entre a esta pantalla.
        const btnProbar = el("btnSubtitulosProbarNivel");
        const cajaMedidor = el("subtitulosMedidorNivel");
        const barra = el("subtitulosMedidorBarra");
        if (btnProbar) { btnProbar.disabled = false; btnProbar.textContent = "🎚️ Probar nivel de audio"; btnProbar.classList.remove("d-none"); }
        if (cajaMedidor) cajaMedidor.classList.add("d-none");
        if (barra) { barra.style.width = "0%"; barra.classList.remove("nivel-regular", "nivel-bien"); }
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
        estado._ultimoError = "";
        estado._intentosReinicio = 0;
        if (estado.activo && !estado.pausado) actualizarEstadoMotor("escuchando");
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
        estado.textoCompleto = (estado.textoCompleto + " " + texto).trim();
        // Marca que hay una frase final nueva, para que renderizarTexto()
        // dispare una pequeña animación de "llegada" (ver CSS
        // .subtitulos-texto-nuevo) solo cuando de verdad cambia el texto
        // confirmado, no en cada actualización del texto interino.
        estado._flashTextoNuevo = true;

        // Mantenemos solo los últimos N caracteres EN PANTALLA (textoAcumulado),
        // cortando por palabra completa, para que actúe como subtítulos "en
        // vivo" que van avanzando en vez de crecer para siempre. textoCompleto
        // en cambio NUNCA se recorta: guarda toda la sesión para "Guardar".
        if (estado.textoAcumulado.length > CONFIG.MAX_CARACTERES_TEXTO) {
            const recorte = estado.textoAcumulado.length - CONFIG.MAX_CARACTERES_TEXTO;
            const primerEspacio = estado.textoAcumulado.indexOf(" ", recorte);
            estado.textoAcumulado = primerEspacio !== -1
                ? estado.textoAcumulado.slice(primerEspacio + 1)
                : estado.textoAcumulado.slice(recorte);
        }
    }

    function manejarError(evento) {
        const error = evento && evento.error ? evento.error : "unknown";
        estado._ultimoError = error;
        console.warn("Error de reconocimiento de voz:", error);

        if (error === "not-allowed" || error === "service-not-allowed") {
            estado.activo = false;
            actualizarEstadoMotor("error", "Micrófono bloqueado");
            liberarWakeLock();
            alert("LSPedia necesita permiso para usar el micrófono. Permite el acceso desde el navegador e inténtalo de nuevo.");
            mostrarPantalla("intro");
            return;
        }

        if (error === "language-not-supported") {
            estado.activo = false;
            actualizarEstadoMotor("error", "Idioma no disponible");
            liberarWakeLock();
            alert("El idioma seleccionado no está disponible en el motor de voz de este celular. Prueba con 'Español (Perú)' o 'Español (España)'.");
            mostrarPantalla("intro");
            return;
        }

        if (error === "audio-capture") {
            estado.activo = false;
            actualizarEstadoMotor("error", "No se detecta micrófono");
            liberarWakeLock();
            alert("No se pudo usar el micrófono. Comprueba que no esté siendo usado por otra aplicación y vuelve a intentarlo.");
            mostrarPantalla("intro");
            return;
        }

        if (error === "network") {
            actualizarEstadoMotor("reconectando", "Conexión inestable…");
        } else if (error !== "no-speech" && estado.activo && !estado.pausado) {
            actualizarEstadoMotor("reconectando");
        }
        // onend llamará a programarReinicioReconocimiento().
    }

    function programarReinicioReconocimiento() {
        if (!estado.activo || estado.pausado || estado._reinicioProgramado) return;

        estado._reinicioProgramado = true;
        clearTimeout(estado._timeoutReinicio);

        let espera = 120;
        if (estado._ultimoError === "no-speech") {
            espera = 140;
        } else if (estado._ultimoError === "network") {
            // Backoff progresivo: 0.9s, 1.8s, 3.6s y máximo 5s.
            espera = Math.min(5000, 900 * Math.pow(2, Math.min(estado._intentosReinicio, 3)));
            estado._intentosReinicio += 1;
            actualizarEstadoMotor("reconectando", estado._intentosReinicio >= 3 ? "Reconectando a voz…" : "Conexión inestable…");
        } else if (estado._ultimoError === "aborted") {
            espera = 260;
        }

        estado._timeoutReinicio = setTimeout(() => {
            estado._reinicioProgramado = false;
            estado._timeoutReinicio = null;
            if (!estado.activo || estado.pausado) return;
            arrancarReconocimientoNuevo();
        }, espera);
    }

    function manejarFin() {
        estado.reconocimiento = null;
        programarReinicioReconocimiento();
    }

    // Mantiene la pantalla encendida durante una sesión larga cuando el
    // navegador soporta Screen Wake Lock. Si no existe, no altera nada.
    async function solicitarWakeLock() {
        if (!("wakeLock" in navigator) || !estado.activo || estado.pausado || document.visibilityState !== "visible") return;
        if (estado.wakeLock) return;
        try {
            const lock = await navigator.wakeLock.request("screen");
            estado.wakeLock = lock;
            lock.addEventListener("release", () => {
                if (estado.wakeLock === lock) estado.wakeLock = null;
            });
        } catch (e) {
            // No todos los móviles permiten Wake Lock; no es un error crítico.
        }
    }

    function liberarWakeLock() {
        const lock = estado.wakeLock;
        estado.wakeLock = null;
        if (lock && typeof lock.release === "function") {
            Promise.resolve(lock.release()).catch(() => {});
        }
    }

    function manejarVisibilidadDocumento() {
        if (document.visibilityState === "visible" && estado.activo && !estado.pausado) {
            solicitarWakeLock();
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
            ? ` <span class="subtitulos-interina color-${estado.colorResaltado}">${escaparHtml(estado.textoInterino)}</span>`
            : "";

        contenedor.innerHTML = escaparHtml(estado.textoAcumulado) + interina;

        // El bloque de texto (.subtitulos-texto) crece centrado en la
        // pantalla hasta un máximo de 4 líneas (max-height en CSS); si el
        // contenido excede esas 4 líneas, se vuelve desplazable y este
        // scrollTop lo ancla siempre al final, para que la frase más
        // reciente quede visible y lo más viejo se "recorte" solo por
        // arriba, sin que el usuario tenga que deslizar nada a mano.
        contenedor.scrollTop = contenedor.scrollHeight;

        // Pequeño "destello" de entrada cuando se confirma una frase nueva
        // (ver .subtitulos-texto-nuevo en subtitulos.css): se reinicia la
        // animación quitando y volviendo a poner la clase.
        if (estado._flashTextoNuevo) {
            estado._flashTextoNuevo = false;
            contenedor.classList.remove("subtitulos-texto-nuevo");
            void contenedor.offsetWidth;
            contenedor.classList.add("subtitulos-texto-nuevo");
        }
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
    // GUARDAR / COPIAR TODA LA TRANSCRIPCIÓN
    // ---------------------------------------------------------
    function copiarTranscripcion() {
        const texto = estado.textoCompleto.trim();
        if (!texto) {
            alert("Todavía no se ha transcrito ningún subtítulo para copiar.");
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto)
                .then(mostrarConfirmacionGuardado)
                .catch(() => copiarConFallback(texto));
        } else {
            copiarConFallback(texto);
        }
    }

    // Respaldo para navegadores/contextos sin permiso de portapapeles
    // moderno: crea un textarea temporal, lo selecciona y usa el comando
    // de copiar clásico del navegador.
    function copiarConFallback(texto) {
        const textarea = document.createElement("textarea");
        textarea.value = texto;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            document.execCommand("copy");
            mostrarConfirmacionGuardado();
        } catch (e) {
            alert("No se pudo copiar automáticamente. Mantén presionado el texto de los subtítulos para copiarlo manualmente.");
        }
        document.body.removeChild(textarea);
    }

    function mostrarConfirmacionGuardado() {
        const btn = el("btnSubtitulosGuardar");
        if (!btn) return;
        const original = btn.innerHTML;
        btn.innerHTML = "✅ Copiado";
        setTimeout(() => { btn.innerHTML = original; }, 1800);
    }

    // ---------------------------------------------------------
    // BORRAR TEXTO EN PANTALLA
    // Limpia tanto la ventana visible (textoAcumulado/textoInterino)
    // como la transcripción completa que usa "Guardar" (textoCompleto):
    // así "Guardar" nunca copia texto que el usuario ya borró a propósito.
    // La escucha sigue activa; solo se limpia la pantalla para volver a
    // empezar "en blanco" sin tener que pulsar "Detener".
    // ---------------------------------------------------------
    function borrarTexto() {
        estado.textoAcumulado = "";
        estado.textoCompleto = "";
        estado.textoInterino = "";
        estado.ultimaFraseFinal = "";
        renderizarTexto();
        mostrarConfirmacionBorrado();
    }

    function mostrarConfirmacionBorrado() {
        const btn = el("btnSubtitulosBorrar");
        if (!btn) return;
        const original = btn.innerHTML;
        btn.innerHTML = "✅";
        btn.disabled = true;
        setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 900);
    }

    // ---------------------------------------------------------
    // COLOR DE LA PALABRA EN TIEMPO REAL
    // La Web Speech API no da marcas de tiempo por palabra, solo un texto
    // "interino" que va creciendo mientras se reconoce la frase; por eso el
    // resaltado de color se aplica a ese fragmento interino completo (lo
    // más cercano posible a "lo que se está diciendo ahora mismo"), y el
    // resto del texto ya confirmado se queda en blanco.
    // ---------------------------------------------------------
    function alternarColorResaltado() {
        const lista = CONFIG.COLORES_RESALTADO;
        const idx = lista.indexOf(estado.colorResaltado);
        estado.colorResaltado = lista[(idx + 1) % lista.length];
        actualizarBotonColor();
        renderizarTexto();
    }

    function actualizarBotonColor() {
        const btn = el("btnSubtitulosColor");
        if (!btn) return;
        const info = COLOR_INFO[estado.colorResaltado];
        btn.textContent = info.emoji;
        btn.title = "Color de la palabra en vivo: " + info.nombre + " (toca para cambiar)";
    }

    // El modo "inmersivo" (pantalla negra sin controles, solo los
    // subtítulos y los botones flotantes) se activa al entrar a pantalla
    // completa.
    function actualizarModoInmersivo() {
        const seccion = el("seccionSubtitulos");
        if (seccion) seccion.classList.toggle("subtitulos-inmersivo", estado.pantallaCompleta);
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
        intentarBloquearHorizontal();
        window.scrollTo({ top: 0, behavior: "smooth" });
        aplicarEspacioAvisoNativoFullscreen(seccion, true);
    }

    function salirDePantallaCompleta() {
        const seccion = el("seccionSubtitulos");
        estado.pantallaCompleta = false;
        if (seccion) seccion.classList.remove("quiz-fullscreen");
        document.body.classList.remove("subtitulos-bloquear-scroll");
        actualizarModoInmersivo();
        intentarLiberarOrientacion();
        aplicarEspacioAvisoNativoFullscreen(seccion, false);

        const salirFn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (elementoPantallaCompletaActivo() && salirFn) {
            salirFn.call(document);
        }
    }

    // Al entrar a la pantalla completa NATIVA (no la simulada), Chrome
    // en Android muestra unos segundos su propio aviso ("Para salir de
    // pantalla completa, arrastra desde la parte superior...") pegado a
    // la parte de abajo de la pantalla, que puede tapar controles si
    // quedan al fondo. Mientras dura ese aviso, le damos un margen extra
    // abajo a la sección para que no quede tapado ningún control (mismo
    // patrón que quiz.js/alfabetizacion.js).
    function aplicarEspacioAvisoNativoFullscreen(seccion, activo) {
        if (!seccion) return;
        clearTimeout(estado._timeoutAvisoFullscreen);
        if (activo) {
            seccion.style.paddingBottom = "110px";
            estado._timeoutAvisoFullscreen = setTimeout(() => {
                seccion.style.paddingBottom = "";
            }, 3500);
        } else {
            seccion.style.paddingBottom = "";
        }
    }

    // Fuerza la orientación horizontal en pantalla completa, para que los
    // subtítulos se vean grandes y centrados como pide el usuario. Solo
    // funciona de forma confiable en Chrome Android y requiere pantalla
    // completa NATIVA (no la simulada de Safari/iOS); en cualquier otro
    // caso falla en silencio y el celular se queda en la orientación en la
    // que esté — el CSS de subtitulos.css igual se adapta solo con
    // "@media (orientation: landscape)" cuando el usuario rota a mano.
    function intentarBloquearHorizontal() {
        if (screen.orientation && typeof screen.orientation.lock === "function") {
            screen.orientation.lock("landscape").catch(() => { /* no soportado en este navegador/estado */ });
        }
    }

    function intentarLiberarOrientacion() {
        if (screen.orientation && typeof screen.orientation.unlock === "function") {
            try { screen.orientation.unlock(); } catch (e) { /* noop */ }
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
            aplicarEspacioAvisoNativoFullscreen(seccion, false);
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

        const btnProbarNivel = el("btnSubtitulosProbarNivel");
        if (btnProbarNivel) btnProbarNivel.addEventListener("click", iniciarMedidorNivel);

        const btnDetener = el("btnSubtitulosDetener");
        if (btnDetener) btnDetener.addEventListener("click", detenerEscucha);

        const btnPausar = el("btnSubtitulosPausar");
        if (btnPausar) btnPausar.addEventListener("click", alternarPausa);

        const btnMas = el("btnSubtitulosTextoMas");
        if (btnMas) btnMas.addEventListener("click", () => ajustarTamano(1));

        const btnMenos = el("btnSubtitulosTextoMenos");
        if (btnMenos) btnMenos.addEventListener("click", () => ajustarTamano(-1));

        const btnColor = el("btnSubtitulosColor");
        if (btnColor) btnColor.addEventListener("click", alternarColorResaltado);

        const btnBorrar = el("btnSubtitulosBorrar");
        if (btnBorrar) btnBorrar.addEventListener("click", borrarTexto);

        const btnGuardar = el("btnSubtitulosGuardar");
        if (btnGuardar) btnGuardar.addEventListener("click", copiarTranscripcion);

        const btnSalirCine = el("btnSubtitulosSalirCine");
        if (btnSalirCine) btnSalirCine.addEventListener("click", salirDePantallaCompleta);

        const btnFullscreen = el("btnSubtitulosFullscreen");
        if (btnFullscreen) btnFullscreen.addEventListener("click", alternarPantallaCompleta);

        ["fullscreenchange", "webkitfullscreenchange", "MSFullscreenChange"].forEach((evt) => {
            document.addEventListener(evt, manejarCambioPantallaCompleta);
        });
        document.addEventListener("visibilitychange", manejarVisibilidadDocumento);

        aplicarTamano();
        actualizarBotonColor();

        // Aviso de compatibilidad en la pantalla de intro.
        const aviso = el("subtitulosAvisoCompat");
        if (aviso) {
            const soportado = !!obtenerConstructorReconocimiento();
            aviso.textContent = soportado
                ? "Chrome recomendado · Micrófono necesario · La pantalla se mantendrá activa durante la sesión cuando el dispositivo lo permita."
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