#!/usr/bin/env python3
from pathlib import Path
import re

index = Path('index.html')
texto = index.read_text(encoding='utf-8')

nuevo_estilo = r'''<style id="vocabulario-buscador-protagonista">
        /* Vocabulario móvil — composición aprobada: título + avatar animado
           integrados arriba, bloque informativo compacto a todo el ancho y
           buscador como protagonista. No reemplaza los videos existentes. */
        @media (max-width: 991.98px) {
            body.vista-temas-movil #filaHeroPrincipal {
                display: grid !important;
                grid-template-columns: minmax(0, 1.18fr) minmax(138px, 0.82fr) !important;
                grid-template-areas:
                    "titulo avatar"
                    "raya avatar"
                    "info info" !important;
                column-gap: 6px !important;
                row-gap: 0 !important;
                align-items: end !important;
                margin-top: 8px !important;
                margin-bottom: 8px !important;
                --bs-gutter-y: 0 !important;
            }

            /* Hace que los hijos del bloque de título participen directamente
               en la grilla del hero, permitiendo que la caja informativa ocupe
               todo el ancho debajo de título + avatar. */
            body.vista-temas-movil #bloqueTituloPrincipal {
                display: contents !important;
            }

            body.vista-temas-movil #tituloPrincipal {
                grid-area: titulo;
                align-self: end;
                text-align: left !important;
                font-size: clamp(1.65rem, 7.2vw, 2.05rem) !important;
                line-height: 1.12 !important;
                margin: 0 !important;
                letter-spacing: -0.03em;
            }

            body.vista-temas-movil #bloqueTituloPrincipal .titulo-raya {
                grid-area: raya;
                justify-self: start;
                width: 54px !important;
                height: 4px !important;
                margin: 10px 0 12px !important;
            }

            body.vista-temas-movil #subtituloPrincipal {
                display: none !important;
            }

            /* Avatar: conserva avatar_lupa.webm, pero gana presencia y queda
               visualmente unido al título mediante un halo amarillo suave. */
            body.vista-temas-movil #colAvatarHero {
                grid-area: avatar !important;
                display: flex !important;
                position: relative;
                align-self: end !important;
                justify-content: center !important;
                align-items: end !important;
                min-width: 0;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible;
                isolation: isolate;
            }

            body.vista-temas-movil #colAvatarHero::before {
                content: "";
                position: absolute;
                z-index: 0;
                width: 132px;
                height: 132px;
                right: 2px;
                bottom: 8px;
                border-radius: 46% 54% 48% 52%;
                background: radial-gradient(circle at 45% 42%, rgba(255, 211, 64, 0.34), rgba(255, 193, 7, 0.12) 62%, rgba(255, 193, 7, 0) 73%);
                filter: blur(0.3px);
            }

            body.vista-temas-movil #colAvatarHero .avatar-hero-img {
                position: relative;
                z-index: 1;
                height: clamp(188px, 52vw, 225px) !important;
                width: auto !important;
                max-width: 155% !important;
                object-fit: contain;
                object-position: center bottom;
                transform: scale(1.1);
                transform-origin: center bottom;
                filter: drop-shadow(0 9px 14px rgba(15, 23, 42, 0.10));
            }

            /* Las tres ideas se convierten en una sola franja visual a todo
               el ancho, como en el mockup, eliminando el hueco que antes
               quedaba junto al avatar. */
            body.vista-temas-movil #vocabularioIntroLista {
                grid-area: info;
                display: grid !important;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 0 !important;
                width: 100%;
                margin: 2px 0 8px !important;
                padding: 10px 8px !important;
                border-radius: 20px;
                border: 1px solid #d4e8ff;
                background: linear-gradient(145deg, #fbfdff 0%, #eef7ff 100%);
                box-shadow: 0 7px 20px rgba(24, 95, 180, 0.08);
                overflow: hidden;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-item {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: flex-start !important;
                gap: 7px !important;
                padding: 4px 8px !important;
                text-align: center !important;
                border: 0 !important;
                min-width: 0;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-item:not(:last-child) {
                border-right: 1px solid rgba(13, 110, 253, 0.10) !important;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-icono {
                width: 40px !important;
                height: 40px !important;
                min-width: 40px !important;
                font-size: 15px !important;
                box-shadow: 0 5px 12px rgba(13, 110, 253, 0.16);
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-icono::after {
                display: none !important;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-texto {
                margin: 0 !important;
                font-size: clamp(0.72rem, 2.85vw, 0.82rem) !important;
                line-height: 1.34 !important;
                color: #4b5563;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-texto strong {
                color: #1475ea;
            }

            /* Buscador protagonista: ancho completo, gran contraste y una
               animación de entrada/pulso única para atraer la atención sin
               movimiento permanente. */
            body.vista-temas-movil #bloqueBuscadorCategorias {
                margin-top: 0 !important;
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
                min-height: 68px;
                border: 3px solid #1976f3 !important;
                border-radius: 999px !important;
                background: #ffffff !important;
                box-shadow: 0 11px 27px rgba(25, 118, 243, 0.20),
                            0 0 0 5px rgba(25, 118, 243, 0.045) !important;
                overflow: hidden !important;
                flex-wrap: nowrap;
                animation: vocabBuscadorEntrada 0.46s ease-out both,
                           vocabBuscadorPulso 1.25s ease-in-out 0.7s 1;
                transition: box-shadow 0.22s ease, transform 0.22s ease;
            }

            body.vista-temas-movil #bloqueBuscadorCategorias .input-group::before {
                content: "🔎";
                width: 46px;
                flex: 0 0 46px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.15rem;
                background: #fff;
                opacity: 0.72;
            }

            body.vista-temas-movil #buscarCategorias {
                min-width: 0;
                height: 62px !important;
                padding: 0 8px 0 0 !important;
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                font-size: clamp(0.96rem, 4vw, 1.1rem) !important;
                font-weight: 500;
                color: #46566c !important;
                text-overflow: ellipsis;
            }

            body.vista-temas-movil #buscarCategorias::placeholder {
                color: #747b88;
                opacity: 1;
            }

            body.vista-temas-movil #btnBuscarCategorias {
                min-width: 76px;
                padding: 0 18px !important;
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
                box-shadow: 0 14px 31px rgba(25, 118, 243, 0.25),
                            0 0 0 6px rgba(25, 118, 243, 0.08) !important;
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
                from { opacity: 0; transform: translateY(10px) scale(0.985); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
            }

            @keyframes vocabBuscadorPulso {
                0%, 100% {
                    box-shadow: 0 11px 27px rgba(25, 118, 243, 0.20),
                                0 0 0 5px rgba(25, 118, 243, 0.045);
                }
                50% {
                    box-shadow: 0 14px 32px rgba(25, 118, 243, 0.28),
                                0 0 0 8px rgba(25, 118, 243, 0.09);
                }
            }
        }

        @media (max-width: 390px) {
            body.vista-temas-movil #filaHeroPrincipal {
                grid-template-columns: minmax(0, 1.12fr) minmax(126px, 0.88fr) !important;
            }
            body.vista-temas-movil #colAvatarHero .avatar-hero-img {
                height: 184px !important;
            }
            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-texto {
                font-size: 0.69rem !important;
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
    'video/lspedia_transparente.webm',
    'img/avatar_lupa.webm',
    'id="bloqueBuscadorCategorias"',
    'id="vocabularioIntroLista"',
):
    if requerido not in texto_nuevo:
        raise SystemExit(f'ERROR: falta {requerido}')

index.write_text(texto_nuevo, encoding='utf-8', newline='\n')

sw = Path('sw.js')
sw_texto = sw.read_text(encoding='utf-8')
sw_nuevo, cambios_sw = re.subn(
    r'const VERSION_APP = "v32";',
    'const VERSION_APP = "v33";',
    sw_texto,
    count=1,
)
if cambios_sw != 1:
    raise SystemExit('ERROR: no se encontró VERSION_APP v32 en sw.js')
sw.write_text(sw_nuevo, encoding='utf-8', newline='\n')
