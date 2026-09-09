from pathlib import Path

repo = Path(__file__).resolve().parents[1]
index_path = repo / "index.html"
script_path = repo / "js" / "script.js"
sw_path = repo / "sw.js"

index = index_path.read_text(encoding="utf-8")
script = script_path.read_text(encoding="utf-8")
sw = sw_path.read_text(encoding="utf-8")

MARKER_CSS = "TRANSICION_SECCIONES_PRINCIPALES_V1_20260909"
MARKER_JS = "TRANSICION_SECCIONES_PRINCIPALES_JS_V1_20260909"

if MARKER_CSS in index or MARKER_JS in script:
    raise SystemExit("La transición de secciones ya fue aplicada")

css = r'''
    <style id="transicion-secciones-principales-v1">
        /* TRANSICION_SECCIONES_PRINCIPALES_V1_20260909
           Transición breve entre Diccionario, Vocabulario, Herramientas y
           Nosotros. Solo se anima el contenido; las barras de navegación
           permanecen fijas para conservar sensación de aplicación nativa. */
        #contenidoPrincipalApp {
            will-change: opacity, transform;
        }

        #contenidoPrincipalApp.lsp-seccion-saliendo {
            opacity: 0.72;
            transform: translateY(-2px);
            transition: opacity 70ms ease-out, transform 70ms ease-out;
            pointer-events: none;
        }

        #contenidoPrincipalApp.lsp-seccion-entrando {
            animation: lspSeccionPrincipalEntrada 180ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes lspSeccionPrincipalEntrada {
            from {
                opacity: 0.46;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (prefers-reduced-motion: reduce) {
            #contenidoPrincipalApp.lsp-seccion-saliendo {
                opacity: 1;
                transform: none;
                transition: none;
            }

            #contenidoPrincipalApp.lsp-seccion-entrando {
                animation: none;
            }
        }
    </style>
'''

if "</head>" not in index:
    raise SystemExit("No se encontró </head> en index.html")
index = index.replace("</head>", css + "\n</head>", 1)

anchor = r'''// Marca cuál botón del menú superior (escritorio) está activo, quitando
// la clase de los demás. Antes esta clase solo existía de entrada en
// "Diccionario" (hardcodeada en el HTML) y nunca se actualizaba al
// navegar, por eso el subrayado ámbar (CSS ::after sobre .active) se
// quedaba siempre fijo ahí. Se llama desde cada sección (Diccionario,
// Vocabulario, Herramientas, Sobre Nosotros) para que el subrayado se
// mueva junto con la navegación real.
function activarBotonMenu(idActivo){
'''

if anchor not in script:
    raise SystemExit("No se encontró activarBotonMenu() en js/script.js")

transition_js = r'''// TRANSICION_SECCIONES_PRINCIPALES_JS_V1_20260909
// Las cuatro secciones principales comparten #contenidoPrincipalApp. Antes
// cambiaban de golpe; ahora una pulsación primero atenúa muy brevemente el
// contenido actual y, tras ejecutar la navegación existente, la nueva vista
// entra desde 10 px más abajo. No se reescribe ninguna función de pantalla.
const IDS_SECCIONES_PRINCIPALES = new Set([
    "btnInicio", "btnCategorias", "btnHerramientas", "btnSobreNosotros"
]);

let idSeccionPrincipalActiva = (document.querySelector(".navbar-nav .nav-link.active") || {}).id || "btnInicio";
let omitirIntercepcionTransicionPrincipal = false;
let timerEntradaSeccionPrincipal = null;

function contenidoPrincipalParaTransicion(){
    return document.getElementById("contenidoPrincipalApp");
}

function iniciarSalidaSeccionPrincipal(){
    const contenido = contenidoPrincipalParaTransicion();
    if(!contenido || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    clearTimeout(timerEntradaSeccionPrincipal);
    contenido.classList.remove("lsp-seccion-entrando");
    contenido.classList.add("lsp-seccion-saliendo");
}

function reproducirEntradaSeccionPrincipal(){
    const contenido = contenidoPrincipalParaTransicion();
    if(!contenido) return;
    contenido.classList.remove("lsp-seccion-saliendo", "lsp-seccion-entrando");

    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Forzar reflow permite reiniciar la animación aunque se cambie de
    // sección varias veces seguidas.
    void contenido.offsetWidth;
    contenido.classList.add("lsp-seccion-entrando");
    clearTimeout(timerEntradaSeccionPrincipal);
    timerEntradaSeccionPrincipal = setTimeout(() => {
        contenido.classList.remove("lsp-seccion-entrando");
    }, 210);
}

function idDestinoDesdeControlPrincipal(control){
    if(!control) return "";
    if(control.classList && control.classList.contains("mbn-item")){
        return control.dataset.vinculado || "";
    }
    return control.id || "";
}

// Captura la pulsación ANTES de los handlers ya existentes para poder mostrar
// 70 ms de salida. Después vuelve a disparar exactamente el mismo control;
// la bandera evita interceptar ese segundo clic y toda la lógica original
// continúa intacta.
document.addEventListener("click", (evento) => {
    if(omitirIntercepcionTransicionPrincipal) return;

    const control = evento.target.closest(
        "#btnInicio, #btnCategorias, #btnHerramientas, #btnSobreNosotros, .mobile-bottom-nav .mbn-item"
    );
    if(!control) return;

    const idDestino = idDestinoDesdeControlPrincipal(control);
    if(!IDS_SECCIONES_PRINCIPALES.has(idDestino) || idDestino === idSeccionPrincipalActiva) return;

    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    evento.preventDefault();
    evento.stopImmediatePropagation();
    iniciarSalidaSeccionPrincipal();

    setTimeout(() => {
        omitirIntercepcionTransicionPrincipal = true;
        try {
            control.click();
        } finally {
            omitirIntercepcionTransicionPrincipal = false;
        }
    }, 70);
}, true);

'''

script = script.replace(anchor, transition_js + anchor, 1)

# Añadimos la entrada justo al inicio de activarBotonMenu para que también
# funcione al navegar con Atrás/Adelante o restaurar una URL directa.
func_start = "function activarBotonMenu(idActivo){\n"
replacement = '''function activarBotonMenu(idActivo){
    const cambioSeccionPrincipal = IDS_SECCIONES_PRINCIPALES.has(idActivo) && idActivo !== idSeccionPrincipalActiva;
    if(cambioSeccionPrincipal){
        idSeccionPrincipalActiva = idActivo;
        reproducirEntradaSeccionPrincipal();
    }
'''
script = script.replace(func_start, replacement, 1)

if 'const VERSION_APP = "v49";' not in sw:
    raise SystemExit("La versión esperada de la PWA no es v49")
sw = sw.replace('const VERSION_APP = "v49";', 'const VERSION_APP = "v50";', 1)

index_path.write_text(index.rstrip() + "\n", encoding="utf-8")
script_path.write_text(script.rstrip() + "\n", encoding="utf-8")
sw_path.write_text(sw.rstrip() + "\n", encoding="utf-8")
