from pathlib import Path

SCRIPT = Path('js/script.js')
CSS = Path('css/estilos.css')
SW = Path('sw.js')

js = SCRIPT.read_text(encoding='utf-8')
css = CSS.read_text(encoding='utf-8')
sw = SW.read_text(encoding='utf-8')

MARKER = '// ============================================================\n// PROGRESO PERSONAL — PALABRAS VISTAS Y CONTINUAR'
if MARKER in js:
    raise SystemExit('La mejora de progreso personal ya existe; no se aplica dos veces.')

anchor_keys = 'const CLAVE_FAVORITOS = "lspedia_favoritos";\nconst CLAVE_HISTORIAL = "lspedia_historial";\n'
if anchor_keys not in js:
    raise SystemExit('No se encontró el ancla de claves de localStorage.')

module = r'''

// ============================================================
// PROGRESO PERSONAL — PALABRAS VISTAS Y CONTINUAR
// ------------------------------------------------------------
// Guarda SOLO en este dispositivo qué palabras se han abierto. No requiere
// cuenta, no se envía a un servidor y no modifica Favoritos/Historial.
// Se usa para mostrar en el Inicio una tarjeta "Tu progreso" y permitir
// continuar desde la última palabra explorada.
const CLAVE_PROGRESO_PALABRAS = "lspedia_progreso_palabras_v1";
const MAX_PROGRESO_PALABRAS = 800;

function leerProgresoPalabras(){
    try {
        const guardado = JSON.parse(localStorage.getItem(CLAVE_PROGRESO_PALABRAS) || "null");
        if(!guardado || typeof guardado !== "object") return { version: 1, items: [] };
        const items = Array.isArray(guardado.items) ? guardado.items : [];
        return { version: 1, items };
    } catch(error){
        console.warn("No se pudo leer el progreso personal:", error);
        return { version: 1, items: [] };
    }
}

function guardarProgresoPalabras(progreso){
    try {
        localStorage.setItem(CLAVE_PROGRESO_PALABRAS, JSON.stringify({
            version: 1,
            items: Array.isArray(progreso && progreso.items)
                ? progreso.items.slice(0, MAX_PROGRESO_PALABRAS)
                : []
        }));
    } catch(error){
        console.warn("No se pudo guardar el progreso personal:", error);
    }
}

function registrarProgresoPalabra(p){
    if(!p || !p.palabra) return;
    const referencia = obtenerIdPalabra(p);
    if(!referencia) return;

    const fuente = obtenerFuentePalabra(p);
    const clave = fuente + ":" + referencia;
    const ahora = Date.now();
    const progreso = leerProgresoPalabras();
    const existente = progreso.items.find(item => item && item.clave === clave);

    if(existente){
        existente.ultimaVez = ahora;
        existente.visitas = Math.max(1, Number(existente.visitas) || 1) + 1;
        existente.palabra = String(p.palabra || existente.palabra || "").trim();
        existente.categoria = String(p.categoria || existente.categoria || "").trim();
    } else {
        progreso.items.push({
            clave,
            referencia,
            fuente,
            palabra: String(p.palabra || "").trim(),
            categoria: String(p.categoria || "").trim(),
            primeraVez: ahora,
            ultimaVez: ahora,
            visitas: 1
        });
    }

    progreso.items.sort((a, b) => (Number(b.ultimaVez) || 0) - (Number(a.ultimaVez) || 0));
    progreso.items = progreso.items.slice(0, MAX_PROGRESO_PALABRAS);
    guardarProgresoPalabras(progreso);
    actualizarPanelProgresoPersonal();
}

function obtenerUltimaPalabraProgreso(){
    const progreso = leerProgresoPalabras();
    return progreso.items
        .filter(item => item && item.referencia && item.palabra)
        .sort((a, b) => (Number(b.ultimaVez) || 0) - (Number(a.ultimaVez) || 0))[0] || null;
}

function abrirUltimaPalabraProgreso(){
    const ultima = obtenerUltimaPalabraProgreso();
    if(!ultima) return;

    if(ultima.fuente === "vocabulario"){
        if(typeof mostrarPalabraVocabularioPorReferencia === "function"){
            mostrarPalabraVocabularioPorReferencia(ultima.referencia);
            return;
        }
        window.location.href = window.location.pathname
            + "?vista=vocabulario&p=" + encodeURIComponent(ultima.referencia)
            + "&fuente=vocabulario";
        return;
    }

    const palabra = buscarPalabraPorReferencia(ultima.referencia, App.datos);
    if(palabra){
        mostrarPalabra(palabra);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    window.location.href = window.location.pathname + "?p=" + encodeURIComponent(ultima.referencia);
}

function asegurarPanelProgresoPersonal(){
    const bloque = document.getElementById("bloqueBuscador");
    if(!bloque) return null;

    let panel = document.getElementById("panelProgresoPersonal");
    if(panel) return panel;

    panel = document.createElement("section");
    panel.id = "panelProgresoPersonal";
    panel.className = "panel-progreso-personal d-none";
    panel.setAttribute("aria-label", "Tu progreso en LSPedia");
    panel.innerHTML = `
        <div class="progreso-personal-icono" aria-hidden="true"><span>✓</span></div>
        <div class="progreso-personal-contenido">
            <div class="progreso-personal-etiqueta">TU PROGRESO</div>
            <div class="progreso-personal-titulo" id="progresoPersonalTitulo">Has explorado 0 palabras</div>
            <div class="progreso-personal-ultima" id="progresoPersonalUltima"></div>
            <div class="progreso-personal-privacidad">Guardado solo en este dispositivo.</div>
        </div>
        <button type="button" class="progreso-personal-continuar" id="btnContinuarProgreso">
            Continuar
            <span aria-hidden="true">→</span>
        </button>`;

    bloque.appendChild(panel);
    const boton = panel.querySelector("#btnContinuarProgreso");
    if(boton) boton.addEventListener("click", abrirUltimaPalabraProgreso);
    return panel;
}

function actualizarPanelProgresoPersonal(){
    const panel = asegurarPanelProgresoPersonal();
    if(!panel) return;

    const progreso = leerProgresoPalabras();
    const items = progreso.items.filter(item => item && item.referencia && item.palabra);
    if(items.length === 0){
        panel.classList.add("d-none");
        return;
    }

    items.sort((a, b) => (Number(b.ultimaVez) || 0) - (Number(a.ultimaVez) || 0));
    const ultima = items[0];
    const titulo = panel.querySelector("#progresoPersonalTitulo");
    const ultimaEl = panel.querySelector("#progresoPersonalUltima");
    const boton = panel.querySelector("#btnContinuarProgreso");

    if(titulo) titulo.textContent = `Has explorado ${items.length} ${items.length === 1 ? "palabra" : "palabras"}`;
    if(ultimaEl) ultimaEl.textContent = `Continúa desde: ${ultima.palabra}`;
    if(boton) boton.setAttribute("aria-label", `Continuar desde ${ultima.palabra}`);
    panel.classList.remove("d-none");
}

// El script se carga al final de <body>, pero el banco de palabras puede
// terminar de llegar después. La tarjeta solo necesita localStorage, así que
// puede pintarse desde ya y se refresca de nuevo al terminar de cargar.
setTimeout(actualizarPanelProgresoPersonal, 0);
window.addEventListener("load", actualizarPanelProgresoPersonal, { once: true });
'''

js = js.replace(anchor_keys, anchor_keys + module, 1)

anchor_dicc = '    agregarAHistorial(referenciaPalabra);\n'
if anchor_dicc not in js:
    raise SystemExit('No se encontró el registro de historial en mostrarPalabra().')
js = js.replace(anchor_dicc, anchor_dicc + '    registrarProgresoPalabra(p);\n', 1)

anchor_vocab = 'function mostrarPalabraSimplificada(p, opciones = {}){\n    p = marcarFuenteVocabulario(p);\n'
if anchor_vocab not in js:
    raise SystemExit('No se encontró mostrarPalabraSimplificada().')
js = js.replace(anchor_vocab, anchor_vocab + '    registrarProgresoPalabra(p);\n', 1)

css_marker = '/* ============================================================\n   PROGRESO PERSONAL — TARJETA CONTINUAR'
if css_marker in css:
    raise SystemExit('El CSS de progreso personal ya existe.')

css += r'''

/* ============================================================
   PROGRESO PERSONAL — TARJETA CONTINUAR
   ------------------------------------------------------------
   Vive dentro de #bloqueBuscador para desaparecer automáticamente cuando
   la navegación oculta el buscador. Diseño sobrio y compacto, pensado
   especialmente para móvil sin añadir otra pantalla ni otro menú.
   ============================================================ */
.panel-progreso-personal {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    margin-top: 14px;
    padding: 13px 14px;
    border: 1px solid rgba(2, 132, 199, 0.17);
    border-radius: 14px;
    background: linear-gradient(135deg, #ffffff 0%, #f4faff 100%);
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
}
.panel-progreso-personal.d-none { display: none !important; }
.progreso-personal-icono {
    flex: 0 0 42px;
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: #e6f4fb;
    border: 1px solid rgba(2, 132, 199, 0.14);
    color: #0369a1;
    font-size: 20px;
    font-weight: 900;
}
.progreso-personal-contenido {
    min-width: 0;
    flex: 1;
}
.progreso-personal-etiqueta {
    margin-bottom: 2px;
    color: #0284c7;
    font-size: 0.67rem;
    line-height: 1.1;
    font-weight: 800;
    letter-spacing: 0.08em;
}
.progreso-personal-titulo {
    color: #0f172a;
    font-size: 0.95rem;
    line-height: 1.25;
    font-weight: 800;
}
.progreso-personal-ultima {
    margin-top: 2px;
    color: #475569;
    font-size: 0.79rem;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.progreso-personal-privacidad {
    margin-top: 3px;
    color: #94a3b8;
    font-size: 0.66rem;
    line-height: 1.15;
}
.progreso-personal-continuar {
    flex: 0 0 auto;
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 8px 13px;
    border: 0;
    border-radius: 11px;
    background: #0284c7;
    color: #ffffff;
    font-size: 0.82rem;
    font-weight: 800;
    box-shadow: 0 4px 10px rgba(2, 132, 199, 0.2);
    transition: transform 0.16s ease, background-color 0.16s ease;
}
.progreso-personal-continuar:hover,
.progreso-personal-continuar:focus-visible {
    background: #0369a1;
    transform: translateY(-1px);
}
.progreso-personal-continuar:active { transform: translateY(0); }

@media (max-width: 575.98px) {
    .panel-progreso-personal {
        align-items: flex-start;
        gap: 10px;
        padding: 12px;
    }
    .progreso-personal-icono {
        flex-basis: 38px;
        width: 38px;
        height: 38px;
        border-radius: 10px;
        font-size: 18px;
    }
    .progreso-personal-continuar {
        align-self: center;
        min-height: 38px;
        padding: 7px 10px;
        font-size: 0.78rem;
    }
    .progreso-personal-privacidad { display: none; }
}

@media (prefers-reduced-motion: reduce) {
    .progreso-personal-continuar { transition: none; }
}
'''

if 'const VERSION_APP = "v58";' not in sw:
    raise SystemExit('Se esperaba Service Worker v58 antes de esta mejora.')
sw = sw.replace('const VERSION_APP = "v58";', 'const VERSION_APP = "v59";', 1)

SCRIPT.write_text(js, encoding='utf-8')
CSS.write_text(css, encoding='utf-8')
SW.write_text(sw, encoding='utf-8')

# Verificaciones simples de contenido antes de dejar que el workflow haga commit.
final_js = SCRIPT.read_text(encoding='utf-8')
final_css = CSS.read_text(encoding='utf-8')
final_sw = SW.read_text(encoding='utf-8')
assert MARKER in final_js
assert 'registrarProgresoPalabra(p);' in final_js
assert 'panelProgresoPersonal' in final_js
assert 'mostrarPalabraVocabularioPorReferencia' in final_js
assert 'PROGRESO PERSONAL — TARJETA CONTINUAR' in final_css
assert 'const VERSION_APP = "v59";' in final_sw
print('OK: progreso personal agregado y SW actualizado a v59')
