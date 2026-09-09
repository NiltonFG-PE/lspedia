from pathlib import Path
import re

repo = Path(__file__).resolve().parents[1]
js_path = repo / "js" / "subtitulos.js"
css_path = repo / "css" / "subtitulos.css"
sw_path = repo / "sw.js"

js = js_path.read_text(encoding="utf-8")
css = css_path.read_text(encoding="utf-8")
sw = sw_path.read_text(encoding="utf-8")

JS_MARKER = "SUBTITULOS_V3_ESTABLE_20260909"
CSS_MARKER = "SUBTITULOS_V3_DISENO_20260909"
if JS_MARKER in js or CSS_MARKER in css:
    raise SystemExit("La mejora V3 de Subtítulos ya fue aplicada")

# ------------------------------------------------------------------
# 1) Estado extra: pausa, reconexión progresiva y Wake Lock.
# ------------------------------------------------------------------
old = '''        _reinicioProgramado: false,\n        _eventosListos: false,\n        _flashTextoNuevo: false, // dispara la animación de "llegada" del texto (ver renderizarTexto)\n        // --- Medidor de nivel de audio (pantalla intro, ver más abajo) ---'''
new = '''        _reinicioProgramado: false,\n        _eventosListos: false,\n        _flashTextoNuevo: false, // dispara la animación de "llegada" del texto (ver renderizarTexto)\n        // SUBTITULOS_V3_ESTABLE_20260909\n        pausado: false,\n        _ultimoError: "",\n        _intentosReinicio: 0,\n        _timeoutReinicio: null,\n        wakeLock: null,\n        // --- Medidor de nivel de audio (pantalla intro, ver más abajo) ---'''
if old not in js:
    raise SystemExit("No se encontró el bloque de estado de Subtítulos")
js = js.replace(old, new, 1)

# ------------------------------------------------------------------
# 2) UI moderna creada desde JS para no duplicar estructura en index.html.
# ------------------------------------------------------------------
needle = '    function el(id) { return document.getElementById(id); }\n'
if needle not in js:
    raise SystemExit("No se encontró helper el(id)")
helpers = r'''

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
'''
js = js.replace(needle, needle + helpers, 1)

# iniciar(): crear UI antes de enlazar eventos.
old = '''    function iniciar() {\n        enlazarEventos();\n'''
new = '''    function iniciar() {\n        asegurarMejorasInterfaz();\n        enlazarEventos();\n        actualizarEstadoMotor(estado.activo ? (estado.pausado ? "pausado" : "escuchando") : "listo");\n'''
if old not in js:
    raise SystemExit("No se encontró iniciar()")
js = js.replace(old, new, 1)

# maxAlternatives reduce ruido y trabajo innecesario.
old = '''        r.continuous = false;\n        r.interimResults = true;\n'''
new = '''        r.continuous = false;\n        r.interimResults = true;\n        r.maxAlternatives = 1;\n'''
if old not in js:
    raise SystemExit("No se encontró configuración de SpeechRecognition")
js = js.replace(old, new, 1)

# ------------------------------------------------------------------
# 3) Reemplazar inicio/detención por una versión que recrea el motor
#    cuando Chrome lo cierra y permite pausar/reanudar.
# ------------------------------------------------------------------
start = js.index('    function iniciarEscucha() {')
end_marker = '    // ---------------------------------------------------------\n    // MEDIDOR DE NIVEL DE AUDIO AMBIENTE'
end = js.index(end_marker, start)
new_block = r'''    function arrancarReconocimientoNuevo() {
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

'''
js = js[:start] + new_block + js[end:]

# ------------------------------------------------------------------
# 4) Cuando sí llegan resultados, la conexión se considera estable.
# ------------------------------------------------------------------
old = '''        estado.textoInterino = interina;\n        renderizarTexto();\n'''
new = '''        estado.textoInterino = interina;\n        estado._ultimoError = "";\n        estado._intentosReinicio = 0;\n        if (estado.activo && !estado.pausado) actualizarEstadoMotor("escuchando");\n        renderizarTexto();\n'''
if old not in js:
    raise SystemExit("No se encontró manejarResultado()")
js = js.replace(old, new, 1)

# ------------------------------------------------------------------
# 5) Error + reinicio progresivo. Para errores de red evita reiniciar
#    frenéticamente; para pausas normales vuelve casi de inmediato.
# ------------------------------------------------------------------
start = js.index('    function manejarError(evento) {')
end_marker = '    // ---------------------------------------------------------\n    // RENDER DEL TEXTO EN PANTALLA'
end = js.index(end_marker, start)
new_error_block = r'''    function manejarError(evento) {
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

'''
js = js[:start] + new_error_block + js[end:]

# ------------------------------------------------------------------
# 6) Eventos nuevos: pausa y reactivar Wake Lock al volver a la pestaña.
# ------------------------------------------------------------------
old = '''        const btnDetener = el("btnSubtitulosDetener");\n        if (btnDetener) btnDetener.addEventListener("click", detenerEscucha);\n\n        const btnMas = el("btnSubtitulosTextoMas");'''
new = '''        const btnDetener = el("btnSubtitulosDetener");\n        if (btnDetener) btnDetener.addEventListener("click", detenerEscucha);\n\n        const btnPausar = el("btnSubtitulosPausar");\n        if (btnPausar) btnPausar.addEventListener("click", alternarPausa);\n\n        const btnMas = el("btnSubtitulosTextoMas");'''
if old not in js:
    raise SystemExit("No se encontró listener de Detener")
js = js.replace(old, new, 1)

old = '''        ["fullscreenchange", "webkitfullscreenchange", "MSFullscreenChange"].forEach((evt) => {\n            document.addEventListener(evt, manejarCambioPantallaCompleta);\n        });\n\n        aplicarTamano();'''
new = '''        ["fullscreenchange", "webkitfullscreenchange", "MSFullscreenChange"].forEach((evt) => {\n            document.addEventListener(evt, manejarCambioPantallaCompleta);\n        });\n        document.addEventListener("visibilitychange", manejarVisibilidadDocumento);\n\n        aplicarTamano();'''
if old not in js:
    raise SystemExit("No se encontró bloque fullscreenchange")
js = js.replace(old, new, 1)

old = '''            aviso.textContent = soportado\n                ? "Funciona mejor en Google Chrome. Se te pedirá permiso para usar el micrófono."\n                : "Este navegador no admite el reconocimiento de voz en vivo. Ábrelo en Google Chrome.";'''
new = '''            aviso.textContent = soportado\n                ? "Chrome recomendado · Micrófono necesario · La pantalla se mantendrá activa durante la sesión cuando el dispositivo lo permita."\n                : "Este navegador no admite el reconocimiento de voz en vivo. Ábrelo en Google Chrome.";'''
if old not in js:
    raise SystemExit("No se encontró texto de compatibilidad")
js = js.replace(old, new, 1)

# ------------------------------------------------------------------
# 7) CSS V3: diseño moderno/fresco encima del CSS existente.
# ------------------------------------------------------------------
css += r'''

/* ============================================================
   SUBTITULOS_V3_DISENO_20260909
   Rediseño moderno/fresco + estados de conexión.
   ============================================================ */
#seccionSubtitulos {
    --sub-blue: #2563eb;
    --sub-blue-2: #0ea5e9;
    --sub-ink: #0f172a;
    --sub-muted: #64748b;
    --sub-border: #dbe7f4;
    --sub-soft: #f6f9fd;
}

#subtitulosPanelTitulo {
    border: 1px solid rgba(148, 163, 184, 0.18) !important;
    border-radius: 22px !important;
    background: rgba(255,255,255,0.92) !important;
    box-shadow: 0 10px 28px rgba(15,23,42,0.07) !important;
    backdrop-filter: blur(12px);
}
#subtitulosPanelTitulo .btn-primary {
    background: linear-gradient(135deg, #2563eb, #0ea5e9) !important;
    border: 0 !important;
    box-shadow: 0 8px 18px rgba(37,99,235,0.22);
    padding: 8px 14px;
}

#subtitulosIntro > .col-lg-8 {
    width: min(100%, 820px);
}
#subtitulosIntro .quiz-card {
    border: 1px solid var(--sub-border) !important;
    border-radius: 28px !important;
    background:
        radial-gradient(circle at 10% 0%, rgba(14,165,233,0.09), transparent 30%),
        radial-gradient(circle at 95% 10%, rgba(37,99,235,0.08), transparent 28%),
        #ffffff !important;
    box-shadow: 0 18px 50px rgba(15,23,42,0.09) !important;
    overflow: hidden;
}

.subtitulos-intro-hero-v3 {
    display: grid;
    grid-template-columns: 72px 1fr;
    grid-template-areas: "icon textos" "pasos pasos";
    gap: 14px 18px;
    align-items: center;
    text-align: left;
    margin: -4px 0 28px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e8eef6;
}
.subtitulos-hero-icono {
    grid-area: icon;
    width: 72px;
    height: 72px;
    display: grid;
    place-items: center;
    border-radius: 22px;
    color: white;
    font-size: 1.3rem;
    font-weight: 800;
    letter-spacing: .04em;
    background: linear-gradient(145deg, #0f4fa8, #0ea5e9);
    box-shadow: 0 12px 25px rgba(37,99,235,.24), inset 0 1px 0 rgba(255,255,255,.25);
}
.subtitulos-hero-textos { grid-area: textos; }
.subtitulos-hero-eyebrow {
    display: block;
    margin-bottom: 5px;
    color: #2563eb;
    font-size: .72rem;
    font-weight: 800;
    letter-spacing: .08em;
}
.subtitulos-hero-textos h3 {
    margin: 0 0 5px;
    color: var(--sub-ink);
    font-size: clamp(1.35rem, 2.4vw, 1.8rem);
    font-weight: 800;
}
.subtitulos-hero-textos p {
    margin: 0;
    color: var(--sub-muted);
    line-height: 1.55;
}
.subtitulos-pasos-v3 {
    grid-area: pasos;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}
.subtitulos-pasos-v3 span {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 11px;
    border-radius: 14px;
    color: #334155;
    background: #f8fbff;
    border: 1px solid #e0ebf7;
    font-size: .82rem;
    font-weight: 700;
}
.subtitulos-pasos-v3 b {
    width: 24px;
    height: 24px;
    display: inline-grid;
    place-items: center;
    flex: 0 0 24px;
    border-radius: 50%;
    color: #fff;
    background: linear-gradient(135deg, #2563eb, #0ea5e9);
    font-size: .75rem;
}

#subtitulosMedidorCaja {
    max-width: 560px !important;
    padding: 17px !important;
    border-radius: 18px !important;
    border: 1px solid #dce8f5 !important;
    background: rgba(248,251,255,.92) !important;
    box-shadow: inset 0 1px 0 #fff, 0 7px 18px rgba(15,23,42,.04);
}
#btnSubtitulosProbarNivel {
    min-height: 42px;
    padding-inline: 16px;
    border-color: #bfd3ea;
    color: #24415f;
    background: #fff;
}
#subtitulosIntro .form-select {
    min-height: 48px;
    border-radius: 14px;
    border: 1px solid #cbdbea;
    background-color: #fff;
    box-shadow: 0 4px 12px rgba(15,23,42,.035);
}
#subtitulosIntro .form-select:focus {
    border-color: #60a5fa;
    box-shadow: 0 0 0 4px rgba(37,99,235,.10);
}
#btnSubtitulosIniciar {
    min-height: 54px;
    padding-inline: 28px !important;
    color: #fff !important;
    border: 0 !important;
    background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%) !important;
    box-shadow: 0 12px 26px rgba(37,99,235,.25) !important;
}
#btnSubtitulosIniciar:hover,
#btnSubtitulosIniciar:focus-visible {
    box-shadow: 0 15px 32px rgba(37,99,235,.34) !important;
}
#subtitulosAvisoCompat {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-top: 14px !important;
    padding: 7px 11px;
    border-radius: 999px;
    color: #52677e !important;
    background: #f3f7fb;
    border: 1px solid #e1eaf3;
}
#subtitulosIntro .quiz-card > .text-start {
    max-width: 560px !important;
    background: #f8fbff !important;
    border-color: #dce9f6 !important;
    border-radius: 18px !important;
    padding: 16px 18px !important;
    color: #42566d !important;
}
#subtitulosIntro .quiz-card > .text-start p {
    color: #2563eb !important;
}
#subtitulosIntro .quiz-card > .text-start ul {
    color: #52677e !important;
    line-height: 1.6;
}

/* Barra de sesión */
#subtitulosBarraControles {
    padding: 10px 12px;
    margin-bottom: 12px !important;
    border: 1px solid #e0e8f1;
    border-radius: 18px;
    background: rgba(255,255,255,.92);
    box-shadow: 0 8px 22px rgba(15,23,42,.06);
    backdrop-filter: blur(12px);
}
.subtitulos-estado-motor {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 30px;
    padding: 5px 10px;
    border-radius: 999px;
    font-size: .78rem;
    font-weight: 700;
    border: 1px solid transparent;
    transition: color .2s ease, background .2s ease, border-color .2s ease;
}
.subtitulos-estado-motor i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 15%, transparent);
}
.subtitulos-estado-motor.estado-listo { color:#475569; background:#f1f5f9; border-color:#e2e8f0; }
.subtitulos-estado-motor.estado-escuchando { color:#15803d; background:#ecfdf3; border-color:#bbf7d0; }
.subtitulos-estado-motor.estado-reconectando { color:#b45309; background:#fffbeb; border-color:#fde68a; }
.subtitulos-estado-motor.estado-pausado { color:#1d4ed8; background:#eff6ff; border-color:#bfdbfe; }
.subtitulos-estado-motor.estado-error { color:#b91c1c; background:#fef2f2; border-color:#fecaca; }
#seccionSubtitulos[data-estado-subtitulos="escuchando"] .subtitulos-estado-motor i {
    animation: subtitulosEstadoPulso 1.35s ease-in-out infinite;
}
@keyframes subtitulosEstadoPulso {
    0%,100% { transform: scale(1); opacity:.7; }
    50% { transform: scale(1.35); opacity:1; }
}

/* Pantalla de lectura: más limpia y profunda, sin perder contraste. */
.subtitulos-pantalla {
    height: clamp(330px, 48vh, 560px);
    border-radius: 30px;
    background:
        radial-gradient(circle at 50% 45%, rgba(20,45,78,.33), transparent 45%),
        linear-gradient(180deg, #03070d 0%, #000 58%, #020407 100%);
    border: 1px solid rgba(255,255,255,.08);
    box-shadow: 0 24px 55px rgba(2,8,23,.34), inset 0 1px 0 rgba(255,255,255,.05);
}
.subtitulos-texto {
    max-width: min(1050px, 88%);
    letter-spacing: -.015em;
    text-wrap: balance;
    text-shadow: 0 3px 18px rgba(0,0,0,.72);
}
.subtitulos-placeholder {
    max-width: 760px;
    padding: 10px 18px;
    border-radius: 999px;
    color: #a9bad0;
    background: rgba(15,23,42,.38);
    border: 1px solid rgba(255,255,255,.06);
    font-style: normal;
    font-weight: 600;
}
.subtitulos-controles-flotantes {
    top: 18px;
    left: 18px;
    padding: 6px;
    gap: 3px;
    background: rgba(15,23,42,.62);
    border-color: rgba(255,255,255,.11);
    box-shadow: 0 10px 25px rgba(0,0,0,.28);
}
.subtitulos-controles-flotantes .btn {
    width: 38px;
    height: 38px;
}

#subtitulosControlesInferiores {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
}
#subtitulosControlesInferiores .btn {
    min-height: 44px;
    padding: 9px 18px !important;
    border-radius: 999px !important;
}
.subtitulos-btn-pausa {
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
    background: #eff6ff;
}
.subtitulos-btn-pausa:hover,
.subtitulos-btn-pausa:focus-visible {
    color: #1e40af;
    background: #dbeafe;
    border-color: #93c5fd;
}
.subtitulos-btn-pausa.esta-pausado {
    color: #166534;
    background: #ecfdf3;
    border-color: #bbf7d0;
}
#btnSubtitulosDetener {
    color: #b91c1c;
    border-color: #fecaca;
    background: #fff7f7;
}
#btnSubtitulosGuardar,
#btnSubtitulosFullscreen {
    min-height: 40px;
    background: #fff;
}

@media (max-width: 767.98px) {
    #subtitulosIntro .quiz-card {
        padding: 20px 16px !important;
        border-radius: 22px !important;
    }
    .subtitulos-intro-hero-v3 {
        grid-template-columns: 58px 1fr;
        gap: 12px;
        margin-bottom: 20px;
        padding-bottom: 18px;
    }
    .subtitulos-hero-icono {
        width: 58px;
        height: 58px;
        border-radius: 18px;
        font-size: 1rem;
    }
    .subtitulos-pasos-v3 {
        grid-template-columns: 1fr;
        gap: 6px;
    }
    .subtitulos-pasos-v3 span { padding: 7px 9px; }
    #subtitulosAvisoCompat {
        display: block;
        border-radius: 14px;
        line-height: 1.45;
    }
    #subtitulosBarraControles {
        padding: 9px;
        border-radius: 16px;
    }
    .subtitulos-pantalla {
        height: 52vh;
        min-height: 330px;
        border-radius: 22px;
        padding: 70px 16px 26px;
    }
    .subtitulos-texto { max-width: 96%; }
    .subtitulos-controles-flotantes {
        top: 12px;
        left: 12px;
    }
    #subtitulosControlesInferiores .btn {
        flex: 1 1 150px;
        max-width: 230px;
    }
}

@media (prefers-reduced-motion: reduce) {
    #seccionSubtitulos[data-estado-subtitulos="escuchando"] .subtitulos-estado-motor i {
        animation: none;
    }
}
'''

# ------------------------------------------------------------------
# 8) PWA: fuerza una nueva versión del shell.
# ------------------------------------------------------------------
old_version = 'const VERSION_APP = "v41";'
new_version = 'const VERSION_APP = "v42";'
if old_version not in sw:
    raise SystemExit("No se encontró VERSION_APP v41")
sw = sw.replace(old_version, new_version, 1)

js_path.write_text(js, encoding="utf-8")
css_path.write_text(css, encoding="utf-8")
sw_path.write_text(sw, encoding="utf-8")

print("Mejora V3 de Subtítulos aplicada")
