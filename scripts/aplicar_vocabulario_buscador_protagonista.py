#!/usr/bin/env python3
from pathlib import Path
import re

index = Path('index.html')
texto = index.read_text(encoding='utf-8')

# Evita duplicar el bloque si el flujo se reejecuta.
texto = re.sub(
    r'\n\s*<style id="vocabulario-buscador-protagonista">.*?</style>\s*\n',
    '\n',
    texto,
    flags=re.S,
)

for requerido in (
    'id="bloqueBuscadorCategorias"',
    'id="vocabularioIntroLista"',
    'id="colAvatarHero"',
    'id="tituloPrincipal"',
):
    if requerido not in texto:
        raise SystemExit(f'ERROR: no se encontró {requerido} en index.html')

estilos = r'''
    <style id="vocabulario-buscador-protagonista">
        /* Vocabulario móvil: composición más compacta y buscador como
           protagonista. Se apoya en la clase vista-temas-movil que ya
           activa script.js únicamente mientras Vocabulario está abierto. */
        @media (max-width: 991.98px) {
            body.vista-temas-movil #filaHeroPrincipal {
                grid-template-columns: minmax(0, 1.7fr) minmax(112px, 0.7fr) !important;
                grid-template-areas: "titulo avatar" !important;
                column-gap: 8px !important;
                row-gap: 0 !important;
                margin-top: 10px !important;
                margin-bottom: 6px !important;
                --bs-gutter-y: 0.35rem;
            }

            body.vista-temas-movil #bloqueTituloPrincipal {
                margin-bottom: 0 !important;
                text-align: left !important;
            }

            body.vista-temas-movil #tituloPrincipal {
                font-size: clamp(1.62rem, 7vw, 1.95rem) !important;
                line-height: 1.13 !important;
                margin-bottom: 6px !important;
                letter-spacing: -0.025em;
            }

            body.vista-temas-movil #bloqueTituloPrincipal .titulo-raya {
                width: 46px !important;
                height: 4px !important;
                margin: 8px 0 10px !important;
            }

            body.vista-temas-movil #subtituloPrincipal {
                display: none !important;
            }

            /* Las tres ideas pasan a una sola tarjeta compacta. */
            body.vista-temas-movil #vocabularioIntroLista {
                gap: 0 !important;
                margin: 6px 0 2px !important;
                padding: 8px 10px !important;
                border-radius: 18px;
                border: 1px solid #d9eaff;
                background: linear-gradient(145deg, #f8fbff 0%, #eef6ff 100%);
                box-shadow: 0 6px 18px rgba(30, 100, 200, 0.07);
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-item {
                gap: 9px !important;
                padding: 8px 0 !important;
                align-items: center !important;
                border-bottom: 1px solid rgba(13, 110, 253, 0.09);
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-item:last-child {
                border-bottom: 0;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-icono {
                width: 38px !important;
                height: 38px !important;
                min-width: 38px !important;
                font-size: 14px !important;
                box-shadow: 0 5px 12px rgba(13, 110, 253, 0.16);
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-icono::after {
                display: none !important;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-texto {
                margin: 0 !important;
                font-size: clamp(0.82rem, 3.25vw, 0.96rem) !important;
                line-height: 1.38 !important;
            }

            body.vista-temas-movil #colAvatarHero {
                align-self: end !important;
                margin: 0 !important;
                padding: 0 !important;
                min-width: 0;
            }

            /* Conserva el video animado avatar_lupa.webm; solo cambia
               su tamaño y posición dentro del nuevo layout compacto. */
            body.vista-temas-movil #colAvatarHero .avatar-hero-img {
                height: clamp(128px, 29vw, 158px) !important;
                max-width: 100% !important;
                object-fit: contain;
                object-position: center bottom;
            }

            /* BUSCADOR PROTAGONISTA */
            body.vista-temas-movil #bloqueBuscadorCategorias {
                margin-top: 0 !important;
                margin-bottom: 18px !important;
                padding: 0 2px;
            }

            body.vista-temas-movil #bloqueBuscadorCategorias > .col-lg-8 {
                width: 100% !important;
                max-width: 100% !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
            }

            body.vista-temas-movil #bloqueBuscadorCategorias .input-group {
                min-height: 66px;
                border: 3px solid #1976f3 !important;
                border-radius: 999px !important;
                background: #ffffff !important;
                box-shadow: 0 10px 26px rgba(25, 118, 243, 0.18),
                            0 0 0 5px rgba(25, 118, 243, 0.045) !important;
                overflow: hidden !important;
                position: relative;
                flex-wrap: nowrap;
                animation: vocabBuscadorEntrada 0.46s ease-out both,
                           vocabBuscadorPulso 1.25s ease-in-out 0.7s 1;
                transition: box-shadow 0.22s ease, transform 0.22s ease;
            }

            body.vista-temas-movil #bloqueBuscadorCategorias .input-group::before {
                content: "🔎";
                width: 54px;
                flex: 0 0 54px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.32rem;
                background: #fff;
            }

            body.vista-temas-movil #buscarCategorias {
                min-width: 0;
                height: 60px !important;
                padding: 0 10px 0 0 !important;
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                font-size: clamp(1rem, 4.25vw, 1.18rem) !important;
                font-weight: 500;
                color: #46566c !important;
            }

            body.vista-temas-movil #buscarCategorias::placeholder {
                color: #6b7280;
                opacity: 1;
            }

            body.vista-temas-movil #btnBuscarCategorias {
                min-width: 82px;
                padding: 0 20px !important;
                border: 0 !important;
                border-radius: 0 !important;
                background: linear-gradient(135deg, #2785ff 0%, #0867ea 100%) !important;
                box-shadow: inset 1px 0 0 rgba(255,255,255,0.25);
                transition: transform 0.16s ease, filter 0.16s ease;
            }

            body.vista-temas-movil #btnBuscarCategorias span {
                font-size: 1.45rem !important;
            }

            body.vista-temas-movil #btnBuscarCategorias:active {
                transform: scale(0.96);
                filter: brightness(0.96);
            }

            body.vista-temas-movil #bloqueBuscadorCategorias .input-group:focus-within {
                transform: translateY(-1px);
                box-shadow: 0 13px 30px rgba(25, 118, 243, 0.24),
                            0 0 0 6px rgba(25, 118, 243, 0.08) !important;
            }

            body.vista-temas-movil #sugerenciasCategorias {
                margin-top: 8px !important;
                border-radius: 18px !important;
            }

            /* Las categorías quedan cerca del buscador para evitar el gran
               vacío que se veía antes de las tarjetas. */
            body.vista-temas-movil #panelCategorias {
                margin-top: 0 !important;
                padding-top: 0 !important;
            }

            @keyframes vocabBuscadorEntrada {
                from { opacity: 0; transform: translateY(10px) scale(0.985); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
            }

            @keyframes vocabBuscadorPulso {
                0%, 100% {
                    box-shadow: 0 10px 26px rgba(25, 118, 243, 0.18),
                                0 0 0 5px rgba(25, 118, 243, 0.045);
                }
                50% {
                    box-shadow: 0 13px 31px rgba(25, 118, 243, 0.27),
                                0 0 0 8px rgba(25, 118, 243, 0.09);
                }
            }
        }

        @media (prefers-reduced-motion: reduce) {
            body.vista-temas-movil #bloqueBuscadorCategorias .input-group {
                animation: none !important;
            }
        }
    </style>
'''

if '</head>' not in texto:
    raise SystemExit('ERROR: no se encontró </head> en index.html')
texto = texto.replace('</head>', estilos + '\n</head>', 1)
index.write_text(texto, encoding='utf-8', newline='\n')

sw = Path('sw.js')
sw_texto = sw.read_text(encoding='utf-8')
sw_nuevo, cambios = re.subn(
    r'const VERSION_APP = "v31";',
    'const VERSION_APP = "v32";',
    sw_texto,
    count=1,
)
if cambios != 1:
    raise SystemExit('ERROR: no se encontró VERSION_APP v31 en sw.js')
sw.write_text(sw_nuevo, encoding='utf-8', newline='\n')
