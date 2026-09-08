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


def append_once(text, marker, block):
    if marker in text:
        return text
    return text + "\n\n" + block.strip() + "\n"


def replace_button_content(html, button_id, inner, aria):
    pattern = rf'(<button[^>]*id="{re.escape(button_id)}"[^>]*>)(.*?)(</button>)'
    m = re.search(pattern, html, flags=re.S)
    if not m:
        raise RuntimeError(f"No se encontro tarjeta {button_id}")
    opening = m.group(1)
    if 'aria-label=' not in opening:
        opening = opening[:-1] + f' aria-label="{aria}">'
    replacement = opening + "\n" + inner + "\n                            " + m.group(3)
    return html[:m.start()] + replacement + html[m.end():]


# ============================================================
# 1) INDEX.HTML — Herramientas y menú Jugar más visuales
# ============================================================
path = "index.html"
html = read(path)

html = replace_once(
    html,
    '<span class="herr-movil-texto">Alfabeto y números</span>',
    '<span class="herr-movil-texto">Alfabeto y números</span><span class="herr-movil-desc">Mira, reconoce y practica letras y números</span>',
    "descripcion Alfabeto"
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
html = replace_once(
    html,
    '<p class="text-muted small text-center mb-4">Elige a qué quieres jugar.</p>',
    '<p class="text-muted small text-center mb-4 juegos-menu-subtitulo">Toca un juego. La animación te muestra qué harás.</p>',
    "subtitulo Jugar"
)

html = replace_button_content(
    html, "btnMenuJuegoCompletar",
    '''                                <span class="juego-preview preview-completar" aria-hidden="true">
                                    <span class="jp-palabra"><b>C</b><b>A</b><b class="jp-hueco">_</b><b>A</b></span><i class="jp-ficha">S</i>
                                </span>
                                <span class="fw-bold juego-titulo">Completar la palabra</span>
                                <span class="juego-desc">Lleva la letra al espacio</span>''',
    "Juego Completar la palabra"
)
html = replace_button_content(
    html, "btnMenuJuegoUnir",
    '''                                <span class="juego-preview preview-unir" aria-hidden="true">
                                    <span class="jp-nodo jp-nodo-a">🖼️</span><span class="jp-linea"></span><span class="jp-nodo jp-nodo-b">CASA</span>
                                </span>
                                <span class="fw-bold juego-titulo">Unir con flechas</span>
                                <span class="juego-desc">Arrastra y conecta</span>''',
    "Juego Unir con flechas"
)
html = replace_button_content(
    html, "btnMenuJuegoQuiz",
    '''                                <span class="juego-preview preview-quiz" aria-hidden="true">
                                    <span class="jp-quiz-card"><b>?</b><i>✓</i></span><span class="jp-estrellas">★ ★</span>
                                </span>
                                <span class="fw-bold juego-titulo">Quiz</span>
                                <span class="juego-desc">Mira, piensa y elige</span>''',
    "Juego Quiz"
)
html = replace_button_content(
    html, "btnMenuJuegoMatematicas",
    '''                                <span class="juego-preview preview-matematicas" aria-hidden="true">
                                    <span class="jp-math"><b>3</b><i>+</i><b>2</b><em>=</em><strong>5</strong></span><span class="jp-dots">●●● + ●●</span>
                                </span>
                                <span class="fw-bold juego-titulo">Matemáticas</span>
                                <span class="juego-desc">Junta, quita, agrupa y reparte</span>''',
    "Juego Matematicas"
)
html = replace_button_content(
    html, "btnMenuJuegoOraciones",
    '''                                <span class="juego-preview preview-oraciones" aria-hidden="true">
                                    <span class="jp-chip jp-chip-1">NIÑO</span><span class="jp-chip jp-chip-2">TOMA</span><span class="jp-chip jp-chip-3">AGUA</span>
                                </span>
                                <span class="fw-bold juego-titulo">Oraciones</span>
                                <span class="juego-desc">Ordena ideas y conversa mejor</span>''',
    "Juego Construye la oracion"
)

quiz_old = '''                        <p class="text-uppercase small fw-bold mb-2" style="color:#64748b; letter-spacing:0.05em;">Nivel</p>
                        <div class="row g-2 mb-4" id="quizSelectorNivel"></div>

                        <p class="text-uppercase small fw-bold mb-2" style="color:#64748b; letter-spacing:0.05em;">Modo de juego</p>
                        <div class="row g-2 mb-4" id="quizSelectorModo"></div>

                        <p class="text-center small mb-3" id="quizTotalDisponibles"></p>
                        <div class="text-center">
                            <button id="btnEmpezarQuiz" class="btn btn-warning fw-bold py-2 px-4 rounded-pill">▶ Empezar</button>
                        </div>'''
quiz_new = '''                        <div class="quiz-inicio-rapido mb-3">
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
html = replace_once(html, quiz_old, quiz_new, "inicio rapido Quiz")
write(path, html)


# ============================================================
# 2) ESTILOS — animaciones modernas con movimiento corto y útil
# ============================================================
path = "css/estilos.css"
css = read(path)
css = append_once(css, "/* ===== HERRAMIENTAS UX V3 ===== */", r'''
/* ===== HERRAMIENTAS UX V3 ===== */
#herramientasMenuMovil .herr-movil-icono img{animation:none!important}
#herramientasMenuMovil:not(.d-none) .col-12{
  opacity:0;transform:translateY(18px) scale(.985);
  animation:herrEntradaV3 .42s cubic-bezier(.22,.9,.28,1) forwards
}
#herramientasMenuMovil:not(.d-none) .col-12:nth-child(1){animation-delay:.04s}
#herramientasMenuMovil:not(.d-none) .col-12:nth-child(2){animation-delay:.12s}
#herramientasMenuMovil:not(.d-none) .col-12:nth-child(3){animation-delay:.20s}
@keyframes herrEntradaV3{to{opacity:1;transform:translateY(0) scale(1)}}
.herr-movil-btn{
  min-height:116px;border:1px solid rgba(148,163,184,.22)!important;
  box-shadow:0 10px 28px rgba(15,23,42,.09)!important;
  transition:transform .2s cubic-bezier(.22,.9,.28,1),box-shadow .2s ease,border-color .2s ease!important
}
.herr-movil-btn:active{transform:scale(.975)!important;box-shadow:0 5px 15px rgba(15,23,42,.10)!important}
.herr-movil-btn .herr-movil-flecha{transition:transform .24s cubic-bezier(.22,.9,.28,1)}
.herr-movil-btn:hover .herr-movil-flecha,.herr-movil-btn:focus-visible .herr-movil-flecha,.herr-movil-btn:active .herr-movil-flecha{transform:translate(5px,-50%)}
.herr-movil-desc{display:block;max-width:76%;margin-top:4px;color:#64748b;font-size:12.5px;line-height:1.28;font-weight:650}
.lsp-vista-juego-entrando{animation:lspVistaJuegoEntrarV3 .34s cubic-bezier(.22,.9,.28,1) both}
.lsp-vista-juego-regresando{animation:lspVistaJuegoRegresarV3 .30s cubic-bezier(.22,.9,.28,1) both}
@keyframes lspVistaJuegoEntrarV3{from{opacity:0;transform:translateX(20px) scale(.99)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes lspVistaJuegoRegresarV3{from{opacity:0;transform:translateX(-14px) scale(.99)}to{opacity:1;transform:translateX(0) scale(1)}}
@media(prefers-reduced-motion:reduce){
 #herramientasMenuMovil:not(.d-none) .col-12,.lsp-vista-juego-entrando,.lsp-vista-juego-regresando{animation:none!important;opacity:1;transform:none}
}
''')
write(path, css)

path = "css/quiz.css"
css = read(path)
css = append_once(css, "/* ===== MENU JUGAR VISUAL V3 ===== */", r'''
/* ===== MENU JUGAR VISUAL V3 ===== */
#quizMenuJuegos .menu-juego-btn{
 position:relative;min-height:178px;overflow:hidden;gap:8px;padding:18px 10px 15px;
 border:1px solid #dce6f1;border-radius:22px;background:linear-gradient(180deg,#fff,#fbfdff);
 box-shadow:0 8px 24px rgba(15,23,42,.08);
 transition:transform .22s cubic-bezier(.22,.9,.28,1),box-shadow .22s ease,border-color .22s ease
}
#quizMenuJuegos .menu-juego-btn:hover,#quizMenuJuegos .menu-juego-btn:focus-visible{transform:translateY(-4px);border-color:#bfdbfe;box-shadow:0 16px 34px rgba(15,23,42,.13)}
#quizMenuJuegos .menu-juego-btn:active{transform:translateY(0) scale(.97)}
#quizMenuJuegos .juego-titulo{font-size:1rem;line-height:1.2;color:#111827}
#quizMenuJuegos .juego-desc{display:block;max-width:180px;color:#64748b;font-size:.74rem;line-height:1.25;font-weight:650}
.juegos-menu-subtitulo{font-size:.92rem!important}
.juego-preview{width:118px;height:68px;border-radius:18px;background:#f6f9fd;border:1px solid #e5edf6;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;box-shadow:inset 0 1px 0 #fff}
.menu-juego-anim .juego-preview{animation:jpPreviewInV3 .42s cubic-bezier(.22,.9,.28,1) both}
@keyframes jpPreviewInV3{from{opacity:0;transform:scale(.86)}to{opacity:1;transform:scale(1)}}
.preview-completar .jp-palabra{display:flex;gap:3px;font-weight:950;color:#1e3a5f}
.preview-completar .jp-palabra b{width:22px;height:29px;display:grid;place-items:center;border-radius:7px;background:#fff;border:1px solid #dbe5ef}
.preview-completar .jp-hueco{border:2px dashed #60a5fa!important;color:#94a3b8}
.preview-completar .jp-ficha{position:absolute;bottom:4px;left:51px;width:22px;height:24px;display:grid;place-items:center;border-radius:7px;background:#2563eb;color:#fff;font-style:normal;font-weight:950}
.menu-juego-anim .preview-completar .jp-ficha{animation:jpFichaV3 .95s .25s cubic-bezier(.22,.9,.28,1) both}
@keyframes jpFichaV3{0%{transform:translateY(0)}70%,100%{transform:translateY(-34px)}}
.preview-unir{justify-content:space-between;padding:0 10px}.preview-unir .jp-nodo{z-index:2;background:#fff;border:2px solid #dbe5ef;border-radius:10px;padding:7px;font-size:.72rem;font-weight:900}
.preview-unir .jp-linea{position:absolute;left:37px;right:39px;height:4px;border-radius:99px;background:#38bdf8;transform-origin:left center}
.menu-juego-anim .preview-unir .jp-linea{animation:jpLineaV3 .7s .28s ease both}@keyframes jpLineaV3{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.preview-quiz{flex-direction:column;gap:3px}.jp-quiz-card{width:42px;height:42px;border-radius:12px;background:#fff;border:2px solid #c7d2fe;display:grid;place-items:center;position:relative;font-size:1.2rem;font-weight:950;color:#4f46e5}.jp-quiz-card i{position:absolute;opacity:0;color:#16a34a;font-style:normal;font-size:1.5rem}
.menu-juego-anim .jp-quiz-card b{animation:jpQuizQV3 1.15s .25s both}.menu-juego-anim .jp-quiz-card i{animation:jpQuizOkV3 1.15s .25s both}
@keyframes jpQuizQV3{0%,48%{opacity:1;transform:rotateY(0)}60%,100%{opacity:0;transform:rotateY(90deg)}}@keyframes jpQuizOkV3{0%,52%{opacity:0;transform:scale(.6)}70%,100%{opacity:1;transform:scale(1)}}
.jp-estrellas{font-size:.62rem;color:#f59e0b;letter-spacing:3px}
.preview-matematicas{flex-direction:column;gap:2px}.jp-math{display:flex;gap:5px;align-items:center;font-weight:950;color:#172033}.jp-math i{font-style:normal;color:#2563eb;font-size:1.25rem}.jp-math em{font-style:normal;color:#64748b}.jp-math strong{color:#16a34a}.jp-dots{font-size:.62rem;color:#2563eb;letter-spacing:1px}.menu-juego-anim .jp-math i{animation:jpMasV3 .85s .25s ease both}@keyframes jpMasV3{50%{transform:scale(1.45) rotate(-8deg)}}
.preview-oraciones{gap:4px;align-items:flex-end;padding-bottom:12px}.preview-oraciones .jp-chip{font-size:.57rem;font-weight:950;color:#fff;border-radius:7px;padding:5px 4px}.jp-chip-1{background:#2563eb}.jp-chip-2{background:#e5484d}.jp-chip-3{background:#16a34a}.menu-juego-anim .jp-chip-1{animation:jpChipV3 .45s .12s both}.menu-juego-anim .jp-chip-2{animation:jpChipV3 .45s .24s both}.menu-juego-anim .jp-chip-3{animation:jpChipV3 .45s .36s both}@keyframes jpChipV3{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
.quiz-inicio-rapido{display:grid;grid-template-columns:1fr 1fr;gap:9px;max-width:480px;margin-left:auto;margin-right:auto}.quiz-btn-jugar-rapido,.quiz-btn-configurar{border:0;border-radius:16px;padding:13px 10px;font-weight:900}.quiz-btn-jugar-rapido{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#111827;box-shadow:0 8px 18px rgba(245,158,11,.25)}.quiz-btn-configurar{background:#eef2ff;color:#4338ca;border:2px solid #c7d2fe}.quiz-configuracion{margin-top:12px;padding:14px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;animation:quizFadeIn .25s ease}
.lsp-game-flash-ok,.lsp-game-flash-error,.lsp-game-reaccion,.lsp-game-confeti{position:fixed;inset:0;pointer-events:none}.lsp-game-flash-ok{z-index:12050;background:radial-gradient(circle,rgba(255,255,255,.96),rgba(220,252,231,.78) 45%,transparent 76%);animation:lspGameFlashV3 .72s ease-out forwards}.lsp-game-flash-error{z-index:12050;background:rgba(220,38,38,.54);animation:lspGameFlashV3 .48s ease-out forwards}@keyframes lspGameFlashV3{0%{opacity:0}18%{opacity:1}100%{opacity:0}}.lsp-game-reaccion{z-index:12052;display:grid;place-items:center}.lsp-game-reaccion>div{font-size:3.1rem;background:rgba(255,255,255,.94);border-radius:24px;padding:12px 18px;box-shadow:0 14px 38px rgba(15,23,42,.25);animation:jpPreviewInV3 .42s ease}.lsp-game-confeti{z-index:12051;overflow:hidden}.lsp-game-confeti i{position:absolute;top:-28px;width:9px;height:18px;border-radius:3px;animation:lspGameCaerV3 1.45s linear forwards}@keyframes lspGameCaerV3{to{transform:translateY(112vh) rotate(640deg)}}
@media(max-width:420px){#quizMenuJuegos .menu-juego-btn{min-height:166px;padding:14px 7px}.juego-preview{width:106px}.quiz-inicio-rapido{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.menu-juego-anim .juego-preview,.menu-juego-anim .juego-preview *,.lsp-game-flash-ok,.lsp-game-flash-error,.lsp-game-reaccion>div,.lsp-game-confeti i{animation:none!important}}
''')
write(path, css)

path = "css/alfabetizacion.css"
css = read(path)
css = append_once(css, "/* ===== JUEGOS TACTILES V3 ===== */", r'''
/* ===== JUEGOS TACTILES V3 ===== */
.completar-letra-viajera{position:fixed;z-index:12100;pointer-events:none;display:grid;place-items:center;width:48px;height:48px;border-radius:14px;background:#2563eb;color:#fff;font-size:1.35rem;font-weight:950;box-shadow:0 12px 28px rgba(37,99,235,.30);transition:left .42s cubic-bezier(.22,.9,.28,1),top .42s cubic-bezier(.22,.9,.28,1),transform .42s cubic-bezier(.22,.9,.28,1),opacity .42s ease}
.completar-mano-guia{position:fixed;z-index:12101;pointer-events:none;font-size:2.25rem;filter:drop-shadow(0 5px 7px rgba(15,23,42,.20));transition:left .8s cubic-bezier(.22,.9,.28,1),top .8s cubic-bezier(.22,.9,.28,1)}
.completar-guia-clon{position:fixed!important;z-index:12100;pointer-events:none;transition:left .8s cubic-bezier(.22,.9,.28,1),top .8s cubic-bezier(.22,.9,.28,1),transform .8s cubic-bezier(.22,.9,.28,1);box-shadow:0 10px 24px rgba(15,23,42,.18)}
.alfab-unir-item.unir-arrastrando{transform:scale(1.04);box-shadow:0 10px 24px rgba(37,99,235,.22);border-color:#3b82f6!important}.unir-linea-arrastre{position:fixed;inset:0;width:100vw;height:100vh;z-index:12090;pointer-events:none}
@media(prefers-reduced-motion:reduce){.completar-letra-viajera,.completar-mano-guia,.completar-guia-clon{transition:none}}
''')
write(path, css)


# ============================================================
# 3) SCRIPT.JS — feedback común + transiciones + un solo botón volver
# ============================================================
path = "js/script.js"
js = read(path)
marker = "const PANTALLAS_SECCION_JUEGOS = ["
if "const FeedbackJuegosLSPedia =" not in js:
    feedback_code = r'''
// --- LENGUAJE VISUAL COMÚN DE LOS JUEGOS ---
const FeedbackJuegosLSPedia = (function(){
    function limpiar(clase){ document.querySelectorAll("."+clase).forEach(n=>n.remove()); }
    function reaccion(emoji,duracion=720){
        limpiar("lsp-game-reaccion");
        const capa=document.createElement("div"); capa.className="lsp-game-reaccion";
        capa.innerHTML="<div>"+emoji+"</div>"; document.body.appendChild(capa);
        setTimeout(()=>capa.remove(),duracion);
    }
    function confeti(){
        limpiar("lsp-game-confeti");
        const capa=document.createElement("div"); capa.className="lsp-game-confeti";
        const colores=["#ef4444","#f59e0b","#22c55e","#06b6d4","#3b82f6","#8b5cf6","#ec4899"];
        for(let i=0;i<18;i++){
            const p=document.createElement("i"); p.style.left=(Math.random()*100)+"vw";
            p.style.background=colores[i%colores.length]; p.style.animationDelay=(Math.random()*.16)+"s";
            capa.appendChild(p);
        }
        document.body.appendChild(capa); setTimeout(()=>capa.remove(),1700);
    }
    function flash(clase,ms){ limpiar(clase); const n=document.createElement("div"); n.className=clase; document.body.appendChild(n); setTimeout(()=>n.remove(),ms); }
    function correcto(opciones={}){ flash("lsp-game-flash-ok",760); reaccion("🥳👏🏻"); if(opciones.confeti!==false) confeti(); }
    function error(){ flash("lsp-game-flash-error",520); reaccion("😢👎🏻",650); if(navigator.vibrate){try{navigator.vibrate([150,60,150])}catch(_){}} }
    return {correcto,error};
})();
window.FeedbackJuegosLSPedia=FeedbackJuegosLSPedia;

function animarEntradaVistaJuego(nodo,regreso=false){
    if(!nodo) return;
    nodo.classList.remove("lsp-vista-juego-entrando","lsp-vista-juego-regresando");
    void nodo.offsetWidth;
    nodo.classList.add(regreso?"lsp-vista-juego-regresando":"lsp-vista-juego-entrando");
    setTimeout(()=>nodo.classList.remove("lsp-vista-juego-entrando","lsp-vista-juego-regresando"),430);
}
'''
    if marker not in js:
        raise RuntimeError("No se encontro PANTALLAS_SECCION_JUEGOS")
    js = js.replace(marker, feedback_code + "\n" + marker, 1)

js = replace_once(js,
'''function mostrarPantallaJuegos(id){
    ocultarPantallasJuegos();
    const n = document.getElementById(id);
    if(n) n.classList.remove("d-none");
    if(id === "quizMenuJuegos") reproducirAnimacionMenuJuegos();
}''',
'''function mostrarPantallaJuegos(id){
    ocultarPantallasJuegos();
    const n = document.getElementById(id);
    if(n){
        n.classList.remove("d-none");
        animarEntradaVistaJuego(n,id === "quizMenuJuegos");
    }
    if(id === "quizMenuJuegos") reproducirAnimacionMenuJuegos();
}''', "transicion pantallas Jugar")

for name,juego,body in [
    ("abrirJuegoCompletar","completar",'mostrarPantallaJuegos("quizCargando");\n    if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.mostrarJuego === "function") AlfabetizacionV2.mostrarJuego("completar");'),
    ("abrirJuegoUnir","unir",'mostrarPantallaJuegos("quizCargando");\n    if(window.AlfabetizacionV2 && typeof AlfabetizacionV2.mostrarJuego === "function") AlfabetizacionV2.mostrarJuego("unir");'),
    ("abrirJuegoQuiz","quiz",'mostrarPantallaJuegos("quizCargando");\n    if(window.QuizV2 && typeof QuizV2.iniciar === "function") QuizV2.iniciar();'),
    ("abrirJuegoMatematicas","matematicas",'mostrarPantallaJuegos("matApp");\n    if(window.MatematicasV2 && typeof MatematicasV2.iniciar === "function") MatematicasV2.iniciar();')
]:
    old = f'''function {name}(){{\n    {body}\n}}'''
    new = f'''function {name}(opciones = {{}}){{\n    if(!opciones.sinHistorial && window.HistorialJuegosLSPedia && typeof HistorialJuegosLSPedia.registrarJuego === "function"){{\n        HistorialJuegosLSPedia.registrarJuego("{juego}","menu");\n    }}\n    {body}\n}}'''
    js = replace_once(js, old, new, name)

js = replace_once(js,
'''document.querySelectorAll(".btn-volver-menu-juegos").forEach((btn) => {
    btn.addEventListener("click", mostrarMenuJuegos);
});''',
'''document.querySelectorAll(".btn-volver-menu-juegos").forEach((btn) => {
    btn.addEventListener("click", () => {
        if(window.HistorialJuegosLSPedia && typeof HistorialJuegosLSPedia.volverAlMenuJuegosDesdeBoton === "function"){
            HistorialJuegosLSPedia.volverAlMenuJuegosDesdeBoton();
        } else {
            mostrarMenuJuegos();
        }
    });
});''', "volver juegos")
write(path, js)


# ============================================================
# 4) MATEMATICAS.JS — convertir historial existente en router común
# ============================================================
path = "js/matematicas.js"
m = read(path)

m = replace_once(m,
'''    function construirUrl(juego, pantalla, operacion) {
        const url = new URL(window.location.href);
        url.search = "";
        url.searchParams.set("vista", "herramientas-jugar");
        if (juego) url.searchParams.set("juego", juego);
        if (pantalla) url.searchParams.set("pantalla", pantalla);
        if (operacion) url.searchParams.set("op", operacion);
        return url.pathname + "?" + url.searchParams.toString();
    }''',
'''    function construirUrl(juego, pantalla, operacion, extra = {}) {
        const url = new URL(window.location.href);
        url.search = "";
        url.searchParams.set("vista", "herramientas-jugar");
        if (juego) url.searchParams.set("juego", juego);
        if (pantalla && pantalla !== "menu") url.searchParams.set("pantalla", pantalla);
        if (operacion) url.searchParams.set("op", operacion);
        Object.entries(extra || {}).forEach(([k,v]) => {
            if(v !== undefined && v !== null && String(v) !== "") url.searchParams.set(k,String(v));
        });
        return url.pathname + "?" + url.searchParams.toString();
    }''', "construirUrl historial")

m = replace_once(m,
'''    function registrarJuego(juego) {
        registrar(
            construirUrl(juego),
            { tipo: "juego", vista: "herramientas-jugar", juego }
        );
    }''',
'''    function registrarJuego(juego, pantalla = "menu", extra = {}) {
        registrar(
            construirUrl(juego, pantalla, "", extra),
            { tipo: "juego", vista: "herramientas-jugar", juego, pantalla, ...extra }
        );
    }''', "registrarJuego comun")

old_back = '''    function volverAlMenuJuegosDesdeBoton() {
        const params = new URLSearchParams(window.location.search);
        if (params.get("vista") !== "herramientas-jugar" || !params.get("juego")) return;

        if (params.get("juego") === "matematicas" && params.get("pantalla") === "partida") {
            if (window.history.length > 2) {
                window.history.go(-2);
            } else {
                window.history.replaceState(
                    { tipo: "jugar", vista: "herramientas-jugar" },
                    "",
                    construirUrl()
                );
                mostrarMenuJuegosSinHistorial();
            }
            return;
        }

        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.history.replaceState(
                { tipo: "jugar", vista: "herramientas-jugar" },
                "",
                construirUrl()
            );
            mostrarMenuJuegosSinHistorial();
        }
    }'''
new_back = '''    function volverAlMenuJuegosDesdeBoton() {
        const params = new URLSearchParams(window.location.search);
        if (params.get("vista") === "herramientas-jugar" && params.get("juego") && window.history.length > 1) {
            // Un solo paso: partida -> menú del juego -> Jugar -> Herramientas.
            window.history.back();
            return;
        }
        window.history.replaceState(
            { tipo: "jugar", vista: "herramientas-jugar" },
            "",
            construirUrl()
        );
        mostrarMenuJuegosSinHistorial();
    }'''
m = replace_once(m, old_back, new_back, "back un paso")

m = replace_once(m,
'''        document.querySelectorAll(".btn-volver-menu-juegos").forEach((btn) => {
            btn.addEventListener("click", () => {
                if (!restaurando) volverAlMenuJuegosDesdeBoton();
            });
        });

''', '', "eliminar listener duplicado volver")

m = replace_once(m,
'''    return {
        registrarJuego,
        registrarPantallaMatematicas,
        restaurarDesdeUrl
    };''',
'''    return {
        registrarJuego,
        registrarPantallaMatematicas,
        restaurarDesdeUrl,
        volverAlMenuJuegosDesdeBoton
    };''', "export volver historial")
write(path, m)


# ============================================================
# 5) ALFABETIZACION.JS — niveles, letra animada, mano y arrastre real
# ============================================================
path = "js/alfabetizacion.js"
a = read(path)

a = replace_once(a,
'''            { id: "dificil", nombre: "Difícil", icono: "🔥", opciones: 5, tiempoBaseSeg: 15, segPorLetra: 1.3, letrasFaltantes: 3, badgeClase: "badge-nivel-dificil" }
        ],''',
'''            { id: "dificil", nombre: "Difícil", icono: "🔥", opciones: 5, tiempoBaseSeg: 15, segPorLetra: 1.3, letrasFaltantes: 3, badgeClase: "badge-nivel-dificil" },
            { id: "reto", nombre: "Reto", icono: "🧠", opciones: 6, tiempoBaseSeg: 18, segPorLetra: 1.5, letrasFaltantes: 999, badgeClase: "badge-nivel-dificil" }
        ],''', "nivel reto Completar")
a = replace_once(a,
'''            { id: "dificil", nombre: "Difícil", icono: "🔥", pares: 8, badgeClase: "badge-nivel-dificil" }
        ],''',
'''            { id: "dificil", nombre: "Difícil", icono: "🔥", pares: 8, badgeClase: "badge-nivel-dificil" },
            { id: "reto", nombre: "Reto", icono: "🧠", pares: 10, badgeClase: "badge-nivel-dificil" }
        ],''', "nivel reto Unir")
a = a.replace('                col.className = "col-4";', '                col.className = "col-6 col-md-3";')

# Historial de partida.
a = replace_once(a,
'''    function iniciarJuegoCompletar() {
        const banco = barajar(bancoPalabrasCompletar());''',
'''    function iniciarJuegoCompletar() {
        if(window.HistorialJuegosLSPedia && typeof HistorialJuegosLSPedia.registrarJuego === "function"){
            HistorialJuegosLSPedia.registrarJuego("completar","partida",{nivel:estado.completar.nivelId || ""});
        }
        const banco = barajar(bancoPalabrasCompletar());''', "historial Completar")
a = replace_once(a,
'''    function iniciarJuegoUnir() {
        estado.unir.ronda = 0;''',
'''    function iniciarJuegoUnir() {
        if(window.HistorialJuegosLSPedia && typeof HistorialJuegosLSPedia.registrarJuego === "function"){
            HistorialJuegosLSPedia.registrarJuego("unir","partida",{nivel:estado.unir.nivelId || ""});
        }
        estado.unir.ronda = 0;''', "historial Unir")

helper_comp = r'''
    function animarLetraHaciaCasilla(letra, btnEl, callback) {
        const pregunta = estado.completar.preguntas[estado.completar.indice];
        const indiceBlanco = pregunta && pregunta._indicesBlanco ? pregunta._indicesBlanco[estado.completar.subIndice] : null;
        const destino = indiceBlanco !== null ? el("completarCasilla" + indiceBlanco) : null;
        if (!btnEl || !destino || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { callback(); return; }
        document.querySelectorAll("#alfabCompletarOpciones .completar-opcion-letra").forEach(b => { b.disabled = true; });
        const origen = btnEl.getBoundingClientRect();
        const fin = destino.getBoundingClientRect();
        const ficha = document.createElement("div");
        ficha.className = "completar-letra-viajera";
        ficha.textContent = letra;
        ficha.style.left = (origen.left + origen.width / 2 - 24) + "px";
        ficha.style.top = (origen.top + origen.height / 2 - 24) + "px";
        document.body.appendChild(ficha);
        requestAnimationFrame(() => {
            ficha.style.left = (fin.left + fin.width / 2 - 24) + "px";
            ficha.style.top = (fin.top + fin.height / 2 - 24) + "px";
            ficha.style.transform = "scale(.82)";
        });
        setTimeout(() => { ficha.remove(); callback(); }, 440);
    }

    function programarGuiaVisualCompletar() {
        const indicePregunta = estado.completar.indice;
        const subIndice = estado.completar.subIndice;
        setTimeout(() => {
            if (estado.completar.respondida || estado.completar.blancoRespondido) return;
            if (estado.completar.indice !== indicePregunta || estado.completar.subIndice !== subIndice) return;
            const pregunta = estado.completar.preguntas[indicePregunta];
            if (!pregunta) return;
            const correcta = String(pregunta._letrasCorrectas[subIndice] || "").toUpperCase();
            const indiceBlanco = pregunta._indicesBlanco[subIndice];
            const destino = el("completarCasilla" + indiceBlanco);
            const opciones = Array.from(document.querySelectorAll("#alfabCompletarOpciones .completar-opcion-letra"));
            const origen = opciones.find(b => b.textContent.trim().toUpperCase() === correcta);
            if (!origen || !destino) return;
            const ro = origen.getBoundingClientRect();
            const rd = destino.getBoundingClientRect();
            const clon = origen.cloneNode(true);
            clon.disabled = false;
            clon.classList.add("completar-guia-clon");
            clon.style.left = ro.left + "px"; clon.style.top = ro.top + "px";
            clon.style.width = ro.width + "px"; clon.style.height = ro.height + "px";
            const mano = document.createElement("div");
            mano.className = "completar-mano-guia"; mano.textContent = "👆";
            mano.style.left = (ro.left + ro.width * .55) + "px";
            mano.style.top = (ro.top + ro.height * .60) + "px";
            document.body.append(clon, mano);
            requestAnimationFrame(() => {
                clon.style.left = (rd.left + rd.width / 2 - ro.width / 2) + "px";
                clon.style.top = (rd.top + rd.height / 2 - ro.height / 2) + "px";
                mano.style.left = (rd.left + rd.width * .55) + "px";
                mano.style.top = (rd.top + rd.height * .60) + "px";
            });
            setTimeout(() => { clon.remove(); mano.remove(); }, 950);
        }, 5200);
    }
'''
a = a.replace("    function seleccionarOpcionCompletar(letra, btnEl) {", helper_comp + "\n    function seleccionarOpcionCompletar(letra, btnEl) {", 1)
a = replace_once(a,
'            btn.addEventListener("click", () => seleccionarOpcionCompletar(letra, btn));',
'            btn.addEventListener("click", () => animarLetraHaciaCasilla(letra, btn, () => seleccionarOpcionCompletar(letra, btn)));', "click letra animada")

render_start = a.index("    function renderOpcionesBlancoActual() {")
render_end = a.index("    function animarLetraHaciaCasilla", render_start)
segment = a[render_start:render_end]
needle = '            filaOpciones.appendChild(btn);\n        });\n'
if needle not in segment:
    raise RuntimeError("No se encontro cierre de opciones Completar")
segment = segment.replace(needle, needle + '        programarGuiaVisualCompletar();\n', 1)
a = a[:render_start] + segment + a[render_end:]

# Error inmediato y celebración al completar toda la palabra.
a = replace_once(a,
'''            estado.completar.palabraTuvoError = true;
            estado.completar.racha = 0;
            reproducirSonidoIncorrecto();''',
'''            estado.completar.palabraTuvoError = true;
            estado.completar.racha = 0;
            reproducirSonidoIncorrecto();
            if(window.FeedbackJuegosLSPedia) FeedbackJuegosLSPedia.error();''', "feedback error Completar")
a = replace_once(a,
'''            el("alfabCompletarFeedback").innerHTML = '<span class="text-success">¡Muy bien! 🎉</span>';
            lanzarConfetiCompletar();''',
'''            el("alfabCompletarFeedback").innerHTML = '<span class="text-success">¡Muy bien! 🎉</span>';
            lanzarConfetiCompletar();
            if(window.FeedbackJuegosLSPedia) FeedbackJuegosLSPedia.correcto({confeti:false});''', "feedback exito Completar")
a = replace_once(a,
'''        reproducirSonidoIncorrecto();
        el("alfabCompletarFeedback").innerHTML = '<span class="text-danger">⏱ Se acabó el tiempo.</span>';''',
'''        reproducirSonidoIncorrecto();
        if(window.FeedbackJuegosLSPedia) FeedbackJuegosLSPedia.error();
        el("alfabCompletarFeedback").innerHTML = '<span class="text-danger">⏱ Se acabó el tiempo.</span>';''', "feedback timeout Completar")

helper_unir = r'''
    function activarArrastreVisualUnir(elemento, tipo, indice) {
        if (!elemento) return;
        elemento.dataset.unirTipo = tipo;
        elemento.dataset.unirIndice = String(indice);
        elemento.style.touchAction = "none";
        elemento.addEventListener("pointerdown", (ev) => {
            if (estado.unir.resueltos.has(indice)) return;
            const inicioX = ev.clientX, inicioY = ev.clientY;
            let activo = false, svg = null, linea = null;
            const rect = elemento.getBoundingClientRect();
            const x1 = rect.left + rect.width / 2, y1 = rect.top + rect.height / 2;

            function mover(e) {
                if (!activo && Math.hypot(e.clientX - inicioX, e.clientY - inicioY) < 7) return;
                if (!activo) {
                    activo = true;
                    elemento.classList.add("unir-arrastrando");
                    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    svg.classList.add("unir-linea-arrastre");
                    linea = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    linea.setAttribute("x1", x1); linea.setAttribute("y1", y1);
                    linea.setAttribute("x2", e.clientX); linea.setAttribute("y2", e.clientY);
                    linea.setAttribute("stroke", tipo === "imagen" ? "#38bdf8" : "#8b5cf6");
                    linea.setAttribute("stroke-width", "5"); linea.setAttribute("stroke-linecap", "round");
                    svg.appendChild(linea); document.body.appendChild(svg);
                } else if (linea) {
                    linea.setAttribute("x2", e.clientX); linea.setAttribute("y2", e.clientY);
                }
            }

            function soltar(e) {
                window.removeEventListener("pointermove", mover);
                window.removeEventListener("pointerup", soltar);
                window.removeEventListener("pointercancel", soltar);
                elemento.classList.remove("unir-arrastrando");
                if (svg) svg.remove();
                if (!activo) return;
                elemento.dataset.suprimirClickUnir = "1";
                const bruto = document.elementFromPoint(e.clientX, e.clientY);
                const destino = bruto ? bruto.closest(".alfab-unir-item") : null;
                if (destino && destino.dataset.unirTipo && destino.dataset.unirTipo !== tipo) {
                    const indiceDestino = parseInt(destino.dataset.unirIndice, 10);
                    alternarSeleccionUnir(tipo, indice, elemento);
                    alternarSeleccionUnir(destino.dataset.unirTipo, indiceDestino, destino);
                }
                setTimeout(() => { elemento.dataset.suprimirClickUnir = ""; }, 90);
            }

            window.addEventListener("pointermove", mover);
            window.addEventListener("pointerup", soltar);
            window.addEventListener("pointercancel", soltar);
        });
    }
'''
a = a.replace("    // Toca un ítem (imagen o palabra).", helper_unir + "\n    // Toca un ítem (imagen o palabra).", 1)
a = replace_once(a,
'''            btn.addEventListener("click", () => alternarSeleccionUnir("imagen", idx, btn));
            contImagenes.appendChild(btn);''',
'''            btn.addEventListener("click", () => { if(btn.dataset.suprimirClickUnir !== "1") alternarSeleccionUnir("imagen", idx, btn); });
            activarArrastreVisualUnir(btn, "imagen", idx);
            contImagenes.appendChild(btn);''', "drag imagen Unir")
a = replace_once(a,
'''            btn.addEventListener("click", () => alternarSeleccionUnir("palabra", idx, btn));
            contPalabras.appendChild(btn);''',
'''            btn.addEventListener("click", () => { if(btn.dataset.suprimirClickUnir !== "1") alternarSeleccionUnir("palabra", idx, btn); });
            activarArrastreVisualUnir(btn, "palabra", idx);
            contPalabras.appendChild(btn);''', "drag palabra Unir")
a = replace_once(a,
'        if (huboErrores) reproducirSonidoIncorrecto(); else reproducirSonidoCorrecto();',
'''        if (huboErrores) {
            reproducirSonidoIncorrecto();
            if(window.FeedbackJuegosLSPedia) FeedbackJuegosLSPedia.error();
        } else {
            reproducirSonidoCorrecto();
            if(window.FeedbackJuegosLSPedia) FeedbackJuegosLSPedia.correcto({confeti:rondaCompleta});
        }''', "feedback Unir")

# Botones internos "Menú" usan la misma pila que Atrás del celular.
helper_back = r'''
    function volverMenuInternoConHistorial(juego, fallback) {
        const params = new URLSearchParams(window.location.search);
        if (params.get("vista") === "herramientas-jugar" && params.get("juego") === juego && params.get("pantalla") === "partida" && window.history.length > 1) {
            window.history.back();
            return;
        }
        fallback();
    }
'''
a = a.replace("    // ---------------------------------------------------------\n    // PANTALLA COMPLETA", helper_back + "\n    // ---------------------------------------------------------\n    // PANTALLA COMPLETA", 1)
a = replace_once(a,
'        if (btnCompletarMenu) btnCompletarMenu.addEventListener("click", renderCompletarIntro);',
'        if (btnCompletarMenu) btnCompletarMenu.addEventListener("click", () => volverMenuInternoConHistorial("completar", renderCompletarIntro));', "menu interno Completar")
a = replace_once(a,
'''                if (estado.unir._timerAutoComprobar) clearTimeout(estado.unir._timerAutoComprobar);
                renderUnirIntro();''',
'''                if (estado.unir._timerAutoComprobar) clearTimeout(estado.unir._timerAutoComprobar);
                volverMenuInternoConHistorial("unir", renderUnirIntro);''', "menu interno Unir")
write(path, a)


# ============================================================
# 6) QUIZ.JS — JUGAR directo + configuración secundaria + historial
# ============================================================
path = "js/quiz.js"
q = read(path)
q = replace_once(q,
'''    function mostrarIntro() {
        mostrarBloque("quizIntro");
        renderSelectorNivel();
        renderSelectorModo();
        actualizarConteoDisponibles();
    }''',
'''    function mostrarIntro() {
        mostrarBloque("quizIntro");
        renderSelectorNivel();
        renderSelectorModo();
        actualizarConteoDisponibles();
        const config = el("quizConfiguracion");
        const btnConfig = el("btnQuizConfigurar");
        if(config) config.classList.add("d-none");
        if(btnConfig) btnConfig.setAttribute("aria-expanded","false");
    }''', "mostrarIntro Quiz")
q = replace_once(q, '    function empezarPartida() {',
'''    function empezarPartida() {
        if(window.HistorialJuegosLSPedia && typeof HistorialJuegosLSPedia.registrarJuego === "function"){
            HistorialJuegosLSPedia.registrarJuego("quiz","partida",{nivel:estado.nivel,modo:estado.modo});
        }''', "historial Quiz")
q = replace_once(q,
'''        if (esCorrecta) {
            estado.ronda.puntaje += calcularPuntos(pregunta.nivel, tiempoUsado, estado.temporizador.total);
            reproducirSonidoCorrecto();
        } else {
            reproducirSonidoIncorrecto();
        }''',
'''        if (esCorrecta) {
            estado.ronda.puntaje += calcularPuntos(pregunta.nivel, tiempoUsado, estado.temporizador.total);
            reproducirSonidoCorrecto();
            if(window.FeedbackJuegosLSPedia) FeedbackJuegosLSPedia.correcto({confeti:true});
        } else {
            reproducirSonidoIncorrecto();
            if(window.FeedbackJuegosLSPedia) FeedbackJuegosLSPedia.error();
        }''', "feedback Quiz")
q = replace_once(q,
'''        destruirReproductorQuizVideo();
        mostrarIntro();
    }''',
'''        destruirReproductorQuizVideo();
        const params = new URLSearchParams(window.location.search);
        if(params.get("vista") === "herramientas-jugar" && params.get("juego") === "quiz" && params.get("pantalla") === "partida" && window.history.length > 1){
            window.history.back();
            return;
        }
        mostrarIntro();
    }''', "volver menu Quiz con historial")
q = replace_once(q,
'''        const btnEmpezar = el("btnEmpezarQuiz");
        if (btnEmpezar) btnEmpezar.addEventListener("click", empezarPartida);''',
'''        const btnEmpezar = el("btnEmpezarQuiz");
        if (btnEmpezar) btnEmpezar.addEventListener("click", empezarPartida);

        const btnRapido = el("btnQuizJugarRapido");
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
        });''', "botones Quiz rapido")
write(path, q)


# ============================================================
# 7) SERVICE WORKER — forzar shell nuevo
# ============================================================
path = "sw.js"
sw = read(path)
sw, n = re.subn(r'const VERSION_APP = "v\d+";', 'const VERSION_APP = "v14";', sw, count=1)
if n != 1:
    raise RuntimeError("No se actualizo VERSION_APP")
write(path, sw)


# ============================================================
# VALIDACIONES
# ============================================================
for jsfile in ["js/script.js","js/alfabetizacion.js","js/quiz.js","js/matematicas.js","js/oraciones.js"]:
    proc = subprocess.run(["node","--check",jsfile],capture_output=True,text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"node --check fallo en {jsfile}:\n{proc.stderr}")

html_final = read("index.html")
for ident in ["btnMenuJuegoCompletar","btnMenuJuegoUnir","btnMenuJuegoQuiz","btnMenuJuegoMatematicas","btnMenuJuegoOraciones","btnQuizJugarRapido","btnQuizConfigurar","quizConfiguracion"]:
    if html_final.count(f'id="{ident}"') != 1:
        raise RuntimeError(f"ID ausente o duplicado: {ident}")

for path, tokens in {
    "js/script.js":["FeedbackJuegosLSPedia","animarEntradaVistaJuego","volverAlMenuJuegosDesdeBoton"],
    "js/alfabetizacion.js":["animarLetraHaciaCasilla","programarGuiaVisualCompletar","activarArrastreVisualUnir","Reto"],
    "js/quiz.js":["btnQuizJugarRapido","btnQuizConfigurar","registrarJuego(\"quiz\""],
    "js/matematicas.js":["volverAlMenuJuegosDesdeBoton","registrarJuego(juego, pantalla = \"menu\""]
}.items():
    text = read(path)
    for token in tokens:
        if token not in text:
            raise RuntimeError(f"Falta {token} en {path}")

print("OK: Herramientas/Jugar V3 aplicada y validada")
