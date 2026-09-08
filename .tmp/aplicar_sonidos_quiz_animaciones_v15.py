from pathlib import Path
import re

ROOT = Path('.')

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')

def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'No se encontró bloque: {label}')
    return text.replace(old, new, 1)

# ------------------------------------------------------------
# 1) INDEX: Quiz con 3 botones independientes
# ------------------------------------------------------------
path = 'index.html'
html = read(path)
old = '''                        <div class="quiz-inicio-rapido mb-3">
                            <button type="button" id="btnQuizJugarRapido" class="quiz-btn-jugar-rapido">▶ JUGAR</button>
                            <button type="button" id="btnQuizConfigurar" class="quiz-btn-configurar" aria-expanded="false" aria-controls="quizConfiguracion">⚙️ Elegir nivel</button>
                        </div>

                        <div id="quizConfiguracion" class="quiz-configuracion d-none">
                            <p class="text-uppercase small fw-bold mb-2" style="color:#64748b; letter-spacing:0.05em;">Nivel</p>
                            <div class="row g-2 mb-4" id="quizSelectorNivel"></div>

                            <p class="text-uppercase small fw-bold mb-2" style="color:#64748b; letter-spacing:0.05em;">Modo de juego</p>
                            <div class="row g-2 mb-4" id="quizSelectorModo"></div>

                            <p class="text-center small mb-3" id="quizTotalDisponibles"></p>
                            <div class="text-center">
                                <button id="btnEmpezarQuiz" class="btn btn-warning fw-bold py-2 px-4 rounded-pill">▶ Empezar</button>
                            </div>
                        </div>'''
new = '''                        <div class="quiz-inicio-rapido quiz-inicio-rapido-tres mb-3">
                            <button type="button" id="btnQuizJugarRapido" class="quiz-btn-jugar-rapido">▶ JUGAR</button>
                            <button type="button" id="btnQuizNivel" class="quiz-btn-configurar quiz-btn-nivel" aria-expanded="false" aria-controls="quizPanelNivel">🌱 Elegir nivel</button>
                            <button type="button" id="btnQuizModo" class="quiz-btn-configurar quiz-btn-modo" aria-expanded="false" aria-controls="quizPanelModo">🎲 Modo de juego</button>
                        </div>

                        <div id="quizPanelNivel" class="quiz-configuracion quiz-panel-config d-none">
                            <p class="text-uppercase small fw-bold mb-2" style="color:#64748b; letter-spacing:0.05em;">Nivel</p>
                            <div class="row g-2 mb-2" id="quizSelectorNivel"></div>
                        </div>

                        <div id="quizPanelModo" class="quiz-configuracion quiz-panel-config d-none">
                            <p class="text-uppercase small fw-bold mb-2" style="color:#64748b; letter-spacing:0.05em;">Modo de juego</p>
                            <div class="row g-2 mb-2" id="quizSelectorModo"></div>
                        </div>

                        <p class="text-center small mt-3 mb-0" id="quizTotalDisponibles"></p>
                        <button id="btnEmpezarQuiz" class="d-none" type="button" aria-hidden="true" tabindex="-1">Empezar</button>'''
html = replace_once(html, old, new, 'quiz 3 botones')
write(path, html)

# ------------------------------------------------------------
# 2) QUIZ JS: panel Nivel y panel Modo separados
# ------------------------------------------------------------
path = 'js/quiz.js'
js = read(path)
old = '''    function mostrarIntro() {
        mostrarBloque("quizIntro");
        renderSelectorNivel();
        renderSelectorModo();
        actualizarConteoDisponibles();
        const config = el("quizConfiguracion");
        const btnConfig = el("btnQuizConfigurar");
        if(config) config.classList.add("d-none");
        if(btnConfig) btnConfig.setAttribute("aria-expanded","false");
    }'''
new = '''    function mostrarIntro() {
        mostrarBloque("quizIntro");
        renderSelectorNivel();
        renderSelectorModo();
        actualizarConteoDisponibles();
        const panelNivel = el("quizPanelNivel");
        const panelModo = el("quizPanelModo");
        const btnNivel = el("btnQuizNivel");
        const btnModo = el("btnQuizModo");
        if (panelNivel) panelNivel.classList.add("d-none");
        if (panelModo) panelModo.classList.add("d-none");
        if (btnNivel) btnNivel.setAttribute("aria-expanded", "false");
        if (btnModo) btnModo.setAttribute("aria-expanded", "false");
    }'''
js = replace_once(js, old, new, 'mostrarIntro quiz')

old = '''    function actualizarConteoDisponibles() {
        const disponibles = bancoFiltrado().length;
        const texto = el("quizTotalDisponibles");
        const btn = el("btnEmpezarQuiz");
        const minimoNecesario = estado.modo === "4" ? Math.min(CONFIG.PARES_MEMORIA, 3) : 4;
        if (disponibles < minimoNecesario) {
            texto.innerHTML = `⚠️ Solo hay <strong>${disponibles}</strong> palabras disponibles en este nivel. Elige "Todos" o prueba con otro nivel.`;
            btn.disabled = true;
        } else {
            texto.innerHTML = `✅ <strong>${disponibles}</strong> palabras disponibles para esta partida.`;
            btn.disabled = false;
        }
    }'''
new = '''    function actualizarConteoDisponibles() {
        const disponibles = bancoFiltrado().length;
        const texto = el("quizTotalDisponibles");
        const btn = el("btnEmpezarQuiz");
        const btnRapido = el("btnQuizJugarRapido");
        const minimoNecesario = estado.modo === "4" ? Math.min(CONFIG.PARES_MEMORIA, 3) : 4;
        const deshabilitar = disponibles < minimoNecesario;
        if (texto) {
            if (deshabilitar) {
                texto.innerHTML = `⚠️ Solo hay <strong>${disponibles}</strong> palabras disponibles en este nivel. Elige "Todos" o prueba con otro nivel.`;
            } else {
                texto.innerHTML = `✅ <strong>${disponibles}</strong> palabras disponibles · ${estado.nivel} · ${nombreModoActual()}.`;
            }
        }
        if (btn) btn.disabled = deshabilitar;
        if (btnRapido) btnRapido.disabled = deshabilitar;
    }

    function nombreModoActual() {
        const nombres = {
            "1": "Video → Palabra",
            "2": "Palabra → Video",
            "3": "Verdadero/Falso",
            "4": "Memoria",
            "5": "Aleatorio"
        };
        return nombres[estado.modo] || "Aleatorio";
    }'''
js = replace_once(js, old, new, 'conteo disponibles quiz')

old = '''        const btnRapido = el("btnQuizJugarRapido");
        if(btnRapido) btnRapido.addEventListener("click", () => {
            estado.nivel = "Todos";
            estado.modo = "5";
            empezarPartida();
        });

        const btnConfig = el("btnQuizConfigurar");
        if(btnConfig) btnConfig.addEventListener("click", () => {
            const panel = el("quizConfiguracion");
            if(!panel) return;
            const abrir = panel.classList.contains("d-none");
            panel.classList.toggle("d-none", !abrir);
            btnConfig.setAttribute("aria-expanded", abrir ? "true" : "false");
        });'''
new = '''        const btnRapido = el("btnQuizJugarRapido");
        if (btnRapido) btnRapido.addEventListener("click", () => {
            // JUGAR usa la configuración que esté elegida. Al entrar por
            // primera vez sigue siendo Todos + Aleatorio, pero si la persona
            // cambia nivel o modo, JUGAR respeta esa elección.
            empezarPartida();
        });

        function alternarPanelQuiz(panelId, botonId, otroPanelId, otroBotonId) {
            const panel = el(panelId);
            const boton = el(botonId);
            const otroPanel = el(otroPanelId);
            const otroBoton = el(otroBotonId);
            if (!panel || !boton) return;
            const abrir = panel.classList.contains("d-none");
            panel.classList.toggle("d-none", !abrir);
            boton.setAttribute("aria-expanded", abrir ? "true" : "false");
            if (otroPanel) otroPanel.classList.add("d-none");
            if (otroBoton) otroBoton.setAttribute("aria-expanded", "false");
        }

        const btnNivel = el("btnQuizNivel");
        if (btnNivel) btnNivel.addEventListener("click", () => {
            alternarPanelQuiz("quizPanelNivel", "btnQuizNivel", "quizPanelModo", "btnQuizModo");
        });

        const btnModo = el("btnQuizModo");
        if (btnModo) btnModo.addEventListener("click", () => {
            alternarPanelQuiz("quizPanelModo", "btnQuizModo", "quizPanelNivel", "btnQuizNivel");
        });'''
js = replace_once(js, old, new, 'eventos botones quiz')
write(path, js)

# ------------------------------------------------------------
# 3) MATEMÁTICAS: sonido de acierto/error además de vibración
# ------------------------------------------------------------
path = 'js/matematicas.js'
js = read(path)
js = replace_once(js, '        uiLista: false\n    };', '        uiLista: false,\n        audioCtx: null\n    };', 'estado audio matematicas')
marker = '''    function vibrarError() {
        if (navigator.vibrate) {
            try { navigator.vibrate([180, 70, 180]); } catch (_) {}
        }
    }'''
insert = '''    function obtenerAudioCtx() {
        if (!estado.audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) estado.audioCtx = new AC();
        }
        const ctx = estado.audioCtx;
        if (ctx && ctx.state === "suspended") {
            try { ctx.resume(); } catch (_) {}
        }
        return ctx;
    }

    function tono(frecuencia, duracionMs, retrasoMs, tipo, volumen) {
        const ctx = obtenerAudioCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const inicio = ctx.currentTime + (retrasoMs / 1000);
        osc.type = tipo || "sine";
        osc.frequency.value = frecuencia;
        gain.gain.setValueAtTime(volumen || 0.14, inicio);
        gain.gain.exponentialRampToValueAtTime(0.001, inicio + (duracionMs / 1000));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(inicio);
        osc.stop(inicio + (duracionMs / 1000) + 0.05);
    }

    function reproducirSonidoCorrectoMat() {
        tono(523, 105, 0, "triangle", 0.14);
        tono(659, 110, 90, "triangle", 0.14);
        tono(880, 170, 180, "triangle", 0.16);
    }

    function reproducirSonidoIncorrectoMat() {
        tono(235, 115, 0, "sawtooth", 0.10);
        tono(175, 190, 105, "sawtooth", 0.11);
    }

''' + marker
js = replace_once(js, marker, insert, 'audio matematicas')
js = replace_once(js,
'''    function fallo(texto) {
        feedback("matv9-feedback-mal", texto || "Intenta otra vez.");
        mostrarReaccion(false, texto || "Intenta otra vez.");
        vibrarError();
        destelloRojo();
    }''',
'''    function fallo(texto) {
        feedback("matv9-feedback-mal", texto || "Intenta otra vez.");
        mostrarReaccion(false, texto || "Intenta otra vez.");
        reproducirSonidoIncorrectoMat();
        vibrarError();
        destelloRojo();
    }''', 'fallo matematicas')
js = replace_once(js,
'''                    mostrarReaccion(true, "¡Excelente!");
                    celebrar();''',
'''                    mostrarReaccion(true, "¡Excelente!");
                    reproducirSonidoCorrectoMat();
                    celebrar();''', 'acierto matematicas')
write(path, js)

# ------------------------------------------------------------
# 4) ORACIONES: sonido de acierto/error además de vibración
# ------------------------------------------------------------
path = 'js/oraciones.js'
js = read(path)
old = '''    function success(msg){
     if(state.locked)return;state.locked=true;stopTimer();state.score++;$("score").textContent="⭐ "+state.score;$("feedback").className="feedback ok";$("feedback").textContent=msg;
     flashOk();confetti();react("🥳👏🏻");$("next").classList.remove("hidden");
    }
    function error(msg){
     $("feedback").className="feedback bad";$("feedback").textContent=msg;flashRed();react("😢👎🏻",700);if(navigator.vibrate)try{navigator.vibrate([160,70,160])}catch(e){}
    }'''
new = '''    let audioCtxJuego=null;
    function obtenerAudioCtxJuego(){
     if(!audioCtxJuego){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audioCtxJuego=new AC()}
     if(audioCtxJuego&&audioCtxJuego.state==="suspended")try{audioCtxJuego.resume()}catch(e){}
     return audioCtxJuego;
    }
    function tonoJuego(freq,dur,delay,tipo,vol){
     const ctx=obtenerAudioCtxJuego();if(!ctx)return;
     const o=ctx.createOscillator(),g=ctx.createGain(),ini=ctx.currentTime+(delay||0)/1000;
     o.type=tipo||"sine";o.frequency.value=freq;g.gain.setValueAtTime(vol||.14,ini);g.gain.exponentialRampToValueAtTime(.001,ini+dur/1000);
     o.connect(g);g.connect(ctx.destination);o.start(ini);o.stop(ini+dur/1000+.05);
    }
    function sonidoCorrectoJuego(){tonoJuego(523,105,0,"triangle",.14);tonoJuego(659,110,90,"triangle",.14);tonoJuego(880,170,180,"triangle",.16)}
    function sonidoIncorrectoJuego(){tonoJuego(235,115,0,"sawtooth",.10);tonoJuego(175,190,105,"sawtooth",.11)}

    function success(msg){
     if(state.locked)return;state.locked=true;stopTimer();state.score++;$("score").textContent="⭐ "+state.score;$("feedback").className="feedback ok";$("feedback").textContent=msg;
     sonidoCorrectoJuego();flashOk();confetti();react("🥳👏🏻");$("next").classList.remove("hidden");
    }
    function error(msg){
     $("feedback").className="feedback bad";$("feedback").textContent=msg;sonidoIncorrectoJuego();flashRed();react("😢👎🏻",700);if(navigator.vibrate)try{navigator.vibrate([160,70,160])}catch(e){}
    }'''
js = replace_once(js, old, new, 'sonidos oraciones')
write(path, js)

# ------------------------------------------------------------
# 5) CSS: 3 botones claros + previews que se repiten más
# ------------------------------------------------------------
path = 'css/quiz.css'
css = read(path)
marker = '/* ===== LSPedia UX Juegos V15: Quiz 3 botones + previews más visibles ===== */'
if marker not in css:
    css += r'''

/* ===== LSPedia UX Juegos V15: Quiz 3 botones + previews más visibles ===== */
.quiz-inicio-rapido-tres {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9px;
}
.quiz-inicio-rapido-tres .quiz-btn-jugar-rapido {
    grid-column: 1 / -1;
    min-height: 54px;
}
.quiz-inicio-rapido-tres .quiz-btn-configurar {
    min-height: 48px;
    border-radius: 14px;
    font-weight: 800;
    border: 2px solid #dbe5ef;
    background: #ffffff;
    color: #334155;
    box-shadow: 0 3px 10px rgba(15, 23, 42, .07);
    transition: transform .18s ease, border-color .18s ease, background-color .18s ease, box-shadow .18s ease;
}
.quiz-inicio-rapido-tres .quiz-btn-nivel:hover,
.quiz-inicio-rapido-tres .quiz-btn-nivel[aria-expanded="true"] {
    border-color: #22c55e;
    background: #f0fdf4;
    color: #166534;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, .10);
}
.quiz-inicio-rapido-tres .quiz-btn-modo:hover,
.quiz-inicio-rapido-tres .quiz-btn-modo[aria-expanded="true"] {
    border-color: #8b5cf6;
    background: #f5f3ff;
    color: #6d28d9;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, .10);
}
.quiz-inicio-rapido-tres .quiz-btn-configurar:active {
    transform: scale(.97);
}
.quiz-panel-config {
    margin-top: 10px;
    padding: 13px;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    animation: quizPanelAbre .26s ease-out;
}
@keyframes quizPanelAbre {
    from { opacity: 0; transform: translateY(-5px) scale(.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Las mini-demostraciones del menú antes terminaban demasiado rápido.
   Se repiten tres veces para que la persona tenga tiempo de entender qué
   hace cada juego sin convertir la pantalla en una animación permanente. */
#quizMenuJuegos .juego-preview,
#quizMenuJuegos .juego-preview * {
    animation-iteration-count: 3 !important;
}

@media (max-width: 420px) {
    .quiz-inicio-rapido-tres { gap: 7px; }
    .quiz-inicio-rapido-tres .quiz-btn-configurar { font-size: .84rem; padding: 9px 7px; }
}
@media (prefers-reduced-motion: reduce) {
    #quizMenuJuegos .juego-preview,
    #quizMenuJuegos .juego-preview * {
        animation: none !important;
    }
    .quiz-panel-config { animation: none; }
}
'''
write(path, css)

# ------------------------------------------------------------
# 6) PWA cache
# ------------------------------------------------------------
path = 'sw.js'
sw = read(path)
if 'const VERSION_APP = "v14";' in sw:
    sw = sw.replace('const VERSION_APP = "v14";', 'const VERSION_APP = "v15";', 1)
elif 'const VERSION_APP = "v15";' not in sw:
    raise SystemExit('No se encontró VERSION_APP v14/v15')
write(path, sw)

print('Parches aplicados correctamente')
