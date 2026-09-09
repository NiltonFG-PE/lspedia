#!/usr/bin/env python3
from pathlib import Path
import re

index = Path('index.html')
texto = index.read_text(encoding='utf-8')

nuevo_estilo = r'''<style id="vocabulario-buscador-protagonista">
        /* Vocabulario móvil — ajuste fino: avatar más pequeño, título con
           mejor aprovechamiento del ancho, bloque informativo en 3 filas y
           buscador protagonista sin amontonamiento. */
        @media (max-width: 991.98px) {
            body.vista-temas-movil #filaHeroPrincipal {
                display: grid !important;
                grid-template-columns: minmax(0, 1fr) 108px !important;
                grid-template-areas:
                    "titulo avatar"
                    "info info" !important;
                column-gap: 8px !important;
                row-gap: 8px !important;
                align-items: start !important;
                margin-top: 8px !important;
                margin-bottom: 8px !important;
                --bs-gutter-y: 0;
            }

            body.vista-temas-movil #senalDelDia {
                display: none !important;
            }

            body.vista-temas-movil #bloqueTituloPrincipal {
                grid-area: titulo;
                margin: 0 !important;
                text-align: left !important;
                align-self: center !important;
                min-width: 0;
            }

            body.vista-temas-movil #tituloPrincipal {
                font-size: clamp(1.45rem, 6.1vw, 1.72rem) !important;
                line-height: 1.12 !important;
                letter-spacing: -0.025em;
                margin: 0 !important;
                max-width: none !important;
            }

            body.vista-temas-movil #bloqueTituloPrincipal .titulo-raya {
                width: 44px !important;
                height: 4px !important;
                margin: 9px 0 0 !important;
            }

            body.vista-temas-movil #subtituloPrincipal {
                display: none !important;
            }

            body.vista-temas-movil #colAvatarHero {
                grid-area: avatar;
                align-self: end !important;
                justify-self: end !important;
                justify-content: flex-end !important;
                align-items: flex-end !important;
                margin: 0 !important;
                padding: 0 !important;
                min-width: 0;
                width: 108px !important;
                position: relative;
            }

            body.vista-temas-movil #colAvatarHero::before {
                content: "";
                position: absolute;
                width: 82px;
                height: 82px;
                right: 1px;
                bottom: 2px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(255,193,7,0.16) 0%, rgba(255,193,7,0.05) 56%, rgba(255,193,7,0) 72%);
                pointer-events: none;
            }

            /* Conserva el video avatar_lupa.webm y su animación; solo reduce
               tamaño y corrige la integración visual en móvil. */
            body.vista-temas-movil #colAvatarHero .avatar-hero-img {
                position: relative;
                z-index: 1;
                height: clamp(112px, 28vw, 128px) !important;
                width: auto !important;
                max-width: 108px !important;
                object-fit: contain !important;
                object-position: center bottom !important;
                margin: 0 !important;
            }

            /* Las 3 ideas vuelven a una disposición vertical: una fila por
               concepto, para que el texto tenga aire y sea fácil de leer. */
            body.vista-temas-movil #vocabularioIntroLista {
                grid-area: info;
                display: flex !important;
                flex-direction: column !important;
                gap: 0 !important;
                width: 100% !important;
                margin: 4px 0 2px !important;
                padding: 6px 12px !important;
                border-radius: 18px;
                border: 1px solid #d8e9fb;
                background: linear-gradient(145deg, #fbfdff 0%, #f1f7fd 100%);
                box-shadow: 0 5px 15px rgba(29, 78, 130, 0.06);
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-item {
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                gap: 10px !important;
                width: 100% !important;
                min-width: 0 !important;
                padding: 8px 0 !important;
                margin: 0 !important;
                border-right: 0 !important;
                border-bottom: 1px solid rgba(13, 110, 253, 0.09);
                text-align: left !important;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-item:last-child {
                border-bottom: 0;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-icono {
                width: 36px !important;
                height: 36px !important;
                min-width: 36px !important;
                flex: 0 0 36px !important;
                font-size: 14px !important;
                box-shadow: 0 4px 10px rgba(13, 110, 253, 0.14);
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-icono::after {
                display: none !important;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-texto {
                flex: 1 1 auto !important;
                min-width: 0 !important;
                margin: 0 !important;
                font-size: clamp(0.86rem, 3.55vw, 0.96rem) !important;
                line-height: 1.34 !important;
                text-align: left !important;
            }

            /* BUSCADOR PROTAGONISTA: cerca del bloque superior y con aire
               suficiente antes de las categorías. */
            body.vista-temas-movil #bloqueBuscadorCategorias {
                margin-top: 4px !important;
                margin-bottom: 14px !important;
                padding: 0 2px;
            }

            body.vista-temas-movil #bloqueBuscadorCategorias > .col-lg-8 {
                width: 100% !important;
                max-width: 100% !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
            }

            body.vista-temas-movil #bloqueBuscadorCategorias .input-group {
                min-height: 62px;
                border: 3px solid #1976f3 !important;
                border-radius: 999px !important;
                background: #ffffff !important;
                box-shadow: 0 9px 22px rgba(25, 118, 243, 0.16),
                            0 0 0 4px rgba(25, 118, 243, 0.04) !important;
                overflow: hidden !important;
                position: relative;
                flex-wrap: nowrap;
                animation: vocabBuscadorEntrada 0.42s ease-out both,
                           vocabBuscadorPulso 1.15s ease-in-out 0.65s 1;
                transition: box-shadow 0.22s ease, transform 0.22s ease;
            }

            body.vista-temas-movil #bloqueBuscadorCategorias .input-group::before {
                content: "🔎";
                width: 48px;
                flex: 0 0 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.18rem;
                background: #fff;
            }

            body.vista-temas-movil #buscarCategorias {
                min-width: 0;
                height: 56px !important;
                padding: 0 8px 0 0 !important;
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                font-size: clamp(0.98rem, 4.1vw, 1.14rem) !important;
                font-weight: 500;
                color: #46566c !important;
            }

            body.vista-temas-movil #buscarCategorias::placeholder {
                color: #6b7280;
                opacity: 1;
            }

            body.vista-temas-movil #btnBuscarCategorias {
                min-width: 78px;
                padding: 0 18px !important;
                border: 0 !important;
                border-radius: 0 !important;
                background: linear-gradient(135deg, #2785ff 0%, #0867ea 100%) !important;
                box-shadow: inset 1px 0 0 rgba(255,255,255,0.25);
                transition: transform 0.16s ease, filter 0.16s ease;
            }

            body.vista-temas-movil #btnBuscarCategorias span {
                font-size: 1.35rem !important;
            }

            body.vista-temas-movil #btnBuscarCategorias:active {
                transform: scale(0.96);
                filter: brightness(0.96);
            }

            body.vista-temas-movil #bloqueBuscadorCategorias .input-group:focus-within {
                transform: translateY(-1px);
                box-shadow: 0 12px 27px rgba(25, 118, 243, 0.22),
                            0 0 0 6px rgba(25, 118, 243, 0.07) !important;
            }

            body.vista-temas-movil #sugerenciasCategorias {
                margin-top: 8px !important;
                border-radius: 18px !important;
            }

            body.vista-temas-movil #panelCategorias {
                margin-top: 0 !important;
                padding-top: 0 !important;
            }

            @keyframes vocabBuscadorEntrada {
                from { opacity: 0; transform: translateY(8px) scale(0.99); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
            }

            @keyframes vocabBuscadorPulso {
                0%, 100% {
                    box-shadow: 0 9px 22px rgba(25, 118, 243, 0.16),
                                0 0 0 4px rgba(25, 118, 243, 0.04);
                }
                50% {
                    box-shadow: 0 12px 28px rgba(25, 118, 243, 0.24),
                                0 0 0 7px rgba(25, 118, 243, 0.075);
                }
            }
        }

        @media (prefers-reduced-motion: reduce) {
            body.vista-temas-movil #bloqueBuscadorCategorias .input-group {
                animation: none !important;
            }
        }
    </style>'''

patron = r'<style id="vocabulario-buscador-protagonista">.*?</style>'
texto_nuevo, cambios = re.subn(patron, nuevo_estilo, texto, count=1, flags=re.S)
if cambios != 1:
    raise SystemExit('ERROR: no se encontró exactamente un bloque vocabulario-buscador-protagonista')

for requerido in (
    'id="vocabularioIntroLista"',
    'id="bloqueBuscadorCategorias"',
    'img/avatar_lupa.webm',
    'video/lspedia_transparente.webm',
):
    if requerido not in texto_nuevo:
        raise SystemExit(f'ERROR: falta {requerido} en index.html')

index.write_text(texto_nuevo, encoding='utf-8', newline='\n')

sw = Path('sw.js')
sw_texto = sw.read_text(encoding='utf-8')
sw_nuevo, cambios_sw = re.subn(
    r'const VERSION_APP = "v33";',
    'const VERSION_APP = "v34";',
    sw_texto,
    count=1,
)
if cambios_sw != 1:
    raise SystemExit('ERROR: no se encontró VERSION_APP v33 en sw.js')
sw.write_text(sw_nuevo, encoding='utf-8', newline='\n')
