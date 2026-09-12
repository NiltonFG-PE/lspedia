from pathlib import Path
import re

js_path = Path('js/script.js')
css_path = Path('css/mejoras-producto.css')
sw_path = Path('sw.js')

js = js_path.read_text(encoding='utf-8')

patron = re.compile(
    r'let wrapIdPantallaCompletaActiva = null;\s*\n\s*function toggleVideoPalabraPantallaCompleta\(wrapId, btnId, forzarCerrar\) \{.*?\n\}\s*\nlet wrapIdBtnPantallaCompletaActiva = null;',
    re.S
)

nuevo = r'''let wrapIdPantallaCompletaActiva = null;
let wrapIdBtnPantallaCompletaActiva = null;
let estadoPantallaCompletaVideoPalabra = null;
let cerrandoPantallaCompletaVideoPalabra = false;

function restaurarControlesPantallaCompletaVideoPalabra(){
    const estado = estadoPantallaCompletaVideoPalabra;
    if(!estado) return;

    const { wrap, controles, marcadorControles, btn } = estado;

    if(wrap){
        wrap.classList.remove("video-palabra-pantalla-completa");
        wrap.classList.remove("video-palabra-pantalla-completa-fallback");
    }

    if(controles){
        controles.classList.remove("video-palabra-controles-pantalla-completa");
        if(marcadorControles && marcadorControles.parentNode){
            marcadorControles.parentNode.insertBefore(controles, marcadorControles);
            marcadorControles.remove();
        }
    }

    document.body.classList.remove("video-palabra-pantalla-completa-activa");

    if(btn){
        btn.textContent = "⛶";
        btn.setAttribute("aria-label", "Ver en pantalla completa");
        btn.setAttribute("title", "Ver en pantalla completa");
    }

    wrapIdPantallaCompletaActiva = null;
    wrapIdBtnPantallaCompletaActiva = null;
    estadoPantallaCompletaVideoPalabra = null;
}

async function toggleVideoPalabraPantallaCompleta(wrapId, btnId, forzarCerrar) {
    const wrap = document.getElementById(wrapId);
    const btn = document.getElementById(btnId);
    if (!wrap) return;

    const cerrar = forzarCerrar === true || wrapIdPantallaCompletaActiva === wrapId;

    if(cerrar){
        if(cerrandoPantallaCompletaVideoPalabra) return;
        cerrandoPantallaCompletaVideoPalabra = true;
        try {
            if(document.fullscreenElement && document.exitFullscreen){
                await document.exitFullscreen().catch(() => {});
            }
        } finally {
            restaurarControlesPantallaCompletaVideoPalabra();
            cerrandoPantallaCompletaVideoPalabra = false;
        }
        return;
    }

    if(wrapIdPantallaCompletaActiva){
        await toggleVideoPalabraPantallaCompleta(
            wrapIdPantallaCompletaActiva,
            wrapIdBtnPantallaCompletaActiva,
            true
        );
    }

    const hermano = wrap.nextElementSibling;
    const controles = hermano && hermano.classList.contains("controles-video")
        ? hermano
        : null;
    let marcadorControles = null;

    if(controles && controles.parentNode){
        marcadorControles = document.createComment("lspedia-controles-video-origen");
        controles.parentNode.insertBefore(marcadorControles, controles);
        wrap.appendChild(controles);
        controles.classList.add("video-palabra-controles-pantalla-completa");
    }

    wrap.classList.add("video-palabra-pantalla-completa");
    document.body.classList.add("video-palabra-pantalla-completa-activa");
    wrapIdPantallaCompletaActiva = wrapId;
    wrapIdBtnPantallaCompletaActiva = btnId;
    estadoPantallaCompletaVideoPalabra = { wrap, controles, marcadorControles, btn };

    if(btn){
        btn.textContent = "✕";
        btn.setAttribute("aria-label", "Salir de pantalla completa");
        btn.setAttribute("title", "Salir de pantalla completa");
    }

    try {
        if(wrap.requestFullscreen){
            await wrap.requestFullscreen({ navigationUI: "hide" });
        } else {
            wrap.classList.add("video-palabra-pantalla-completa-fallback");
        }
    } catch(error){
        console.warn("No se pudo activar fullscreen nativo; usando respaldo visual.", error);
        wrap.classList.add("video-palabra-pantalla-completa-fallback");
    }
}

document.addEventListener("fullscreenchange", () => {
    if(
        wrapIdPantallaCompletaActiva &&
        !document.fullscreenElement &&
        !cerrandoPantallaCompletaVideoPalabra
    ){
        restaurarControlesPantallaCompletaVideoPalabra();
    }
});'''

js2, n = patron.subn(nuevo, js, count=1)
if n != 1:
    raise SystemExit(f'No se encontró el bloque de fullscreen esperado; reemplazos={n}')
js_path.write_text(js2, encoding='utf-8')

css = css_path.read_text(encoding='utf-8')
marcador = 'FULLSCREEN_VIDEO_MOVIL_FIX_V1_20260912'
if marcador not in css:
    css += r'''

/* ============================================================
   FULLSCREEN_VIDEO_MOVIL_FIX_V1_20260912
   Corrige la vista de pantalla completa en Android/Chrome.
   El iframe ocupa correctamente el área disponible y los controles
   personalizados permanecen visibles dentro del fullscreen real.
   ============================================================ */
.video-palabra-pantalla-completa,
.video-palabra-pantalla-completa:fullscreen {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    padding: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    justify-content: stretch !important;
    background: #000 !important;
    border: 0 !important;
    border-radius: 0 !important;
    overflow: hidden !important;
    z-index: 2147483000 !important;
}

.video-palabra-pantalla-completa iframe,
.video-palabra-pantalla-completa:fullscreen iframe {
    position: relative !important;
    inset: auto !important;
    display: block !important;
    flex: 1 1 0 !important;
    width: 100% !important;
    height: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    aspect-ratio: auto !important;
    background: #000 !important;
}

body .video-palabra-pantalla-completa > .video-palabra-controles-pantalla-completa,
body .video-palabra-pantalla-completa:fullscreen > .video-palabra-controles-pantalla-completa {
    position: relative !important;
    inset: auto !important;
    left: auto !important;
    right: auto !important;
    top: auto !important;
    bottom: auto !important;
    flex: 0 0 auto !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px)) !important;
    transform: none !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: rgba(7, 12, 28, .97) !important;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, .28) !important;
    z-index: 2147483646 !important;
}

body.video-palabra-pantalla-completa-activa {
    overflow: hidden !important;
    overscroll-behavior: none;
}

@media (max-width: 767.98px) {
    body .video-palabra-pantalla-completa > .video-palabra-controles-pantalla-completa,
    body .video-palabra-pantalla-completa:fullscreen > .video-palabra-controles-pantalla-completa {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 6px !important;
        padding: 7px 8px calc(7px + env(safe-area-inset-bottom, 0px)) !important;
    }

    body .video-palabra-pantalla-completa > .video-palabra-controles-pantalla-completa .controles-video-velocidad,
    body .video-palabra-pantalla-completa:fullscreen > .video-palabra-controles-pantalla-completa .controles-video-velocidad {
        grid-column: 1 / span 3 !important;
        width: 100% !important;
        min-width: 0 !important;
    }

    body .video-palabra-pantalla-completa > .video-palabra-controles-pantalla-completa .controles-video-velocidad + .btn,
    body .video-palabra-pantalla-completa:fullscreen > .video-palabra-controles-pantalla-completa .controles-video-velocidad + .btn {
        grid-column: 4 !important;
        width: 100% !important;
    }
}
'''
    css_path.write_text(css, encoding='utf-8')

sw = sw_path.read_text(encoding='utf-8')
sw2, nsw = re.subn(r'const VERSION_APP = "v\d+";', 'const VERSION_APP = "v87";', sw, count=1)
if nsw != 1:
    raise SystemExit('No se pudo actualizar VERSION_APP')
sw_path.write_text(sw2, encoding='utf-8')
