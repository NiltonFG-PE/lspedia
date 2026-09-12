from pathlib import Path
import re

js_path = Path("js/script.js")
css_path = Path("css/mejoras-producto.css")
sw_path = Path("sw.js")

js = js_path.read_text(encoding="utf-8")

patron = re.compile(
    r'''    try \{\n        const esPantallaTactil = \(.*?\n    \} catch\(error\)\{\n        console\.warn\("No se pudo activar fullscreen nativo; usando respaldo visual\.", error\);\n        wrap\.classList\.add\("video-palabra-pantalla-completa-fallback"\);\n    \}''',
    re.S,
)

nuevo = '''    try {
        if(wrap.requestFullscreen){
            await wrap.requestFullscreen({ navigationUI: "hide" });
        } else {
            wrap.classList.add("video-palabra-pantalla-completa-fallback");
        }
    } catch(error){
        console.warn("No se pudo activar fullscreen nativo; usando respaldo visual.", error);
        wrap.classList.add("video-palabra-pantalla-completa-fallback");
    }'''

js2, reemplazos = patron.subn(nuevo, js, count=1)
if reemplazos != 1:
    raise SystemExit(f"No se encontro el bloque tactil a revertir; reemplazos={reemplazos}")

js_path.write_text(js2, encoding="utf-8")

css = css_path.read_text(encoding="utf-8")
marcador = "FULLSCREEN_VIDEO_MOVIL_NATIVE_TOAST_FIX_V2_20260912"
if marcador not in css:
    css += r'''

/* ============================================================
   FULLSCREEN_VIDEO_MOVIL_NATIVE_TOAST_FIX_V2_20260912
   Android/Chrome: mantenemos fullscreen nativo porque es el modo mas
   estable para YouTube. El aviso del navegador aparece temporalmente
   en la parte inferior; por eso la barra personalizada comienza elevada
   y luego baja suavemente cuando el aviso ya desaparecio.
   ============================================================ */
@keyframes lspControlesFullscreenEvitarAvisoChrome {
    0%, 88% {
        bottom: calc(154px + env(safe-area-inset-bottom, 0px));
    }
    100% {
        bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    }
}

@media (pointer: coarse), (max-width: 900px) {
    body .video-palabra-pantalla-completa:fullscreen > .video-palabra-controles-pantalla-completa,
    body .video-palabra-pantalla-completa:-webkit-full-screen > .video-palabra-controles-pantalla-completa {
        position: absolute !important;
        left: 8px !important;
        right: 8px !important;
        top: auto !important;
        width: auto !important;
        max-width: none !important;
        margin: 0 !important;
        border-radius: 18px !important;
        padding: 7px 8px calc(7px + env(safe-area-inset-bottom, 0px)) !important;
        background: rgba(7, 12, 28, .96) !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, .34) !important;
        z-index: 2147483646 !important;
        animation: lspControlesFullscreenEvitarAvisoChrome 6.2s ease-out forwards !important;
    }

    body .video-palabra-pantalla-completa:fullscreen > .video-palabra-controles-pantalla-completa .controles-video-velocidad,
    body .video-palabra-pantalla-completa:-webkit-full-screen > .video-palabra-controles-pantalla-completa .controles-video-velocidad {
        min-width: 0 !important;
    }
}

@media (prefers-reduced-motion: reduce) {
    body .video-palabra-pantalla-completa:fullscreen > .video-palabra-controles-pantalla-completa,
    body .video-palabra-pantalla-completa:-webkit-full-screen > .video-palabra-controles-pantalla-completa {
        animation-duration: 6.2s !important;
        animation-timing-function: steps(1, end) !important;
    }
}
'''
    css_path.write_text(css, encoding="utf-8")

sw = sw_path.read_text(encoding="utf-8")
sw2, cambios_sw = re.subn(
    r'const VERSION_APP = "v\d+";',
    'const VERSION_APP = "v89";',
    sw,
    count=1,
)
if cambios_sw != 1:
    raise SystemExit("No se pudo actualizar VERSION_APP a v89")

sw_path.write_text(sw2, encoding="utf-8")
