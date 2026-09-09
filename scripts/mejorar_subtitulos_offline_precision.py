from pathlib import Path
import re

repo = Path(__file__).resolve().parents[1]
js_path = repo / "js" / "subtitulos.js"
css_path = repo / "css" / "subtitulos.css"
sw_path = repo / "sw.js"

js = js_path.read_text(encoding="utf-8")
css = css_path.read_text(encoding="utf-8")
sw = sw_path.read_text(encoding="utf-8")

JS_MARKER = "SUBTITULOS_V4_OFFLINE_PRECISION_20260909"
CSS_MARKER = "SUBTITULOS_V4_OFFLINE_PRECISION_20260909"
if JS_MARKER in js or CSS_MARKER in css:
    raise SystemExit("La mejora V4 de Subtítulos ya fue aplicada")

# 1) Estado nuevo: paquete local + frases contextuales.
old = '''        _timeoutReinicio: null,\n        wakeLock: null,\n        // --- Medidor de nivel de audio (pantalla intro, ver más abajo) ---'''
new = '''        _timeoutReinicio: null,\n        wakeLock: null,\n        // SUBTITULOS_V4_OFFLINE_PRECISION_20260909\n        modoLocalDisponible: false,\n        modoLocalActivo: false,\n        idiomaLocal: "",\n        calidadLocal: "",\n        frasesContextuales: [],\n        _comprobandoLocal: false,\n        // --- Medidor de nivel de audio (pantalla intro, ver más abajo) ---'''
if old not in js:
    raise SystemExit("No se encontró el bloque de estado V3")
js = js.replace(old, new, 1)

# 2) Interfaz: tarjeta offline + palabras importantes.
needle = '''            introCard.insertBefore(hero, introCard.firstChild);\n        }\n\n        const barra = el("subtitulosBarraControles");'''
replacement = '''            introCard.insertBefore(hero, introCard.firstChild);\n        }\n\n        if (introCard && !el("subtitulosOfflineCard")) {\n            const bloque = document.createElement("div");\n            bloque.id = "subtitulosOfflineCard";\n            bloque.className = "subtitulos-offline-card-v4";\n            bloque.innerHTML = `\n                <div class="subtitulos-offline-icono" aria-hidden="true">⬇️</div>\n                <div class="subtitulos-offline-contenido">\n                    <div class="subtitulos-offline-titulo">Modo sin internet</div>\n                    <div id="subtitulosOfflineEstado" class="subtitulos-offline-estado">Comprobando si este navegador puede usar reconocimiento local…</div>\n                    <div class="subtitulos-offline-acciones">\n                        <button id="btnSubtitulosOffline" type="button" class="btn btn-sm subtitulos-btn-offline">Descargar idioma</button>\n                        <label class="subtitulos-switch-offline">\n                            <input id="subtitulosUsarOffline" type="checkbox" disabled>\n                            <span>Usar sin internet</span>\n                        </label>\n                    </div>\n                </div>`;\n            const hero = introCard.querySelector(".subtitulos-intro-hero-v3");\n            if (hero && hero.nextSibling) introCard.insertBefore(bloque, hero.nextSibling);\n            else introCard.insertBefore(bloque, introCard.firstChild);\n        }\n\n        if (introCard && !el("subtitulosContextoPalabras")) {\n            const precision = document.createElement("div");\n            precision.className = "subtitulos-precision-card-v4";\n            precision.innerHTML = `\n                <label for="subtitulosContextoPalabras" class="subtitulos-precision-titulo">🎯 Palabras importantes <span>(opcional)</span></label>\n                <input id="subtitulosContextoPalabras" class="form-control" maxlength="240" placeholder="Ej.: LSPedia, RENIEC, María, Barranco">\n                <small>Agrega nombres, lugares o términos difíciles separados por comas. Si el navegador lo permite, LSPedia les da prioridad al reconocer.</small>`;\n            const medidor = el("subtitulosMedidorCaja");\n            const medidorWrap = medidor ? medidor.parentElement : null;\n            if (medidorWrap) introCard.insertBefore(precision, medidorWrap);\n            else introCard.appendChild(precision);\n        }\n\n        const barra = el("subtitulosBarraControles");'''
if needle not in js:
    raise SystemExit("No se encontró punto de inserción de UI V3")
js = js.replace(needle, replacement, 1)

# 3) Helpers para reconocimiento local y precisión contextual.
needle = '''    // ---------------------------------------------------------\n    // SOPORTE DEL NAVEGADOR\n    // ---------------------------------------------------------\n    function obtenerConstructorReconocimiento() {'''
helpers = r'''    // ---------------------------------------------------------
    // MODO LOCAL / SIN INTERNET Y PRECISIÓN CONTEXTUAL
    // ---------------------------------------------------------
    function obtenerConstructorLocal() {
        // Las funciones modernas available()/install() se exponen sin prefijo.
        return window.SpeechRecognition || null;
    }

    function soportaModoLocal() {
        const Ctor = obtenerConstructorLocal();
        return !!(Ctor && typeof Ctor.available === "function" && typeof Ctor.install === "function");
    }

    function idiomaSeleccionado() {
        const select = el("subtitulosSelectIdioma");
        return (select && select.value) || estado.idioma || CONFIG.IDIOMA_POR_DEFECTO;
    }

    function nombreIdioma(codigo) {
        return NOMBRES_IDIOMA[codigo] || codigo;
    }

    function actualizarUiOffline(tipo, texto, calidad) {
        const estadoEl = el("subtitulosOfflineEstado");
        const btn = el("btnSubtitulosOffline");
        const toggle = el("subtitulosUsarOffline");
        const idioma = idiomaSeleccionado();
        const etiqueta = nombreIdioma(idioma);

        if (estadoEl) {
            estadoEl.className = "subtitulos-offline-estado estado-" + tipo;
            estadoEl.textContent = texto;
        }
        if (btn) {
            btn.disabled = tipo === "comprobando" || tipo === "instalando" || tipo === "no-soportado";
            if (tipo === "listo") btn.textContent = "✓ Idioma descargado";
            else if (tipo === "instalando") btn.textContent = "Descargando…";
            else btn.textContent = "⬇ Descargar " + etiqueta;
        }
        if (toggle) {
            const listo = tipo === "listo";
            toggle.disabled = !listo;
            if (!listo) toggle.checked = false;
        }
        if (calidad) estado.calidadLocal = calidad;
    }

    async function buscarCalidadLocal(idioma) {
        const Ctor = obtenerConstructorLocal();
        if (!Ctor) return null;
        // Para subtítulos priorizamos conversation: está pensado para habla
        // continua, ruido y varios hablantes. Si no existe, probamos dictation.
        for (const calidad of ["conversation", "dictation"]) {
            try {
                const estadoDisp = await Ctor.available({ langs: [idioma], processLocally: true, quality: calidad });
                if (estadoDisp !== "unavailable") return { estado: estadoDisp, calidad };
            } catch (e) {
                // Algunos navegadores implementan la API parcialmente.
            }
        }
        return null;
    }

    async function comprobarDisponibilidadLocal(interactivo) {
        if (estado._comprobandoLocal) return;
        const idioma = idiomaSeleccionado();
        estado.modoLocalActivo = false;
        estado.modoLocalDisponible = false;
        estado.idiomaLocal = "";

        if (!soportaModoLocal()) {
            actualizarUiOffline("no-soportado", "Este navegador todavía no permite descargar el reconocimiento de voz desde la web. LSPedia seguirá usando el modo en línea.");
            return;
        }

        estado._comprobandoLocal = true;
        actualizarUiOffline("comprobando", "Comprobando paquete de " + nombreIdioma(idioma) + "…");
        try {
            const info = await buscarCalidadLocal(idioma);
            if (!info) {
                actualizarUiOffline("no-disponible", "No hay un paquete local compatible para " + nombreIdioma(idioma) + " en este navegador.");
                return;
            }

            if (info.estado === "available") {
                estado.modoLocalDisponible = true;
                estado.idiomaLocal = idioma;
                estado.calidadLocal = info.calidad;
                actualizarUiOffline("listo", "Listo para usar sin internet · calidad " + (info.calidad === "conversation" ? "conversación" : "dictado") + ".", info.calidad);
                const toggle = el("subtitulosUsarOffline");
                if (toggle && !toggle.dataset.usuarioCambio) toggle.checked = true;
                estado.modoLocalActivo = !!(toggle && toggle.checked);
                return;
            }

            if (!interactivo) {
                const mensaje = info.estado === "downloading"
                    ? "El paquete se está descargando. Vuelve a comprobar en unos instantes."
                    : "Hay un paquete disponible para descargar y usar sin internet.";
                actualizarUiOffline("descargable", mensaje, info.calidad);
                return;
            }

            actualizarUiOffline("instalando", "Descargando " + nombreIdioma(idioma) + " para usarlo sin internet…", info.calidad);
            const Ctor = obtenerConstructorLocal();
            const ok = await Ctor.install({ langs: [idioma], processLocally: true, quality: info.calidad });
            if (ok) {
                estado.modoLocalDisponible = true;
                estado.modoLocalActivo = true;
                estado.idiomaLocal = idioma;
                estado.calidadLocal = info.calidad;
                actualizarUiOffline("listo", "Paquete instalado. Ya puedes usar Subtítulos sin internet en este navegador.", info.calidad);
                const toggle = el("subtitulosUsarOffline");
                if (toggle) toggle.checked = true;
            } else {
                actualizarUiOffline("error", "No se pudo descargar el paquete. Puedes seguir usando el modo en línea.");
            }
        } catch (e) {
            console.warn("No se pudo comprobar/instalar reconocimiento local:", e);
            actualizarUiOffline("error", "El navegador no pudo preparar el modo sin internet. LSPedia seguirá funcionando en línea.");
        } finally {
            estado._comprobandoLocal = false;
        }
    }

    function leerFrasesContextuales() {
        const input = el("subtitulosContextoPalabras");
        if (!input) return [];
        const vistas = new Set();
        return input.value.split(",")
            .map((v) => v.trim())
            .filter((v) => {
                if (!v || v.length > 45) return false;
                const clave = v.toLocaleLowerCase("es");
                if (vistas.has(clave)) return false;
                vistas.add(clave);
                return true;
            })
            .slice(0, 20);
    }

    function aplicarSesgoContextual(reconocimiento) {
        if (!reconocimiento || !estado.frasesContextuales.length) return;
        if (!("phrases" in reconocimiento) || typeof window.SpeechRecognitionPhrase !== "function") return;
        try {
            reconocimiento.phrases = estado.frasesContextuales.map((frase) => new window.SpeechRecognitionPhrase(frase, 5.5));
        } catch (e) {
            console.warn("Sesgo contextual no disponible en este navegador:", e);
        }
    }

    function elegirAlternativa(resultado) {
        if (!resultado || !resultado.length) return null;
        let mejor = resultado[0];
        if (!resultado.isFinal || resultado.length === 1 || !estado.frasesContextuales.length) return mejor;

        const contexto = estado.frasesContextuales.map((f) => normalizar(f)).filter(Boolean);
        let mejorPuntaje = -Infinity;
        for (let i = 0; i < resultado.length; i++) {
            const alt = resultado[i];
            const texto = normalizar(alt.transcript || "");
            let puntaje = Number.isFinite(alt.confidence) ? alt.confidence : 0;
            contexto.forEach((frase) => {
                if (frase && texto.includes(frase)) puntaje += 0.10;
            });
            if (puntaje > mejorPuntaje) {
                mejorPuntaje = puntaje;
                mejor = alt;
            }
        }
        return mejor;
    }

''' + needle
if needle not in js:
    raise SystemExit("No se encontró soporte del navegador")
js = js.replace(needle, helpers, 1)

# 4) Al entrar, comprobar soporte local en segundo plano.
old = '''        mostrarPantalla(estado.activo ? "enVivo" : "intro");\n    }'''
new = '''        mostrarPantalla(estado.activo ? "enVivo" : "intro");\n        if (!estado.activo) comprobarDisponibilidadLocal(false);\n    }'''
if old not in js:
    raise SystemExit("No se encontró final de iniciar()")
js = js.replace(old, new, 1)

# 5) Configuración de reconocimiento: local + 3 alternativas + frases.
old = '''        r.continuous = false;\n        r.interimResults = true;\n        r.maxAlternatives = 1;\n\n        r.onresult = manejarResultado;'''
new = '''        r.continuous = false;\n        r.interimResults = true;\n        r.maxAlternatives = 3;\n\n        if (estado.modoLocalActivo && estado.modoLocalDisponible && estado.idiomaLocal === estado.idioma && "processLocally" in r) {\n            r.processLocally = true;\n        }\n        aplicarSesgoContextual(r);\n\n        r.onresult = manejarResultado;'''
if old not in js:
    raise SystemExit("No se encontró configuración r.maxAlternatives")
js = js.replace(old, new, 1)

# 6) Antes de iniciar, recoger palabras y estado del switch offline.
old = '''        const selectIdioma = el("subtitulosSelectIdioma");\n        if (selectIdioma) estado.idioma = selectIdioma.value || CONFIG.IDIOMA_POR_DEFECTO;\n\n        if (!obtenerConstructorReconocimiento()) {'''
new = '''        const selectIdioma = el("subtitulosSelectIdioma");\n        if (selectIdioma) estado.idioma = selectIdioma.value || CONFIG.IDIOMA_POR_DEFECTO;\n        estado.frasesContextuales = leerFrasesContextuales();\n        const toggleOffline = el("subtitulosUsarOffline");\n        estado.modoLocalActivo = !!(toggleOffline && toggleOffline.checked && estado.modoLocalDisponible && estado.idiomaLocal === estado.idioma);\n\n        if (!obtenerConstructorReconocimiento()) {'''
if old not in js:
    raise SystemExit("No se encontró inicio de iniciarEscucha")
js = js.replace(old, new, 1)

# 7) Estado visual indica si está trabajando localmente.
js = js.replace('''        actualizarEstadoMotor("escuchando");\n        try {\n            reconocimiento.start();''', '''        actualizarEstadoMotor("escuchando", estado.modoLocalActivo ? "Escuchando · sin internet" : "Escuchando");\n        try {\n            reconocimiento.start();''', 1)
js = js.replace('''        actualizarEstadoMotor("escuchando");\n        solicitarWakeLock();''', '''        actualizarEstadoMotor("escuchando", estado.modoLocalActivo ? "Escuchando · sin internet" : "Escuchando");\n        solicitarWakeLock();''', 1)

# 8) Resultado: usar alternativa escogida y mantener estado local visible.
old = '''        for (let i = evento.resultIndex; i < evento.results.length; i++) {\n            const resultado = evento.results[i];\n            const texto = resultado[0].transcript;\n            if (resultado.isFinal) {'''
new = '''        for (let i = evento.resultIndex; i < evento.results.length; i++) {\n            const resultado = evento.results[i];\n            const alternativa = elegirAlternativa(resultado);\n            const texto = alternativa ? alternativa.transcript : "";\n            if (resultado.isFinal) {'''
if old not in js:
    raise SystemExit("No se encontró manejarResultado")
js = js.replace(old, new, 1)
js = js.replace('''        if (estado.activo && !estado.pausado) actualizarEstadoMotor("escuchando");''', '''        if (estado.activo && !estado.pausado) actualizarEstadoMotor("escuchando", estado.modoLocalActivo ? "Escuchando · sin internet" : "Escuchando");''', 1)

# 9) Error nuevo del estándar y fallback claro para modo local.
old = '''        if (error === "language-not-supported") {\n            estado.activo = false;'''
new = '''        if (error === "phrases-not-supported") {\n            // El sesgo contextual es opcional: si el motor no lo soporta,\n            // seguimos transcribiendo normalmente.\n            estado.frasesContextuales = [];\n            estado._ultimoError = "aborted";\n            actualizarEstadoMotor("reconectando", "Ajustando reconocimiento…");\n            return;\n        }\n\n        if (error === "language-unavailable" || error === "language-not-supported") {\n            estado.activo = false;'''
if old not in js:
    raise SystemExit("No se encontró error de idioma")
js = js.replace(old, new, 1)

# 10) Eventos de offline, switch, idioma y contexto.
needle = '''        const btnProbarNivel = el("btnSubtitulosProbarNivel");\n        if (btnProbarNivel) btnProbarNivel.addEventListener("click", iniciarMedidorNivel);\n'''
new = '''        const btnProbarNivel = el("btnSubtitulosProbarNivel");\n        if (btnProbarNivel) btnProbarNivel.addEventListener("click", iniciarMedidorNivel);\n\n        const btnOffline = el("btnSubtitulosOffline");\n        if (btnOffline) btnOffline.addEventListener("click", () => comprobarDisponibilidadLocal(true));\n\n        const toggleOffline = el("subtitulosUsarOffline");\n        if (toggleOffline) toggleOffline.addEventListener("change", () => {\n            toggleOffline.dataset.usuarioCambio = "1";\n            estado.modoLocalActivo = !!(toggleOffline.checked && estado.modoLocalDisponible && estado.idiomaLocal === idiomaSeleccionado());\n        });\n\n        const selectIdioma = el("subtitulosSelectIdioma");\n        if (selectIdioma) selectIdioma.addEventListener("change", () => {\n            estado.modoLocalActivo = false;\n            estado.modoLocalDisponible = false;\n            estado.idiomaLocal = "";\n            const toggle = el("subtitulosUsarOffline");\n            if (toggle) { toggle.checked = false; toggle.disabled = true; delete toggle.dataset.usuarioCambio; }\n            comprobarDisponibilidadLocal(false);\n        });\n'''
if needle not in js:
    raise SystemExit("No se encontró punto de eventos")
js = js.replace(needle, new, 1)

# 11) CSS V4.
css += r'''

/* ============================================================
   SUBTITULOS_V4_OFFLINE_PRECISION_20260909
   Modo local/offline y precisión contextual.
   ============================================================ */
.subtitulos-offline-card-v4,
.subtitulos-precision-card-v4 {
    max-width: 560px;
    width: 100%;
    margin: 0 auto 18px;
    border-radius: 20px;
    border: 1px solid #dbe8f5;
    background: linear-gradient(145deg, #f8fbff, #f1f8ff);
    box-shadow: 0 8px 24px rgba(15,23,42,.055), inset 0 1px 0 rgba(255,255,255,.9);
}
.subtitulos-offline-card-v4 {
    display: grid;
    grid-template-columns: 48px 1fr;
    gap: 14px;
    padding: 16px 17px;
    text-align: left;
}
.subtitulos-offline-icono {
    width: 48px;
    height: 48px;
    display: grid;
    place-items: center;
    border-radius: 15px;
    background: #e0f2fe;
    font-size: 1.35rem;
}
.subtitulos-offline-titulo {
    color: #16324f;
    font-weight: 800;
    font-size: .98rem;
}
.subtitulos-offline-estado {
    margin-top: 3px;
    color: #64748b;
    font-size: .82rem;
    line-height: 1.45;
}
.subtitulos-offline-estado.estado-listo { color:#15803d; }
.subtitulos-offline-estado.estado-error,
.subtitulos-offline-estado.estado-no-disponible { color:#b45309; }
.subtitulos-offline-estado.estado-no-soportado { color:#64748b; }
.subtitulos-offline-acciones {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 11px;
}
.subtitulos-btn-offline {
    min-height: 38px;
    padding: 7px 13px;
    border-radius: 999px;
    color: #075985;
    border: 1px solid #bae6fd;
    background: #fff;
    font-weight: 700;
}
.subtitulos-btn-offline:hover:not(:disabled) {
    color: #fff;
    background: #0284c7;
    border-color: #0284c7;
}
.subtitulos-switch-offline {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #475569;
    font-size: .82rem;
    font-weight: 700;
    cursor: pointer;
}
.subtitulos-switch-offline input {
    width: 18px;
    height: 18px;
    accent-color: #16a34a;
}
.subtitulos-switch-offline input:disabled + span { opacity:.55; }

.subtitulos-precision-card-v4 {
    padding: 14px 16px;
    text-align: left;
    background: linear-gradient(145deg, #fffdf7, #fff9e8);
    border-color: #f5e7b7;
}
.subtitulos-precision-titulo {
    display: block;
    margin-bottom: 7px;
    color: #5f4a13;
    font-size: .9rem;
    font-weight: 800;
}
.subtitulos-precision-titulo span {
    color: #8b7a4f;
    font-size: .76rem;
    font-weight: 600;
}
#subtitulosContextoPalabras {
    min-height: 44px;
    border-radius: 13px;
    border-color: #eadb9d;
    background: rgba(255,255,255,.92);
}
#subtitulosContextoPalabras:focus {
    border-color: #eab308;
    box-shadow: 0 0 0 4px rgba(234,179,8,.10);
}
.subtitulos-precision-card-v4 small {
    display: block;
    margin-top: 7px;
    color: #7c6d45;
    line-height: 1.45;
}

@media (max-width: 576px) {
    .subtitulos-offline-card-v4 {
        grid-template-columns: 42px 1fr;
        padding: 14px;
        border-radius: 17px;
    }
    .subtitulos-offline-icono { width:42px; height:42px; border-radius:13px; }
    .subtitulos-offline-acciones { align-items:flex-start; flex-direction:column; gap:8px; }
    .subtitulos-btn-offline { width:100%; }
    .subtitulos-precision-card-v4 { padding:13px 14px; border-radius:17px; }
}
'''

# 12) PWA v42 -> v43.
sw2, n = re.subn(r'const VERSION_APP = "v42";', 'const VERSION_APP = "v43";', sw, count=1)
if n != 1:
    raise SystemExit("No se encontró VERSION_APP v42")
sw = sw2

js_path.write_text(js, encoding="utf-8")
css_path.write_text(css, encoding="utf-8")
sw_path.write_text(sw, encoding="utf-8")
print("Mejora V4 aplicada")
