from pathlib import Path
import re

css = Path('css/mejoras-producto.css')
texto = css.read_text(encoding='utf-8')
marcador = 'CONTROLES_VIDEO_VISUAL_V2_20260912'

bloque = r'''

/* ============================================================
   CONTROLES_VIDEO_VISUAL_V2_20260912
   Rediseño visual de los controles del video. Conserva intactas
   las velocidades actuales y los iconos tortuga/conejo porque son
   una referencia visual importante para usuarios sordos.
   ============================================================ */
body .controles-video-compactos {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin-top: 10px;
    padding: 9px 10px;
    border: 1px solid rgba(190, 145, 24, 0.24);
    border-radius: 18px;
    background: linear-gradient(180deg, #fffaf0 0%, #fff2cf 100%);
    box-shadow:
        0 7px 18px rgba(15, 23, 42, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

body .controles-video-compactos > .btn {
    width: 46px;
    height: 46px;
    min-width: 46px;
    min-height: 46px;
    padding: 0 !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 14px !important;
    background: linear-gradient(180deg, #172856 0%, #0d1838 100%) !important;
    color: #ffffff !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    font-size: 1rem;
    font-weight: 800;
    box-shadow:
        0 6px 12px rgba(10, 22, 56, 0.20),
        inset 0 1px 0 rgba(255, 255, 255, 0.10);
    transition:
        transform 0.16s ease,
        box-shadow 0.16s ease,
        filter 0.16s ease;
    -webkit-tap-highlight-color: transparent;
}

/* Reproducir/Pausar: control principal, más visible sin cambiar su función. */
body .controles-video-compactos > .btn:nth-child(2) {
    width: 52px;
    height: 52px;
    min-width: 52px;
    min-height: 52px;
    border-radius: 16px !important;
    background: linear-gradient(180deg, #ffd84a 0%, #f5b900 100%) !important;
    color: #102047 !important;
    border-color: rgba(181, 130, 0, 0.22) !important;
    box-shadow:
        0 8px 18px rgba(201, 147, 0, 0.24),
        inset 0 1px 0 rgba(255, 255, 255, 0.58);
}

body .controles-video-compactos > .btn:hover,
body .controles-video-compactos > .btn:focus-visible {
    filter: brightness(1.08);
    transform: translateY(-1px);
}

body .controles-video-compactos > .btn:active {
    transform: scale(0.94);
    box-shadow: 0 3px 8px rgba(10, 22, 56, 0.18);
}

body .controles-video-compactos > .btn:focus-visible,
body .controles-video-velocidad .btn:focus-visible {
    outline: 3px solid rgba(255, 193, 7, 0.38) !important;
    outline-offset: 2px;
}

/* La tortuga, la velocidad y el conejo se mantienen siempre juntos y
   ahora se leen como un único control visual. */
body .controles-video-velocidad {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 52px;
    padding: 4px 6px;
    border: 1px solid rgba(15, 23, 42, 0.14);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.88);
    color: #102047;
    font-size: 1rem;
    font-weight: 900;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.95),
        0 4px 10px rgba(15, 23, 42, 0.07);
    flex-shrink: 0;
}

body .controles-video-velocidad .btn {
    width: 43px;
    height: 43px;
    min-width: 43px;
    min-height: 43px;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 999px !important;
    background: linear-gradient(180deg, #172856 0%, #0d1838 100%) !important;
    color: #ffffff !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.08rem;
    line-height: 1;
    box-shadow:
        0 5px 10px rgba(10, 22, 56, 0.18),
        inset 0 1px 0 rgba(255, 255, 255, 0.09);
    transition: transform 0.16s ease, filter 0.16s ease;
    -webkit-tap-highlight-color: transparent;
}

body .controles-video-velocidad .btn:hover,
body .controles-video-velocidad .btn:focus-visible {
    filter: brightness(1.10);
    transform: translateY(-1px);
}

body .controles-video-velocidad .btn:active {
    transform: scale(0.93);
}

/* Si el valor 1x/0.8x/etc. está envuelto en un elemento, gana una zona
   central estable; si es texto directo, hereda el mismo peso del grupo. */
body .controles-video-velocidad > span,
body .controles-video-velocidad .velocidad-actual,
body .controles-video-velocidad .texto-velocidad {
    min-width: 38px;
    padding: 0 2px;
    color: #102047;
    text-align: center;
    font-size: 1rem;
    font-weight: 900;
    font-variant-numeric: tabular-nums;
}

/* Pantalla completa conserva el mismo lenguaje visual, pero con un borde
   ligeramente más claro para reconocerlo como acción de vista. */
body .controles-video-compactos > .btn:last-child {
    border-color: rgba(255, 255, 255, 0.22) !important;
}

@media (max-width: 576px) {
    body .controles-video-compactos {
        gap: 6px;
        padding: 8px 7px;
        border-radius: 16px;
    }

    body .controles-video-compactos > .btn {
        width: 43px;
        height: 43px;
        min-width: 43px;
        min-height: 43px;
        border-radius: 13px !important;
        font-size: 0.94rem;
    }

    body .controles-video-compactos > .btn:nth-child(2) {
        width: 48px;
        height: 48px;
        min-width: 48px;
        min-height: 48px;
        border-radius: 15px !important;
    }

    body .controles-video-velocidad {
        gap: 5px;
        min-height: 48px;
        padding: 3px 5px;
        font-size: 0.96rem;
    }

    body .controles-video-velocidad .btn {
        width: 39px;
        height: 39px;
        min-width: 39px;
        min-height: 39px;
        font-size: 1rem;
    }

    body .controles-video-velocidad > span,
    body .controles-video-velocidad .velocidad-actual,
    body .controles-video-velocidad .texto-velocidad {
        min-width: 34px;
        font-size: 0.95rem;
    }
}

@media (prefers-reduced-motion: reduce) {
    body .controles-video-compactos > .btn,
    body .controles-video-velocidad .btn {
        transition: none !important;
    }
}
'''

if marcador not in texto:
    css.write_text(texto.rstrip() + bloque + '\n', encoding='utf-8')

sw = Path('sw.js')
s = sw.read_text(encoding='utf-8')
s2, n = re.subn(r'const VERSION_APP = "v\d+";', 'const VERSION_APP = "v86";', s, count=1)
if n != 1:
    raise SystemExit('No se pudo actualizar VERSION_APP')
sw.write_text(s2, encoding='utf-8')
