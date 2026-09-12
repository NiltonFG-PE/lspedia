from pathlib import Path
import re

css = Path('css/mejoras-producto.css')
texto = css.read_text(encoding='utf-8')
marcador = 'CONTROLES_VIDEO_VISUAL_V1_20260912'

bloque = r'''

/* ============================================================
   CONTROLES_VIDEO_VISUAL_V1_20260912
   Rediseño visual de los controles del reproductor.
   Conserva la lógica y las 7 velocidades actuales, incluida la ayuda
   visual de tortuga (más lento) y conejo (más rápido).
   ============================================================ */
.controles-video {
    width: fit-content;
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
    padding: 9px 10px !important;
    gap: 8px !important;
    flex-wrap: wrap !important;
    background: linear-gradient(180deg, #fffaf0 0%, #fff3cc 100%);
    border: 1px solid rgba(212, 163, 24, .28);
    border-radius: 18px;
    box-shadow: 0 8px 22px rgba(15, 23, 42, .10), inset 0 1px 0 rgba(255, 255, 255, .8);
}

.controles-video > .btn,
.controles-video-velocidad > .btn {
    width: 46px;
    min-width: 46px;
    height: 46px;
    padding: 0 !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0 !important;
    border-radius: 14px !important;
    background: linear-gradient(180deg, #15254d 0%, #0f172a 100%) !important;
    color: #fff !important;
    font-size: 17px !important;
    line-height: 1 !important;
    box-shadow: 0 5px 12px rgba(15, 23, 42, .18), inset 0 1px 0 rgba(255,255,255,.08) !important;
    transition: transform .16s ease, box-shadow .16s ease, filter .16s ease !important;
    -webkit-tap-highlight-color: transparent;
}

.controles-video > .btn:hover,
.controles-video > .btn:focus-visible,
.controles-video-velocidad > .btn:hover,
.controles-video-velocidad > .btn:focus-visible {
    transform: translateY(-1px);
    filter: brightness(1.08);
    box-shadow: 0 7px 16px rgba(15, 23, 42, .22), 0 0 0 3px rgba(255, 193, 7, .14) !important;
}

.controles-video > .btn:active,
.controles-video-velocidad > .btn:active {
    transform: scale(.95);
}

#btnPlayPause,
#btnPlayPauseSugerida,
#btnPlayPauseNosotros {
    width: 52px !important;
    min-width: 52px !important;
    height: 52px !important;
    border-radius: 16px !important;
    background: linear-gradient(180deg, #ffd83d 0%, #f5b900 100%) !important;
    color: #102044 !important;
    font-size: 18px !important;
    box-shadow: 0 7px 16px rgba(214, 157, 0, .25), inset 0 1px 0 rgba(255,255,255,.58) !important;
}

.controles-video-velocidad {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    gap: 5px !important;
    min-height: 52px;
    padding: 4px 6px;
    flex-shrink: 0;
    background: rgba(255,255,255,.78);
    border: 1px solid rgba(15, 23, 42, .10);
    border-radius: 16px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.9);
}

.controles-video-velocidad > .btn {
    width: 42px !important;
    min-width: 42px !important;
    height: 42px !important;
    border-radius: 13px !important;
    font-size: 18px !important;
}

#palabraVelocidadLabel,
#velocidadLabelSugerida,
#nosotrosVelocidadLabel {
    min-width: 38px;
    margin: 0 1px;
    color: #172554 !important;
    font-size: 16px !important;
    font-weight: 900 !important;
    text-align: center;
    letter-spacing: -.2px;
}

@media (max-width: 767.98px) {
    .controles-video {
        width: 100%;
        padding: 8px !important;
        gap: 7px !important;
        border-radius: 16px;
    }

    .controles-video .controles-video-texto {
        display: none !important;
    }

    .controles-video > .btn {
        width: 44px;
        min-width: 44px;
        height: 44px;
        border-radius: 13px !important;
        font-size: 16px !important;
    }

    #btnPlayPause,
    #btnPlayPauseSugerida,
    #btnPlayPauseNosotros {
        width: 50px !important;
        min-width: 50px !important;
        height: 50px !important;
    }

    .controles-video-velocidad {
        min-height: 50px;
        padding: 4px 5px;
    }

    .controles-video-velocidad > .btn {
        width: 40px !important;
        min-width: 40px !important;
        height: 40px !important;
    }
}

@media (max-width: 420px) {
    .controles-video {
        gap: 6px !important;
    }

    .controles-video > .btn {
        width: 42px;
        min-width: 42px;
        height: 42px;
    }

    #btnPlayPause,
    #btnPlayPauseSugerida,
    #btnPlayPauseNosotros {
        width: 48px !important;
        min-width: 48px !important;
        height: 48px !important;
    }

    .controles-video-velocidad {
        order: 10;
    }
}

@media (prefers-reduced-motion: reduce) {
    .controles-video > .btn,
    .controles-video-velocidad > .btn {
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
