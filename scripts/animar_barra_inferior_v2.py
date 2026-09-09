from pathlib import Path

repo = Path(__file__).resolve().parents[1]
index_path = repo / "index.html"
script_path = repo / "js" / "script.js"
sw_path = repo / "sw.js"

index = index_path.read_text(encoding="utf-8")
script = script_path.read_text(encoding="utf-8")
sw = sw_path.read_text(encoding="utf-8")

marker_css = "MOBILE_BOTTOM_NAV_SLIDER_V2_20260909"
marker_js = "MOBILE_BOTTOM_NAV_SLIDER_JS_V2_20260909"

if marker_css in index or marker_js in script:
    raise SystemExit("La mejora de barra inferior V2 ya fue aplicada")

# Insertamos las mejoras inmediatamente después del bloque de color del icono activo.
css_anchor = '''.mbn-item.active .mbn-icon-wrap {
    background-color: #fdeaad;
}
'''

css_new = '''.mbn-item.active .mbn-icon-wrap {
    background-color: #fdeaad;
}

/* MOBILE_BOTTOM_NAV_SLIDER_V2_20260909
   El círculo amarillo ya no pertenece a cada botón: es un único indicador
   que se desliza entre las cuatro posiciones, como en una app nativa. */
.mobile-bottom-nav {
    --mbn-posicion: 12.5%;
}
.mobile-bottom-nav::before {
    content: "";
    position: absolute;
    top: -17px;
    left: var(--mbn-posicion);
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(145deg, #fff3bf 0%, #fdeaad 58%, #ffe17a 100%);
    border: 1px solid rgba(198, 145, 22, 0.16);
    box-shadow: 0 10px 20px rgba(146, 103, 11, 0.30),
                0 0 0 7px rgba(255, 193, 7, 0.08);
    transform: translateX(-50%);
    transition: left 0.42s cubic-bezier(0.22, 1, 0.36, 1),
                box-shadow 0.28s ease,
                transform 0.28s ease;
    pointer-events: none;
    z-index: 1;
    will-change: left;
}

/* El contenedor del icono sigue subiendo sobre la barra, pero ahora es
   transparente: el color amarillo lo aporta el indicador que se desliza. */
.mbn-icon-wrap {
    transition: width 0.30s cubic-bezier(0.22, 1, 0.36, 1),
                height 0.30s cubic-bezier(0.22, 1, 0.36, 1),
                border-radius 0.30s ease,
                transform 0.36s cubic-bezier(0.22, 1, 0.36, 1),
                background-color 0.20s ease,
                box-shadow 0.20s ease;
}
.mbn-item.active .mbn-icon-wrap {
    background-color: transparent !important;
    box-shadow: none !important;
}

/* Al llegar a una sección nueva, el icono hace un micro-salto de 3 px
   y vuelve a su lugar. Es deliberadamente corto para no distraer. */
.mbn-item.active .mbn-icon {
    animation: mbnIconoLlega 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes mbnIconoLlega {
    0%   { transform: translateY(0) scale(1.06); }
    48%  { transform: translateY(-3px) scale(1.13); }
    100% { transform: translateY(0) scale(1.10); }
}

/* Reduce movimiento para quien lo tenga desactivado en su dispositivo. */
@media (prefers-reduced-motion: reduce) {
    .mobile-bottom-nav::before,
    .mbn-icon-wrap {
        transition: none !important;
    }
    .mbn-item.active .mbn-icon {
        animation: none !important;
    }
}
'''

if css_anchor not in index:
    raise SystemExit("No se encontró el bloque activo de la barra inferior en index.html")
index = index.replace(css_anchor, css_new, 1)

# Añadimos una función única que calcula la posición real según el número de botones.
js_anchor = '''// --- BARRA DE NAVEGACIÓN INFERIOR (solo móvil/tablet) ---
// Cada botón de la barra de abajo solo simula el clic del enlace
// equivalente del menú de arriba (data-vinculado guarda su id), así
// que no duplicamos ninguna lógica: toda la navegación real sigue
// pasando por los mismos handlers de siempre.
document.querySelectorAll(".mbn-item").forEach(boton => {
    boton.addEventListener("click", () => {
        const idVinculado = boton.dataset.vinculado;
        document.querySelectorAll(".mbn-item").forEach(b => b.classList.remove("active"));
        boton.classList.add("active");
        const elementoOriginal = idVinculado && document.getElementById(idVinculado);
        if(elementoOriginal) elementoOriginal.click();
    });
});
'''

js_new = '''// --- BARRA DE NAVEGACIÓN INFERIOR (solo móvil/tablet) ---
// MOBILE_BOTTOM_NAV_SLIDER_JS_V2_20260909
// El indicador amarillo es único y su posición se guarda en una variable CSS.
// Así puede deslizarse entre botones en vez de desaparecer y reaparecer.
function actualizarIndicadorBarraMovil(){
    const barra = document.getElementById("mobileBottomNav");
    if(!barra) return;

    const botones = Array.from(barra.querySelectorAll(".mbn-item"));
    if(!botones.length) return;

    let indice = botones.findIndex(boton => boton.classList.contains("active"));
    if(indice < 0) indice = 0;

    const posicion = ((indice + 0.5) / botones.length) * 100;
    barra.style.setProperty("--mbn-posicion", posicion + "%");
}

// Cada botón de la barra de abajo simula el clic del enlace equivalente
// del menú superior, manteniendo una sola lógica de navegación.
document.querySelectorAll(".mbn-item").forEach(boton => {
    boton.addEventListener("click", () => {
        const idVinculado = boton.dataset.vinculado;
        document.querySelectorAll(".mbn-item").forEach(b => b.classList.remove("active"));
        boton.classList.add("active");
        actualizarIndicadorBarraMovil();

        const elementoOriginal = idVinculado && document.getElementById(idVinculado);
        if(elementoOriginal) elementoOriginal.click();
    });
});

// Posición inicial al cargar la página.
actualizarIndicadorBarraMovil();
'''

if js_anchor not in script:
    raise SystemExit("No se encontró el bloque de eventos de la barra inferior en script.js")
script = script.replace(js_anchor, js_new, 1)

# Cada navegación también sincroniza el estado activo desde activarBotonMenu().
sync_anchor = '''    document.querySelectorAll(".mbn-item").forEach((boton) => {
        boton.classList.toggle("active", boton.dataset.vinculado === idActivo);
    });
}'''

sync_new = '''    document.querySelectorAll(".mbn-item").forEach((boton) => {
        boton.classList.toggle("active", boton.dataset.vinculado === idActivo);
    });
    actualizarIndicadorBarraMovil();
}'''

if sync_anchor not in script:
    raise SystemExit("No se encontró la sincronización de activarBotonMenu()")
script = script.replace(sync_anchor, sync_new, 1)

# Nueva versión de la PWA para que el móvil no conserve index/script anteriores.
if 'const VERSION_APP = "v47";' not in sw:
    raise SystemExit("La versión esperada de la PWA no es v47")
sw = sw.replace('const VERSION_APP = "v47";', 'const VERSION_APP = "v48";', 1)

index_path.write_text(index.rstrip() + "\n", encoding="utf-8")
script_path.write_text(script.rstrip() + "\n", encoding="utf-8")
sw_path.write_text(sw.rstrip() + "\n", encoding="utf-8")
