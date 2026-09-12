from pathlib import Path
import re

css = Path('css/mejoras-producto.css')
texto = css.read_text(encoding='utf-8')
marcador = 'CONTROLES_VIDEO_PALABRA_V1_20260912'

bloque = r'''

/* ============================================================
   CONTROLES_VIDEO_PALABRA_V1_20260912
   Rediseño visual de los controles del video en las fichas de
   Diccionario y Vocabulario. Mantiene intactas las 7 velocidades
   existentes y conserva tortuga/conejo como apoyo visual.
   ============================================================ */
#resultado .controles-video,
#resultadoCategorias .controles-video {
    width: 100%;
    max-width: 760px;
    margin: 10px auto 0 !important;
    padding: 10px 12px;
    border: 1px solid rgba(197, 145, 18, .28);
    border-radius: 18px;
    background: linear-gradient(180deg, #fff9e8 0%, #fff3cf 100%);
    box-shadow: 0 8px 20px rgba(15, 23, 42, .08), inset 0 1px 0 rgba(255, 255, 255, .9);
    gap: 9px !important;
}

#resultado .controles-video > .btn,
#resultadoCategorias .controles-video > .btn {
    min-width: 48px;
    min-height: 48px;
    padding: 7px 11px;
    border: 0 !important;
    border-radius: 15px !important;
    background: linear-gradient(180deg, #132858 0%, #0c1c42 100%) !important;
    color: #fff !important;
    font-weight: 800;
    box-shadow: 0 6px 13px rgba(15, 30, 67, .19), inset 0 1px 0 rgba(255, 255, 255, .1);
    transition: transform .16s ease, box-shadow .16s ease, filter .16s ease;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
}

#resultado .controles-video > .btn:hover,
#resultadoCategorias .controles-video > .btn:hover,
#resultado .controles-video > .btn:focus-visible,
#resultadoCategorias .controles-video > .btn:focus-visible {
    color: #fff !important;
    filter: brightness(1.08);
    transform: translateY(-1px);
    box-shadow: 0 8px 17px rgba(15, 30, 67, .24), 0 0 0 3px rgba(255, 193, 7, .14);
    outline: none;
}

#resultado .controles-video > .btn:active,
#resultadoCategorias .controles-video > .btn:active {
    transform: scale(.96);
}

/* Reproducir/Pausar es la acción principal: amarillo de marca. */
#resultado #btnPlayPause,
#resultadoCategorias #btnPlayPause,
#resultado #btnPlayPauseSugerida,
#resultadoCategorias #btnPlayPauseSugerida {
    background: linear-gradient(180deg, #ffd84c 0%, #f6bb08 100%) !important;
    color: #14213d !important;
    box-shadow: 0 7px 16px rgba(190, 137, 4, .24), inset 0 1px 0 rgba(255, 255, 255, .55) !important;
}

#resultado #btnPlayPause:hover,
#resultadoCategorias #btnPlayPause:hover,
#resultado #btnPlayPauseSugerida:hover,
#resultadoCategorias #btnPlayPauseSugerida:hover,
#resultado #btnPlayPause:focus-visible,
#resultadoCategorias #btnPlayPause:focus-visible,
#resultado #btnPlayPauseSugerida:focus-visible,
#resultadoCategorias #btnPlayPauseSugerida:focus-visible {
    color: #14213d !important;
    filter: brightness(1.02);
}

#resultado .controles-video-texto,
#resultadoCategorias .controles-video-texto {
    font-size: .72rem;
    font-weight: 800;
    line-height: 1;
}

/* La velocidad se lee como una sola pastilla: tortuga | 1x | conejo. */
#resultado .controles-video-velocidad,
#resultadoCategorias .controles-video-velocidad {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 5px 7px;
    border: 1px solid rgba(20, 33, 61, .12);
    border-radius: 999px;
    background: rgba(255, 255, 255, .78);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9);
}

#resultado .controles-video-velocidad .btn,
#resultadoCategorias .controles-video-velocidad .btn {
    width: 40px;
    height: 40px;
    min-width: 40px;
    padding: 0 !important;
    display: inline-grid;
    place-items: center;
    border: 0 !important;
    border-radius: 50% !important;
    background: #132858 !important;
    color: #fff !important;
    font-size: 1rem;
    box-shadow: 0 4px 10px rgba(15, 30, 67, .17);
    transition: transform .16s ease, background-color .16s ease;
    touch-action: manipulation;
}

#resultado .controles-video-velocidad .btn:active,
#resultadoCategorias .controles-video-velocidad .btn:active {
    transform: scale(.92);
}

#resultado #palabraVelocidadLabel,
#resultadoCategorias #palabraVelocidadLabel,
#resultado #velocidadSugeridaLabel,
#resultadoCategorias #velocidadSugeridaLabel {
    min-width: 42px;
    text-align: center;
    color: #14213d !important;
    font-size: .98rem !important;
    font-weight: 900 !important;
    letter-spacing: -.01em;
}

/* Móvil: dos filas claras. Arriba acciones, abajo velocidad + fullscreen. */
@media (max-width: 767.98px) {
    #resultado .controles-video,
    #resultadoCategorias .controles-video {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        align-items: center;
        gap: 8px !important;
        padding: 9px;
        border-radius: 17px;
    }

    #resultado .controles-video > .btn,
    #resultadoCategorias .controles-video > .btn {
        width: 100%;
        min-width: 0;
        min-height: 50px;
        padding: 7px 5px;
        border-radius: 14px !important;
        font-size: .94rem;
    }

    #resultado .controles-video-velocidad,
    #resultadoCategorias .controles-video-velocidad {
        grid-column: 1 / span 3;
        width: 100%;
        min-width: 0;
        min-height: 50px;
        justify-content: space-evenly;
        padding: 5px 9px;
    }

    #resultado .controles-video-velocidad + .btn,
    #resultadoCategorias .controles-video-velocidad + .btn {
        grid-column: 4;
        width: 100%;
        min-width: 0;
        min-height: 50px;
    }

    #resultado .controles-video-velocidad .btn,
    #resultadoCategorias .controles-video-velocidad .btn {
        width: 40px;
        height: 40px;
        min-width: 40px;
        font-size: 1.06rem;
    }

    #resultado .controles-video-texto,
    #resultadoCategorias .controles-video-texto {
        font-size: .66rem;
    }
}

@media (max-width: 390px) {
    #resultado .controles-video,
    #resultadoCategorias .controles-video {
        gap: 6px !important;
        padding: 8px;
    }

    #resultado .controles-video > .btn,
    #resultadoCategorias .controles-video > .btn {
        min-height: 48px;
        font-size: .88rem;
    }
}

@media (prefers-reduced-motion: reduce) {
    #resultado .controles-video .btn,
    #resultadoCategorias .controles-video .btn {
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
