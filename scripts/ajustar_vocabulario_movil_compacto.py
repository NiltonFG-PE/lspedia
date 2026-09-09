#!/usr/bin/env python3
from pathlib import Path
import re

index = Path('index.html')
texto = index.read_text(encoding='utf-8')

# Sustituye únicamente el bloque de estilos móvil de Vocabulario.
nuevo_estilo = r'''<style id="vocabulario-buscador-protagonista">
        /* Vocabulario móvil — segunda afinación: avatar más discreto,
           título mejor aprovechado, buscador primero y las 3 ideas en
           una tarjeta vertical fácil de leer. */
        @media (max-width: 991.98px) {
            body.vista-temas-movil #filaHeroPrincipal {
                display: grid !important;
                grid-template-columns: minmax(0, 1fr) 118px !important;
                grid-template-areas: "titulo avatar" !important;
                column-gap: 10px !important;
                row-gap: 0 !important;
                align-items: end !important;
                margin-top: 8px !important;
                margin-bottom: 6px !important;
                --bs-gutter-y: 0;
            }

            body.vista-temas-movil #filaHeroPrincipal > .col-lg-6 {
                grid-area: titulo !important;
                min-width: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                align-self: end !important;
            }

            body.vista-temas-movil #bloqueTituloPrincipal {
                display: block !important;
                margin: 0 !important;
                text-align: left !important;
            }

            body.vista-temas-movil #tituloPrincipal {
                font-size: clamp(1.48rem, 6.25vw, 1.72rem) !important;
                line-height: 1.12 !important;
                letter-spacing: -0.025em !important;
                margin: 0 0 5px !important;
                text-align: left !important;
            }

            body.vista-temas-movil #bloqueTituloPrincipal .titulo-raya {
                width: 44px !important;
                height: 4px !important;
                margin: 7px 0 3px !important;
            }

            body.vista-temas-movil #subtituloPrincipal {
                display: none !important;
            }

            body.vista-temas-movil #colAvatarHero {
                grid-area: avatar !important;
                width: 118px !important;
                min-width: 118px !important;
                max-width: 118px !important;
                margin: 0 !important;
                padding: 0 !important;
                align-self: end !important;
                justify-self: end !important;
                display: flex !important;
                align-items: flex-end !important;
                justify-content: center !important;
                overflow: visible !important;
            }

            /* Conserva avatar_lupa.webm y su autoplay/loop; solo lo hace
               más pequeño para que acompañe al título sin dominarlo. */
            body.vista-temas-movil #colAvatarHero .avatar-hero-img {
                height: 124px !important;
                width: auto !important;
                max-width: 118px !important;
                object-fit: contain !important;
                object-position: center bottom !important;
                filter: drop-shadow(0 8px 14px rgba(15, 23, 42, 0.10));
            }

            /* BUSCADOR: sube inmediatamente debajo del título/avatar y
               sigue siendo el elemento visual protagonista. */
            body.vista-temas-movil #bloqueBuscadorCategorias {
                margin-top: 2px !important;
                margin-bottom: 10px !important;
                padding: 0 2px !important;
            }

            body.vista-temas-movil #bloqueBuscadorCategorias > .col-lg-8 {
                width: 100% !important;
                max-width: 100% !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
            }

            body.vista-temas-movil #bloqueBuscadorCategorias .input-group {
                min-height: 62px !important;
                border: 3px solid #1976f3 !important;
                border-radius: 999px !important;
                background: #ffffff !important;
                box-shadow: 0 9px 22px rgba(25, 118, 243, 0.17),
                            0 0 0 4px rgba(25, 118, 243, 0.045) !important;
                overflow: hidden !important;
                position: relative;
                flex-wrap: nowrap !important;
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
                background: #ffffff;
            }

            body.vista-temas-movil #buscarCategorias {
                min-width: 0 !important;
                height: 56px !important;
                padding: 0 8px 0 0 !important;
                font-family: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                font-size: clamp(0.96rem, 4.05vw, 1.12rem) !important;
                font-weight: 500 !important;
                color: #46566c !important;
            }

            body.vista-temas-movil #buscarCategorias::placeholder {
                color: #6b7280 !important;
                opacity: 1 !important;
            }

            body.vista-temas-movil #btnBuscarCategorias {
                min-width: 78px !important;
                padding: 0 18px !important;
                border: 0 !important;
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
                box-shadow: 0 12px 28px rgba(25, 118, 243, 0.23),
                            0 0 0 6px rgba(25, 118, 243, 0.075) !important;
            }

            body.vista-temas-movil #sugerenciasCategorias {
                margin-top: 7px !important;
                border-radius: 16px !important;
            }

            /* Las 3 ideas pasan a UNA tarjeta vertical con 3 filas: evita
               columnas angostas y texto amontonado. El pequeño script de
               abajo coloca esta tarjeta justo después del buscador en móvil. */
            body.vista-temas-movil #vocabularioIntroLista {
                display: flex;
                flex-direction: column;
                gap: 0 !important;
                width: 100% !important;
                margin: 0 0 12px !important;
                padding: 6px 13px !important;
                border-radius: 18px !important;
                border: 1px solid #d8e9fb !important;
                background: linear-gradient(145deg, #fbfdff 0%, #f1f7fd 100%) !important;
                box-shadow: 0 6px 17px rgba(30, 91, 160, 0.07) !important;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-item {
                display: flex !important;
                align-items: center !important;
                gap: 11px !important;
                padding: 9px 0 !important;
                margin: 0 !important;
                border-bottom: 1px solid rgba(13, 110, 253, 0.085);
                text-align: left !important;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-item:last-child {
                border-bottom: 0 !important;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-icono {
                width: 40px !important;
                height: 40px !important;
                min-width: 40px !important;
                flex: 0 0 40px !important;
                font-size: 14px !important;
                box-shadow: 0 5px 12px rgba(13, 110, 253, 0.14) !important;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-icono::after {
                display: none !important;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-texto {
                margin: 0 !important;
                font-size: clamp(0.84rem, 3.55vw, 0.96rem) !important;
                line-height: 1.38 !important;
            }

            body.vista-temas-movil #panelCategorias {
                margin-top: 0 !important;
                padding-top: 0 !important;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            body.vista-temas-movil #bloqueBuscadorCategorias .input-group {
                transition: none !important;
            }
        }
    </style>'''

texto, cambios = re.subn(
    r'<style id="vocabulario-buscador-protagonista">.*?</style>',
    nuevo_estilo,
    texto,
    count=1,
    flags=re.S,
)
if cambios != 1:
    raise SystemExit('ERROR: no se encontró el estilo actual de Vocabulario')

# Quita una versión anterior de este helper si existiera.
texto = re.sub(
    r'\s*<script id="vocabulario-layout-movil">.*?</script>\s*',
    '\n',
    texto,
    flags=re.S,
)

helper = r'''
    <script id="vocabulario-layout-movil">
        /* En móvil, el orden visual aprobado es:
           título + avatar -> buscador -> tarjeta informativa -> categorías.
           En escritorio la lista vuelve a su contenedor original. */
        (function () {
            const mediaMovil = window.matchMedia('(max-width: 991.98px)');

            function reubicarInfoVocabulario() {
                const info = document.getElementById('vocabularioIntroLista');
                const titulo = document.getElementById('bloqueTituloPrincipal');
                const buscador = document.getElementById('bloqueBuscadorCategorias');
                if (!info || !titulo || !buscador) return;

                if (mediaMovil.matches) {
                    if (info.previousElementSibling !== buscador) {
                        buscador.insertAdjacentElement('afterend', info);
                    }
                } else if (info.parentElement !== titulo) {
                    titulo.appendChild(info);
                }
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', reubicarInfoVocabulario, { once: true });
            } else {
                reubicarInfoVocabulario();
            }

            if (typeof mediaMovil.addEventListener === 'function') {
                mediaMovil.addEventListener('change', reubicarInfoVocabulario);
            } else if (typeof mediaMovil.addListener === 'function') {
                mediaMovil.addListener(reubicarInfoVocabulario);
            }
        })();
    </script>
'''

if '</head>' not in texto:
    raise SystemExit('ERROR: no se encontró </head>')
texto = texto.replace('</head>', helper + '\n</head>', 1)

# Validaciones del contenido crítico antes de guardar.
for requerido in (
    'video/lspedia_transparente.webm',
    'img/avatar_lupa.webm',
    'id="bloqueBuscadorCategorias"',
    'id="vocabularioIntroLista"',
):
    if requerido not in texto:
        raise SystemExit(f'ERROR: falta contenido crítico: {requerido}')

index.write_text(texto, encoding='utf-8', newline='\n')

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
