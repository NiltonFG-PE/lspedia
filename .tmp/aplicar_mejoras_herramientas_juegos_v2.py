from pathlib import Path
import re
import subprocess


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, text):
    Path(path).write_text(text, encoding="utf-8")


def replace_once(text, old, new, label):
    if old not in text:
        raise RuntimeError(f"No se encontro el bloque esperado: {label}")
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label, flags=re.S):
    text2, n = re.subn(pattern, repl, text, count=1, flags=flags)
    if n != 1:
        raise RuntimeError(f"No se pudo modificar {label}: coincidencias={n}")
    return text2


# ============================================================
# 1) INDEX.HTML: tarjetas visuales + descripciones + Quiz rápido
# ============================================================
path = "index.html"
html = read(path)

# Descripciones de Herramientas: menos lectura, pero explica la acción.
html = replace_once(
    html,
    '<span class="herr-movil-texto">Alfabeto y números</span>',
    '<span class="herr-movil-texto">Alfabeto y números</span><span class="herr-movil-desc">Mira, reconoce y practica letras y números</span>',
    "descripcion Alfabeto y numeros"
)
html = replace_once(
    html,
    '<span class="herr-movil-texto">Jugar</span>',
    '<span class="herr-movil-texto">Jugar</span><span class="herr-movil-desc">Aprende tocando, ordenando y resolviendo</span>',
    "descripcion Jugar"
)
html = replace_once(
    html,
    '<span class="herr-movil-texto">Subtítulos</span>',
    '<span class="herr-movil-texto">Subtítulos</span><span class="herr-movil-desc">Convierte la voz en texto en tiempo real</span>',
    "descripcion Subtitulos"
)

html = html.replace(
    '<p class="text-muted small text-center mb-4">Elige a qué quieres jugar.</p>',
    '<p class="text-muted small text-center mb-4 juegos-menu-subtitulo">Toca un juego. La animación te muestra qué harás.</p>',
    1
)

# Cada tarjeta cuenta visualmente su mecánica antes de leer el título.
def reemplazar_tarjeta(html, button_id, preview_class, preview_html, titulo, desc, aria):
    patron = rf'(<button[^>]*id="{re.escape(button_id)}"[^>]*>).*?(</button>)'
    nuevo = rf'''\1
                                <span class="juego-preview {preview_class}" aria-hidden="true">{preview_html}</span>
                                <span class="fw-bold juego-titulo">{titulo}</span>
                                <span class="juego-desc">{desc}</span>
                            \2'''
    out, n = re.subn(patron, nuevo, html, count=1, flags=re.S)
    if n != 1:
        raise RuntimeError(f"No se pudo modernizar tarjeta {button_id}")
    # Asegura aria-label descriptivo sin depender del contenido visual.
    out = re.sub(rf'(<button[^>]*id="{re.escape(button_id)}")([^>]*)(>)', lambda m: m.group(1) + re.sub(r'\s+aria-label="[^"]*"', '', m.group(2)) + f' aria-label="{aria}"' + m.group(3), out, count=1)
    return out

html = reemplazar_tarjeta(
    html, "btnMenuJuegoCompletar", "preview-completar",
    '<span class="jp-palabra"><b>C</b><b>A</b><b class="jp-hueco">_</b><b>A</b></span><i class="jp-ficha">S</i>',
    "Completar la palabra", "Lleva la letra al espacio", "Juego Completar la palabra"
)
html = reemplazar_tarjeta(
    html, "btnMenuJuegoUnir", "preview-unir",
    '<span class="jp-nodo jp-nodo-a">🖼️</span><span class="jp-linea"></span><span class="jp-nodo jp-nodo-b">CASA</span>',
    "Unir con flechas", "Conecta imagen y palabra", "Juego Unir con flechas"
)
html = reemplazar_tarjeta(
    html, "btnMenuJuegoQuiz", "preview-quiz",
    '<span class="jp-quiz-card"><b>?</b><i>✓</i></span><span class="jp-estrellas">★ ★</span>',
    "Quiz", "Mira, piensa y elige", "Juego Quiz"
)
html = reemplazar_tarjeta(
    html, "btnMenuJuegoMatematicas", "preview-matematicas",
    '<span class="jp-math"><b>3</b><i>+</i><b>2</b><em>=</em><strong>5</strong></span><span class="jp-dots">●●● + ●●</span>',
    "Matemáticas", "Junta, quita, agrupa y reparte", "Juego Matematicas"
)
html = reemplazar_tarjeta(
    html, "btnMenuJuegoOraciones", "preview-oraciones",
    '<span class="jp-chip jp-chip-1">NIÑO</span><span class="jp-chip jp-chip-2">TOMA</span><span class="jp-chip jp-chip-3">AGUA</span>',
    "Oraciones", "Ordena ideas y conversa mejor", "Juego Construye la oracion"
)

# Quiz: entrada simple (JUGAR) y configuración secundaria.
patron_quiz_config = r'''<p class="text-uppercase small fw-bold mb-2" style="color:#64748b; letter-spacing:0\.05em;">Nivel</p>\s*<div class="row g-2 mb-4" id="quizSelectorNivel"></div>\s*<p class="text-uppercase small fw-bold mb-2" style="color:#64748b; letter-spacing:0\.05em;">Modo de juego</p>\s*<div class="row g-2 mb-4" id="quizSelectorModo"></div>\s*<p class="text-center small mb-3" id="quizTotalDisponibles"></p>\s*<div class="text-center">\s*<button id="btnEmpezarQuiz" class="btn btn-warning fw-bold py-2 px-4 rounded-pill">▶ Empezar</button>\s*</div>'''
repl_quiz_config = '''<div class="quiz-inicio-rapido mb-3">
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
html = sub_once(html, patron_quiz_config, repl_quiz_config, "inicio rapido del Quiz")
write(path, html)


# ============================================================
# 2) CSS GENERAL: Herramientas moderno + transición entre vistas
# ============================================================
path = "css/estilos.css"
css = read(path)
marker = "/* ===== HERRAMIENTAS UX V2 ===== */"
if marker not in css:
    css += r'''

/* ===== HERRAMIENTAS UX V2 ===== */
/* Movimiento corto y con propósito: las tarjetas entran una vez y luego
   quedan tranquilas. Esto reduce ruido visual y hace más clara la jerarquía. */
#herramientasMenuMovil .herr-movil-icono img {
    animation: none !important;
}
#herramientasMenuMovil:not(.d-none) .col-12 {
    opacity: 0;
    transform: translateY(18px) scale(.985);
    animation: herrEntradaV2 .42s cubic-bezier(.22,.9,.28,1) forwards;
}
#herramientasMenuMovil:not(.d-none) .col-12:nth-child(1){animation-delay:.04s}
#herramientasMenuMovil:not(.d-none) .col-12:nth-child(2){animation-delay:.12s}
#herramientasMenuMovil:not(.d-none) .col-12:nth-child(3){animation-delay:.20s}
@keyframes herrEntradaV2{
    to{opacity:1;transform:translateY(0) scale(1)}
}
.herr-movil-btn{
    min-height:112px;
    border:1px solid rgba(148,163,184,.20) !important;
    box-shadow:0 10px 28px rgba(15,23,42,.09) !important;
    transition:transform .2s cubic-bezier(.22,.9,.28,1), box-shadow .2s ease, border-color .2s ease !important;
}
.herr-movil-btn:active{
    transform:scale(.975) !important;
    box-shadow:0 5px 15px rgba(15,23,42,.10) !important;
}
.herr-movil-btn .herr-movil-flecha{
    transition:transform .24s cubic-bezier(.22,.9,.28,1), box-shadow .2s ease;
}
.herr-movil-btn:hover .herr-movil-flecha,
.herr-movil-btn:focus-visible .herr-movil-flecha,
.herr-movil-btn:active .herr-movil-flecha{
    transform:translate(5px,-50%);
}
.herr-movil-desc{
    display:block;
    max-width:70%;
    margin-top:4px;
    color:#64748b;
    font-size:12.5px;
    line-height:1.28;
    font-weight:600;
}
/* Entrada lateral compartida al pasar Herramientas -> Jugar -> juego. */
.lsp-vista-juego-entrando{
    animation:lspVistaJuegoEntrar .34s cubic-bezier(.22,.9,.28,1) both;
}
.lsp-vista-juego-regresando{
    animation:lspVistaJuegoRegresar .30s cubic-bezier(.22,.9,.28,1) both;
}
@keyframes lspVistaJuegoEntrar{
    from{opacity:0;transform:translateX(20px) scale(.99)}
    to{opacity:1;transform:translateX(0) scale(1)}
}
@keyframes lspVistaJuegoRegresar{
    from{opacity:0;transform:translateX(-14px) scale(.99)}
    to{opacity:1;transform:translateX(0) scale(1)}
}
@media (prefers-reduced-motion: reduce){
    #herramientasMenuMovil:not(.d-none) .col-12,
    .lsp-vista-juego-entrando,
    .lsp-vista-juego-regresando{animation:none !important;opacity:1;transform:none}
}
'''
write(path, css)


# ============================================================
# 3) QUIZ.CSS: menú visual + previews + feedback compartido
# ============================================================
path = "css/quiz.css"
css = read(path)
marker = "/* ===== MENU JUGAR VISUAL V2 ===== */"
if marker not in css:
    css += r'''

/* ===== MENU JUGAR VISUAL V2 ===== */
#quizMenuJuegos .menu-juego-btn{
    position:relative;
    min-height:178px;
    overflow:hidden;
    gap:8px;
    padding:18px 10px 15px;
    border:1px solid #dce6f1;
    border-radius:22px;
    background:linear-gradient(180deg,#fff,#fbfdff);
    box-shadow:0 8px 24px rgba(15,23,42,.08);
    transition:transform .22s cubic-bezier(.22,.9,.28,1), box-shadow .22s ease, border-color .22s ease;
}
#quizMenuJuegos .menu-juego-btn::after{
    content:"";position:absolute;inset:auto -35% -55% auto;width:120px;height:120px;border-radius:50%;
    background:radial-gradient(circle,rgba(37,99,235,.09),transparent 70%);pointer-events:none
}
#quizMenuJuegos .menu-juego-btn:hover,
#quizMenuJuegos .menu-juego-btn:focus-visible{
    transform:translateY(-4px);
    border-color:#bfdbfe;
    box-shadow:0 16px 34px rgba(15,23,42,.13);
}
#quizMenuJuegos .menu-juego-btn:active{transform:translateY(0) scale(.97)}
#quizMenuJuegos .juego-titulo{font-size:1rem;line-height:1.2;color:#111827}
#quizMenuJuegos .juego-desc{display:block;max-width:180px;color:#64748b;font-size:.74rem;line-height:1.25;font-weight:650}
.juegos-menu-subtitulo{font-size:.92rem !important}
.juego-preview{
    width:118px;height:68px;border-radius:18px;background:#f6f9fd;border:1px solid #e5edf6;
    display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;
    box-shadow:inset 0 1px 0 #fff;
}
.menu-juego-anim .juego-preview{animation:jpPreviewIn .42s cubic-bezier(.22,.9,.28,1) both}
@keyframes jpPreviewIn{from{opacity:0;transform:scale(.86)}to{opacity:1;transform:scale(1)}}
/* Completar: la ficha S viaja al hueco. */
.preview-completar .jp-palabra{display:flex;gap:3px;font-weight:950;color:#1e3a5f}
.preview-completar .jp-palabra b{width:22px;height:29px;display:grid;place-items:center;border-radius:7px;background:#fff;border:1px solid #dbe5ef}
.preview-completar .jp-hueco{border:2px dashed #60a5fa !important;color:#94a3b8}
.preview-completar .jp-ficha{position:absolute;bottom:4px;left:51px;width:22px;height:24px;display:grid;place-items:center;border-radius:7px;background:#2563eb;color:#fff;font-style:normal;font-weight:950}
.menu-juego-anim .preview-completar .jp-ficha{animation:jpFicha .95s .25s cubic-bezier(.22,.9,.28,1) both}
@keyframes jpFicha{0%{transform:translateY(0)}70%,100%{transform:translateY(-34px)}}
/* Unir: la línea crece entre imagen y palabra. */
.preview-unir{justify-content:space-between;padding:0 10px}
.preview-unir .jp-nodo{z-index:2;background:#fff;border:2px solid #dbe5ef;border-radius:10px;padding:7px;font-size:.78rem;font-weight:900}
.preview-unir .jp-linea{position:absolute;left:37px;right:39px;height:4px;border-radius:99px;background:#38bdf8;transform-origin:left center}
.menu-juego-anim .preview-unir .jp-linea{animation:jpLinea .7s .28s ease both}
@keyframes jpLinea{from{transform:scaleX(0)}to{transform:scaleX(1)}}
/* Quiz: la tarjeta cambia de ? a ✓. */
.preview-quiz{flex-direction:column;gap:3px}
.jp-quiz-card{width:42px;height:42px;border-radius:12px;background:#fff;border:2px solid #c7d2fe;display:grid;place-items:center;position:relative;font-size:1.2rem;font-weight:950;color:#4f46e5}
.jp-quiz-card i{position:absolute;opacity:0;color:#16a34a;font-style:normal;font-size:1.5rem}
.menu-juego-anim .jp-quiz-card b{animation:jpQuizQ 1.15s .25s both}
.menu-juego-anim .jp-quiz-card i{animation:jpQuizOk 1.15s .25s both}
@keyframes jpQuizQ{0%,48%{opacity:1;transform:rotateY(0)}60%,100%{opacity:0;transform:rotateY(90deg)}}
@keyframes jpQuizOk{0%,52%{opacity:0;transform:scale(.6)}70%,100%{opacity:1;transform:scale(1)}}
.jp-estrellas{font-size:.62rem;color:#f59e0b;letter-spacing:3px}
/* Matemáticas: símbolo + y resultado resaltan. */
.preview-matematicas{flex-direction:column;gap:2px}
.jp-math{display:flex;gap:5px;align-items:center;font-weight:950;color:#172033}.jp-math i{font-style:normal;color:#2563eb;font-size:1.25rem}.jp-math em{font-style:normal;color:#64748b}.jp-math strong{color:#16a34a}
.jp-dots{font-size:.62rem;color:#2563eb;letter-spacing:1px}
.menu-juego-anim .jp-math i{animation:jpMas .85s .25s ease both}
@keyframes jpMas{50%{transform:scale(1.45) rotate(-8deg)}}
/* Oraciones: las tres fichas entran en secuencia. */
.preview-oraciones{gap:4px;align-items:flex-end;padding-bottom:12px}
.preview-oraciones .jp-chip{font-size:.57rem;font-weight:950;color:#fff;border-radius:7px;padding:5px 4px}
.jp-chip-1{background:#2563eb}.jp-chip-2{background:#e5484d}.jp-chip-3{background:#16a34a}
.menu-juego-anim .jp-chip-1{animation:jpChip .45s .12s both}.menu-juego-anim .jp-chip-2{animation:jpChip .45s .24s both}.menu-juego-anim .jp-chip-3{animation:jpChip .45s .36s both}
@keyframes jpChip{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}

/* Inicio rápido del Quiz. */
.quiz-inicio-rapido{display:grid;grid-template-columns:1fr 1fr;gap:9px;max-width:480px;margin-left:auto;margin-right:auto}
.quiz-btn-jugar-rapido,.quiz-btn-configurar{border:0;border-radius:16px;padding:13px 10px;font-weight:900}
.quiz-btn-jugar-rapido{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#111827;box-shadow:0 8px 18px rgba(245,158,11,.25)}
.quiz-btn-configurar{background:#eef2ff;color:#4338ca;border:2px solid #c7d2fe}
.quiz-configuracion{margin-top:12px;padding:14px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;animation:quizFadeIn .25s ease}

/* Feedback visual común para Quiz / Completar / Unir. */
.lsp-game-flash-ok,.lsp-game-flash-error,.lsp-game-reaccion,.lsp-game-confeti{position:fixed;inset:0;pointer-events:none}
.lsp-game-flash-ok{z-index:12050;background:radial-gradient(circle,rgba(255,255,255,.96),rgba(220,252,231,.78) 45%,transparent 76%);animation:lspGameFlash .72s ease-out forwards}
.lsp-game-flash-error{z-index:12050;background:rgba(220,38,38,.54);animation:lspGameFlash .48s ease-out forwards}
@keyframes lspGameFlash{0%{opacity:0}18%{opacity:1}100%{opacity:0}}
.lsp-game-reaccion{z-index:12052;display:grid;place-items:center}
.lsp-game-reaccion>div{font-size:3.1rem;background:rgba(255,255,255,.94);border-radius:24px;padding:12px 18px;box-shadow:0 14px 38px rgba(15,23,42,.25);animation:quizVideoOpcionCorrecta .42s ease}
.lsp-game-confeti{z-index:12051;overflow:hidden}
.lsp-game-confeti i{position:absolute;top:-28px;width:9px;height:18px;border-radius:3px;animation:lspGameCaer 1.45s linear forwards}
@keyframes lspGameCaer{to{transform:translateY(112vh) rotate(640deg)}}
@media(max-width:420px){#quizMenuJuegos .menu-juego-btn{min-height:166px;padding:14px 7px}.juego-preview{width:106px}.quiz-inicio-rapido{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.menu-juego-anim .juego-preview,.menu-juego-anim .juego-preview *,.lsp-game-flash-ok,.lsp-game-flash-error,.lsp-game-reaccion>div,.lsp-game-confeti i{animation:none !important}}
'''
write(path, css)


# ============================================================
# 4) ALFABETIZACION.CSS: movimiento de letra + línea que sigue el dedo
# ============================================================
path = "css/alfabetizacion.css"
css = read(path)
marker = "/* ===== JUEGOS TACTILES V2 ===== */"
if marker not in css:
    css += r'''

/* ===== JUEGOS TACTILES V2 ===== */
.completar-letra-viajera{
    position:fixed;z-index:12100;pointer-events:none;display:grid;place-items:center;
    width:48px;height:48px;border-radius:14px;background:#2563eb;color:#fff;
    font-size:1.35rem;font-weight:950;box-shadow:0 12px 28px rgba(37,99,235,.30);
    transition:left .42s cubic-bezier(.22,.9,.28,1),top .42s cubic-bezier(.22,.9,.28,1),transform .42s cubic-bezier(.22,.9,.28,1),opacity .42s ease
}
.completar-mano-guia{position:fixed;z-index:12101;pointer-events:none;font-size:2.25rem;filter:drop-shadow(0 5px 7px rgba(15,23,42,.20));transition:left .8s cubic-bezier(.22,.9,.28,1),top .8s cubic-bezier(.22,.9,.28,1)}
.completar-guia-clon{position:fixed;z-index:12100;pointer-events:none;transition:left .8s cubic-bezier(.22,.9,.28,1),top .8s cubic-bezier(.22,.9,.28,1),transform .8s cubic-bezier(.22,.9,.28,1);box-shadow:0 10px 24px rgba(15,23,42,.18)}
.alfab-unir-item.unir-arrastrando{transform:scale(1.04);box-shadow:0 10px 24px rgba(37,99,235,.22);border-color:#3b82f6 !important}
.unir-linea-arrastre{position:fixed;inset:0;width:100vw;height:100vh;z-index:12090;pointer-events:none}
@media(prefers-reduced-motion:reduce){.completar-letra-viajera,.completar-mano-guia,.completar-guia-clon{transition:none}}
'''
write(path, css)


# ============================================================
# 5) SCRIPT.JS: historial unificado + feedback + transiciones
# ============================================================
path = "js/script.js"
js = read(path)

historial_code = r'''
// --- HISTORIAL UNIFICADO DE JUEGOS (Android Atrás / Adelante) ---
// Cada nivel de navegación tiene URL propia: Herramientas -> Jugar -> juego
// -> partida. Los botones visibles de volver usan la misma pila que el
// botón/gesto Atrás del celular, evitando dos comportamientos distintos.
const HistorialJuegosLSPedia = (function(){
    function construirUrl(juego, pantalla, extra = {}){
        const params = new URLSearchParams();
        params.set("vista", "herramientas-jugar");
        if(juego) params.set("juego", juego);
        if(pantalla && pantalla !== "menu") params.set("pantalla", pantalla);
        Object.entries(extra || {}).forEach(([k,v]) => {
            if(v !== undefined && v !== null && String(v) !== "") params.set(k, String(v));
        });
        return window.location.pathname + "?" + params.toString();
    }

    function registrarJuego(juego, pantalla = "menu", extra = {}){
        if(restaurandoHistorialNavegador) return;
        const url = construirUrl(juego, pantalla, extra);
        if(url === urlRelativaActual()) return;
        window.history.pushState({ tipo:"juego", vista:"herramientas-jugar", juego, pantalla, ...extra }, "", url);
    }

    function registrarPantallaMatematicas(pantalla, operacion){
        registrarJuego("matematicas", pantalla || "menu", { operacion: operacion || "" });
    }

    function volverAlMenuJuegos(){
        const params = new URLSearchParams(window.location.search);
        if(params.get("vista") === "herramientas-jugar" && params.get("juego") && window.history.length > 1){
            window.history.back();
            return;
        }
        mostrarMenuJuegos();
        actualizarVistaUrl("herramientas-jugar");
    }

    function restaurarJuegoDesdeUrl(){
        const params = new URLSearchParams(window.location.search);
        if(params.get("vista") !== "herramientas-jugar") return false;
        const juego = params.get("juego");
        if(!juego) return false;

        if(juego === "completar"){ abrirJuegoCompletar({ sinHistorial:true }); return true; }
        if(juego === "unir"){ abrirJuegoUnir({ sinHistorial:true }); return true; }
        if(juego === "quiz"){ abrirJuegoQuiz({ sinHistorial:true }); return true; }
        if(juego === "matematicas"){
            if(window.MatematicasV2 && typeof MatematicasV2.restaurarDesdeHistorial === "function"){
                MatematicasV2.restaurarDesdeHistorial();
            } else {
                abrirJuegoMatematicas({ sinHistorial:true });
            }
            return true;
        }
        if(juego === "oraciones" && window.OracionesV2){
            if(typeof OracionesV2.restaurarDesdeUrl === "function") OracionesV2.restaurarDesdeUrl();
            else if(typeof OracionesV2.iniciar === "function") OracionesV2.iniciar({ sinHistorial:true });
            return true;
        }
        return false;
    }

    return { registrarJuego, registrarPantallaMatematicas, volverAlMenuJuegos, restaurarJuegoDesdeUrl };
})();
window.HistorialJuegosLSPedia = HistorialJuegosLSPedia;

// Feedback compartido: mismo lenguaje visual en Quiz, Completar y Unir.
const FeedbackJuegosLSPedia = (function(){
    function limpiar(clase){ document.querySelectorAll("." + clase).forEach(n => n.remove()); }
    function reaccion(emoji, duracion = 720){
        limpiar("lsp-game-reaccion");
        const capa = document.createElement("div");
        capa.className = "lsp-game-reaccion";
        capa.innerHTML = "<div>" + emoji + "</div>";
        document.body.appendChild(capa);
        setTimeout(() => capa.remove(), duracion);
    }
    function confeti(){
        limpiar("lsp-game-confeti");
        const capa = document.createElement("div"); capa.className = "lsp-game-confeti";
        const colores = ["#ef4444","#f59e0b","#22c55e","#06b6d4","#3b82f6","#8b5cf6","#ec4899"];
        for(let i=0;i<18;i++){
            const p=document.createElement("i"); p.style.left=(Math.random()*100)+"vw";
            p.style.background=colores[i%colores.length]; p.style.animationDelay=(Math.random()*.16)+"s";
            capa.appendChild(p);
        }
        document.body.appendChild(capa); setTimeout(()=>capa.remove(),1700);
    }
    function flash(clase, ms){
        limpiar(clase); const n=document.createElement("div"); n.className=clase; document.body.appendChild(n); setTimeout(()=>n.remove(),ms);
    }
    function correcto(opciones = {}){
        flash("lsp-game-flash-ok", 760); reaccion("🥳👏🏻"); if(opciones.confeti !== false) confeti();
    }
    function error(){
        flash("lsp-game-flash-error", 520); reaccion("😢👎🏻", 650);
        if(navigator.vibrate){ try{ navigator.vibrate([150,60,150]); }catch(_){} }
    }
    return { correcto, error };
})();
window.FeedbackJuegosLSPedia = FeedbackJuegosLSPedia;

function animarEntradaVistaJuego(nodo, regreso = false){
    if(!nodo) return;
    nodo.classList.remove("lsp-vista-juego-entrando", "lsp-vista-juego-regresando");
    void nodo.offsetWidth;
    nodo.classList.add(regreso ? "lsp-vista-juego-regresando" : "lsp-vista-juego-entrando");
    setTimeout(() => nodo.classList.remove("lsp-vista-juego-entrando", "lsp-vista-juego-regresando"), 430);
}
'''

marker = 'const PANTALLAS_SECCION_JUEGOS = ['
if "const HistorialJuegosLSPedia" not in js:
    if marker not in js:
        raise RuntimeError("No se encontro PANTALLAS_SECCION_JUEGOS")
    js = js.replace(marker, historial_code + "\n" + marker, 1)

# mostrarPantallaJuegos aplica transición moderna.
old = '''function mostrarPantallaJuegos(id){
    ocultarPantallasJuegos();
    const n = document.getElementById(id);
    if(n) n.classList.remove("d-none");
    if(id === "quizMenuJuegos") reproducirAnimacionMenuJuegos();
}'''
new = '''function mostrarPantallaJuegos(id){
    ocultarPantallasJuegos();
    const n = document.getElementById(id);
    if(n){
        n.classList.remove("d-none");
        animarEntradaVistaJuego(n, id === "quizMenuJuegos");
    }
    if(id === "quizMenuJuegos") reproducirAnimacionMenuJuegos();
}'''
js = replace_once(js, old, new, "transicion mostrarPantallaJuegos")

# Registrar cada juego como un escalón real de historial.
for nombre, juego, llamada in [
    ("abrirJuegoCompletar", "completar", 'mostrarPantallaJuegos("quizCargando");\n    if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.mostrarJuego === "function") AlfabetizacionV2.mostrarJuego("completar");'),
    ("abrirJuegoUnir", "unir", 'mostrarPantallaJuegos("quizCargando");\n    if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.mostrarJuego === "function") AlfabetizacionV2.mostrarJuego("unir");'),
    ("abrirJuegoQuiz", "quiz", 'mostrarPantallaJuegos("quizCargando");\n    if(window.QuizV2 && typeof QuizV2.iniciar === "function") QuizV2.iniciar();'),
    ("abrirJuegoMatematicas", "matematicas", 'mostrarPantallaJuegos("matApp");\n    if(window.MatematicasV2 && typeof MatematicasV2.iniciar === "function") MatematicasV2.iniciar();')
]:
    oldf = f'''function {nombre}(){{\n    {llamada}\n}}'''
    newf = f'''function {nombre}(opciones = {{}}){{\n    if(!opciones.sinHistorial) HistorialJuegosLSPedia.registrarJuego("{juego}", "menu");\n    {llamada}\n}}'''
    js = replace_once(js, oldf, newf, nombre)

js = replace_once(
    js,
    '''document.querySelectorAll(".btn-volver-menu-juegos").forEach((btn) => {
    btn.addEventListener("click", mostrarMenuJuegos);
});''',
    '''document.querySelectorAll(".btn-volver-menu-juegos").forEach((btn) => {
    btn.addEventListener("click", () => HistorialJuegosLSPedia.volverAlMenuJuegos());
});''',
    "botones volver menu juegos"
)

# Tras el popstate general, restaura el juego concreto (si la URL lo incluye).
if 'HistorialJuegosLSPedia.restaurarJuegoDesdeUrl()' not in js.split('window.addEventListener("popstate"',1)[1]:
    old_pop = '''window.addEventListener("popstate", (evento) => {
    restaurarInterfazDesdeHistorial(evento.state || {});
});'''
    new_pop = '''window.addEventListener("popstate", (evento) => {
    restaurarInterfazDesdeHistorial(evento.state || {});
    setTimeout(() => HistorialJuegosLSPedia.restaurarJuegoDesdeUrl(), 45);
});
window.addEventListener("load", () => {
    setTimeout(() => HistorialJuegosLSPedia.restaurarJuegoDesdeUrl(), 850);
});'''
    js = replace_once(js, old_pop, new_pop, "restauracion juegos en popstate/load")

write(path, js)


# ============================================================
# 6) ALFABETIZACION.JS: letra que viaja + mano guía + drag con línea
# ============================================================
path = "js/alfabetizacion.js"
a = read(path)

# Registrar partida al iniciar los dos juegos.
a = replace_once(
    a,
    '''    function iniciarJuegoCompletar() {
        const nivel = nivelCompletarActual();''',
    '''    function iniciarJuegoCompletar() {
        if(window.HistorialJuegosLSPedia && typeof HistorialJuegosLSPedia.registrarJuego === "function"){
            HistorialJuegosLSPedia.registrarJuego("completar", "partida", { nivel: estado.completar.nivelId || "" });
        }
        const nivel = nivelCompletarActual();''',
    "historial partida Completar"
)
a = replace_once(
    a,
    '''    function iniciarJuegoUnir() {
        estado.unir.ronda = 0;''',
    '''    function iniciarJuegoUnir() {
        if(window.HistorialJuegosLSPedia && typeof HistorialJuegosLSPedia.registrarJuego === "function"){
            HistorialJuegosLSPedia.registrarJuego("unir", "partida", { nivel: estado.unir.nivelId || "" });
        }
        estado.unir.ronda = 0;''',
    "historial partida Unir"
)

# Letra viaja al hueco y, si tarda, una mano enseña la acción sin responder por la persona.
helper_completar = r'''
    function animarLetraHaciaCasilla(letra, btnEl, callback){
        const pregunta = estado.completar.preguntas[estado.completar.indice];
        const indiceBlanco = pregunta && pregunta._indicesBlanco ? pregunta._indicesBlanco[estado.completar.subIndice] : null;
        const destino = indiceBlanco !== null ? el("completarCasilla" + indiceBlanco) : null;
        if(!btnEl || !destino || window.matchMedia("(prefers-reduced-motion: reduce)").matches){ callback(); return; }
        const a = btnEl.getBoundingClientRect();
        const b = destino.getBoundingClientRect();
        const ficha = document.createElement("div");
        ficha.className = "completar-letra-viajera";
        ficha.textContent = letra;
        ficha.style.left = (a.left + a.width/2 - 24) + "px";
        ficha.style.top = (a.top + a.height/2 - 24) + "px";
        document.body.appendChild(ficha);
        requestAnimationFrame(() => {
            ficha.style.left = (b.left + b.width/2 - 24) + "px";
            ficha.style.top = (b.top + b.height/2 - 24) + "px";
            ficha.style.transform = "scale(.82)";
        });
        setTimeout(() => { ficha.remove(); callback(); }, 440);
    }

    function programarGuiaVisualCompletar(){
        const indicePregunta = estado.completar.indice;
        const subIndice = estado.completar.subIndice;
        setTimeout(() => {
            if(estado.completar.respondida || estado.completar.blancoRespondido) return;
            if(estado.completar.indice !== indicePregunta || estado.completar.subIndice !== subIndice) return;
            const pregunta = estado.completar.preguntas[indicePregunta];
            if(!pregunta) return;
            const letraCorrecta = pregunta._letrasCorrectas[subIndice];
            const indiceBlanco = pregunta._indicesBlanco[subIndice];
            const destino = el("completarCasilla" + indiceBlanco);
            const opciones = Array.from(document.querySelectorAll("#alfabCompletarOpciones .completar-opcion-letra"));
            const origen = opciones.find(b => b.textContent.trim().toUpperCase() === String(letraCorrecta).toUpperCase());
            if(!origen || !destino) return;
            const ro = origen.getBoundingClientRect(), rd = destino.getBoundingClientRect();
            const clon = origen.cloneNode(true); clon.classList.add("completar-guia-clon");
            clon.style.left=ro.left+"px"; clon.style.top=ro.top+"px"; clon.style.width=ro.width+"px"; clon.style.height=ro.height+"px";
            const mano=document.createElement("div"); mano.className="completar-mano-guia"; mano.textContent="👆";
            mano.style.left=(ro.left+ro.width*.55)+"px"; mano.style.top=(ro.top+ro.height*.60)+"px";
            document.body.append(clon,mano);
            requestAnimationFrame(()=>{
                clon.style.left=(rd.left+rd.width/2-ro.width/2)+"px"; clon.style.top=(rd.top+rd.height/2-ro.height/2)+"px";
                mano.style.left=(rd.left+rd.width*.55)+"px"; mano.style.top=(rd.top+rd.height*.60)+"px";
            });
            setTimeout(()=>{clon.remove();mano.remove()},900);
        }, 6000);
    }
'''
if "function animarLetraHaciaCasilla" not in a:
    a = a.replace("    function seleccionarOpcionCompletar(letra, btnEl) {", helper_completar + "\n    function seleccionarOpcionCompletar(letra, btnEl) {", 1)

old_click = '            btn.addEventListener("click", () => seleccionarOpcionCompletar(letra, btn));'
new_click = '            btn.addEventListener("click", () => animarLetraHaciaCasilla(letra, btn, () => seleccionarOpcionCompletar(letra, btn)));'
a = replace_once(a, old_click, new_click, "animacion al elegir letra")

# Programa la guía cada vez que se redibujan las opciones.
old_end_options = '''            btn.addEventListener("click", () => animarLetraHaciaCasilla(letra, btn, () => seleccionarOpcionCompletar(letra, btn)));
            filaOpciones.appendChild(btn);
        });
    }

    function animarLetraHaciaCasilla'''
new_end_options = '''            btn.addEventListener("click", () => animarLetraHaciaCasilla(letra, btn, () => seleccionarOpcionCompletar(letra, btn)));
            filaOpciones.appendChild(btn);
        });
        programarGuiaVisualCompletar();
    }

    function animarLetraHaciaCasilla'''
a = replace_once(a, old_end_options, new_end_options, "programar mano guia Completar")

# Feedback común en Completar.
old_feedback_comp = '''        if (esCorrecta) {
            estado.completar.puntaje += 10;
            estado.completar.racha++;
            reproducirSonidoCorrecto();
        } else {
            estado.completar.palabraTuvoError = true;
            estado.completar.racha = 0;
            reproducirSonidoIncorrecto();
        }'''
new_feedback_comp = '''        if (esCorrecta) {
            estado.completar.puntaje += 10;
            estado.completar.racha++;
            reproducirSonidoCorrecto();
            if(window.FeedbackJuegosLSPedia) FeedbackJuegosLSPedia.correcto({ confeti:true });
        } else {
            estado.completar.palabraTuvoError = true;
            estado.completar.racha = 0;
            reproducirSonidoIncorrecto();
            if(window.FeedbackJuegosLSPedia) FeedbackJuegosLSPedia.error();
        }'''
a = replace_once(a, old_feedback_comp, new_feedback_comp, "feedback Completar")

# Arrastre con línea viva para Unir, conservando tap como alternativa.
helper_unir = r'''
    function activarArrastreVisualUnir(elemento, tipo, indice){
        if(!elemento) return;
        elemento.dataset.unirTipo = tipo;
        elemento.dataset.unirIndice = String(indice);
        elemento.style.touchAction = "none";
        elemento.addEventListener("pointerdown", (ev) => {
            if(estado.unir.resueltos.has(indice)) return;
            const inicioX=ev.clientX, inicioY=ev.clientY;
            let activo=false;
            let svg=null, linea=null;
            const rect=elemento.getBoundingClientRect();
            const x1=rect.left+rect.width/2, y1=rect.top+rect.height/2;

            function mover(e){
                if(!activo && Math.hypot(e.clientX-inicioX,e.clientY-inicioY) < 7) return;
                if(!activo){
                    activo=true;
                    elemento.classList.add("unir-arrastrando");
                    svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
                    svg.classList.add("unir-linea-arrastre");
                    linea=document.createElementNS("http://www.w3.org/2000/svg","line");
                    linea.setAttribute("x1",x1); linea.setAttribute("y1",y1);
                    linea.setAttribute("x2",e.clientX); linea.setAttribute("y2",e.clientY);
                    linea.setAttribute("stroke", tipo === "imagen" ? "#38bdf8" : "#8b5cf6");
                    linea.setAttribute("stroke-width","5"); linea.setAttribute("stroke-linecap","round");
                    svg.appendChild(linea); document.body.appendChild(svg);
                } else if(linea){
                    linea.setAttribute("x2",e.clientX); linea.setAttribute("y2",e.clientY);
                }
            }
            function soltar(e){
                window.removeEventListener("pointermove",mover);
                window.removeEventListener("pointerup",soltar);
                window.removeEventListener("pointercancel",soltar);
                elemento.classList.remove("unir-arrastrando");
                if(svg) svg.remove();
                if(!activo) return;
                elemento.dataset.suprimirClickUnir="1";
                const destinoBruto=document.elementFromPoint(e.clientX,e.clientY);
                const destino=destinoBruto ? destinoBruto.closest(".alfab-unir-item") : null;
                if(destino && destino.dataset.unirTipo && destino.dataset.unirTipo !== tipo){
                    const indiceDestino=parseInt(destino.dataset.unirIndice,10);
                    alternarSeleccionUnir(tipo,indice,elemento);
                    alternarSeleccionUnir(destino.dataset.unirTipo,indiceDestino,destino);
                }
                setTimeout(()=>{elemento.dataset.suprimirClickUnir=""},80);
            }
            window.addEventListener("pointermove",mover);
            window.addEventListener("pointerup",soltar,{once:true});
            window.addEventListener("pointercancel",soltar,{once:true});
        });
    }
'''
if "function activarArrastreVisualUnir" not in a:
    a = a.replace("    // Toca un ítem (imagen o palabra).", helper_unir + "\n    // Toca un ítem (imagen o palabra).", 1)

old_img_listener = '            btn.addEventListener("click", () => alternarSeleccionUnir("imagen", idx, btn));\n            contImagenes.appendChild(btn);'
new_img_listener = '            btn.addEventListener("click", () => { if(btn.dataset.suprimirClickUnir !== "1") alternarSeleccionUnir("imagen", idx, btn); });\n            activarArrastreVisualUnir(btn, "imagen", idx);\n            contImagenes.appendChild(btn);'
a = replace_once(a, old_img_listener, new_img_listener, "drag imagen Unir")
old_word_listener = '            btn.addEventListener("click", () => alternarSeleccionUnir("palabra", idx, btn));\n            contPalabras.appendChild(btn);'
new_word_listener = '            btn.addEventListener("click", () => { if(btn.dataset.suprimirClickUnir !== "1") alternarSeleccionUnir("palabra", idx, btn); });\n            activarArrastreVisualUnir(btn, "palabra", idx);\n            contPalabras.appendChild(btn);'
a = replace_once(a, old_word_listener, new_word_listener, "drag palabra Unir")

old_sound_unir = '        if (huboErrores) reproducirSonidoIncorrecto(); else reproducirSonidoCorrecto();'
new_sound_unir = '''        if (huboErrores) {
            reproducirSonidoIncorrecto();
            if(window.FeedbackJuegosLSPedia) FeedbackJuegosLSPedia.error();
        } else {
            reproducirSonidoCorrecto();
            if(window.FeedbackJuegosLSPedia) FeedbackJuegosLSPedia.correcto({ confeti:rondaCompleta });
        }'''
a = replace_once(a, old_sound_unir, new_sound_unir, "feedback Unir")
write(path, a)


# ============================================================
# 7) QUIZ.JS: Jugar rápido + historial + feedback compartido
# ============================================================
path = "js/quiz.js"
q = read(path)

# Al mostrar intro, la configuración avanzada vuelve cerrada.
old_intro = '''    function mostrarIntro() {
        mostrarBloque("quizIntro");
        renderSelectorNivel();
        renderSelectorModo();
        actualizarConteoDisponibles();
    }'''
new_intro = '''    function mostrarIntro() {
        mostrarBloque("quizIntro");
        renderSelectorNivel();
        renderSelectorModo();
        actualizarConteoDisponibles();
        const config = el("quizConfiguracion");
        const btnConfig = el("btnQuizConfigurar");
        if(config) config.classList.add("d-none");
        if(btnConfig) btnConfig.setAttribute("aria-expanded", "false");
    }'''
q = replace_once(q, old_intro, new_intro, "mostrarIntro Quiz")

# Registro de partida para Atrás del celular.
q = replace_once(
    q,
    '    function empezarPartida() {',
    '''    function empezarPartida() {
        if(window.HistorialJuegosLSPedia && typeof HistorialJuegosLSPedia.registrarJuego === "function"){
            HistorialJuegosLSPedia.registrarJuego("quiz", "partida", { nivel: estado.nivel, modo: estado.modo });
        }''',
    "historial partida Quiz"
)

# Feedback común al responder.
old_eval = '''        if (esCorrecta) {
            estado.ronda.puntaje += calcularPuntos(pregunta.nivel, tiempoUsado, estado.temporizador.total);
            reproducirSonidoCorrecto();
        } else {
            reproducirSonidoIncorrecto();
        }'''
new_eval = '''        if (esCorrecta) {
            estado.ronda.puntaje += calcularPuntos(pregunta.nivel, tiempoUsado, estado.temporizador.total);
            reproducirSonidoCorrecto();
            if(window.FeedbackJuegosLSPedia) FeedbackJuegosLSPedia.correcto({ confeti:true });
        } else {
            reproducirSonidoIncorrecto();
            if(window.FeedbackJuegosLSPedia) FeedbackJuegosLSPedia.error();
        }'''
q = replace_once(q, old_eval, new_eval, "feedback Quiz")

# Botones JUGAR y Elegir nivel.
old_bind = '''        const btnEmpezar = el("btnEmpezarQuiz");
        if (btnEmpezar) btnEmpezar.addEventListener("click", empezarPartida);'''
new_bind = '''        const btnEmpezar = el("btnEmpezarQuiz");
        if (btnEmpezar) btnEmpezar.addEventListener("click", empezarPartida);

        const btnRapido = el("btnQuizJugarRapido");
        if(btnRapido) btnRapido.addEventListener("click", () => {
            estado.nivel = "Todos";
            estado.modo = "5"; // Aleatorio: entra sin obligar a configurar nada.
            empezarPartida();
        });

        const btnConfig = el("btnQuizConfigurar");
        if(btnConfig) btnConfig.addEventListener("click", () => {
            const panel = el("quizConfiguracion");
            if(!panel) return;
            const abrir = panel.classList.contains("d-none");
            panel.classList.toggle("d-none", !abrir);
            btnConfig.setAttribute("aria-expanded", abrir ? "true" : "false");
            if(abrir) panel.scrollIntoView({ behavior:"smooth", block:"nearest" });
        });'''
q = replace_once(q, old_bind, new_bind, "botones inicio rapido Quiz")
write(path, q)


# ============================================================
# 8) MATEMATICAS.JS: restauración real de menú/partida
# ============================================================
path = "js/matematicas.js"
m = read(path)
if "function restaurarDesdeHistorial()" not in m:
    marker = '''    function iniciar() {
        if (!asegurarUI()) return;'''
    restore = '''    function restaurarDesdeHistorial() {
        if (!asegurarUI()) return false;
        const params = new URLSearchParams(window.location.search);
        if(params.get("vista") !== "herramientas-jugar" || params.get("juego") !== "matematicas") return false;
        mostrarMenu();
        const pantalla = params.get("pantalla");
        const operacion = params.get("operacion");
        if(pantalla === "partida" && operacion && OPS[operacion]){
            iniciarPartida(operacion, { sinHistorial:true });
        }
        return true;
    }

'''
    if marker not in m:
        raise RuntimeError("No se encontro iniciar() de Matematicas")
    m = m.replace(marker, restore + marker, 1)
    m = replace_once(m, '    return { iniciar, salir };', '    return { iniciar, salir, restaurarDesdeHistorial };', "export restaurar Matematicas")
write(path, m)


# ============================================================
# 9) PWA: invalidar cache antiguo
# ============================================================
path = "sw.js"
sw = read(path)
sw2, n = re.subn(r'const VERSION_APP = "v\d+";', 'const VERSION_APP = "v14";', sw, count=1)
if n != 1:
    raise RuntimeError("No se pudo actualizar VERSION_APP de sw.js")
write(path, sw2)


# ============================================================
# VALIDACIONES
# ============================================================
for jsfile in ["js/script.js", "js/alfabetizacion.js", "js/quiz.js", "js/matematicas.js", "js/oraciones.js"]:
    r = subprocess.run(["node", "--check", jsfile], capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"node --check fallo en {jsfile}:\n{r.stderr}")

html_final = read("index.html")
for ident in ["btnMenuJuegoCompletar","btnMenuJuegoUnir","btnMenuJuegoQuiz","btnMenuJuegoMatematicas","btnMenuJuegoOraciones","btnQuizJugarRapido","btnQuizConfigurar","quizConfiguracion"]:
    if html_final.count(f'id="{ident}"') != 1:
        raise RuntimeError(f"ID ausente o duplicado en index.html: {ident}")

script_final = read("js/script.js")
for token in ["HistorialJuegosLSPedia", "FeedbackJuegosLSPedia", "volverAlMenuJuegos", "restaurarJuegoDesdeUrl"]:
    if token not in script_final:
        raise RuntimeError(f"Falta token de integracion: {token}")

alf_final = read("js/alfabetizacion.js")
for token in ["animarLetraHaciaCasilla", "programarGuiaVisualCompletar", "activarArrastreVisualUnir"]:
    if token not in alf_final:
        raise RuntimeError(f"Falta mejora de alfabetizacion: {token}")

print("OK: mejoras de Herramientas/Jugar aplicadas y JavaScript validado")
