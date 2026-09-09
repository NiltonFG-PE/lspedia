from pathlib import Path
import re

repo = Path(__file__).resolve().parents[1]
index_path = repo / "index.html"
sw_path = repo / "sw.js"

index = index_path.read_text(encoding="utf-8")
marker = 'id="pulido-visual-global-20260909"'
if marker in index:
    raise SystemExit("El pulido visual global ya existe en index.html")

# Si quedara alguna copia histórica de la frase del footer, se elimina.
index = re.sub(
    r'\s*<p\s+class="footer-tagline"[^>]*>.*?</p>\s*',
    '\n',
    index,
    flags=re.IGNORECASE | re.DOTALL,
)

bloque = r'''
    <style id="pulido-visual-global-20260909">
        /* ============================================================
           PULIDO VISUAL GLOBAL — móvil/tablet
           - Footer más compacto.
           - Barra inferior más ligera y con transición activa.
           - Radios/sombras coherentes entre pantallas.
           - Vocabulario más compacto en el primer pantallazo.
           - Menú Jugar con tarjetas pastel diferenciadas.
           ============================================================ */

        :root {
            --lsp-radio-card: 20px;
            --lsp-sombra-card: 0 8px 22px rgba(15, 23, 42, 0.075);
            --lsp-borde-card: rgba(148, 163, 184, 0.20);
        }

        @media (max-width: 1199.98px) {
            /* --- Sistema visual común de tarjetas --- */
            .quiz-card,
            .stat2-card,
            #herramientasMenuMovil .herr-movil-btn,
            body.vista-temas-movil #vocabularioIntroLista,
            body.vista-temas-movil #panelCategorias .categoria-card {
                border-radius: var(--lsp-radio-card) !important;
            }

            .quiz-card,
            body.vista-temas-movil #vocabularioIntroLista {
                box-shadow: var(--lsp-sombra-card) !important;
            }

            /* --- Barra inferior tipo app: más baja y menos pesada --- */
            .mobile-bottom-nav {
                gap: 4px !important;
                padding: 5px 6px calc(5px + env(safe-area-inset-bottom, 0px)) !important;
                border-radius: 20px 20px 0 0 !important;
                box-shadow: 0 -6px 18px rgba(15, 23, 42, 0.11) !important;
            }

            .mbn-item {
                gap: 3px !important;
                padding: 4px 2px !important;
            }

            .mbn-icon-wrap {
                width: 38px !important;
                height: 38px !important;
                border-radius: 12px !important;
            }

            .mbn-item.active .mbn-icon-wrap {
                width: 46px !important;
                height: 46px !important;
                transform: translateY(-17px) !important;
                box-shadow: 0 8px 16px rgba(146, 103, 11, 0.27) !important;
                animation: mbnActivoEntrada 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .mbn-icon {
                width: 21px !important;
                height: 21px !important;
            }

            .mbn-label {
                font-size: 10.5px !important;
                line-height: 1.15 !important;
            }

            body {
                padding-bottom: 66px !important;
            }

            /* --- Vocabulario: menos espacio desaprovechado arriba --- */
            body.vista-temas-movil #bloqueBuscadorCategorias {
                margin-top: -30px !important;
                margin-bottom: 8px !important;
            }

            body.vista-temas-movil #vocabularioIntroLista {
                margin-top: 8px !important;
                margin-bottom: 12px !important;
                padding-top: 8px !important;
                padding-bottom: 8px !important;
            }

            body.vista-temas-movil #vocabularioIntroLista .vocab-intro-item {
                padding-top: 9px !important;
                padding-bottom: 9px !important;
            }

            body.vista-temas-movil #panelCategorias {
                margin-bottom: 18px !important;
            }

            /* --- Herramientas: tarjetas más juntas y coherentes --- */
            #herramientasMenuMovil {
                margin-top: 6px !important;
                margin-bottom: 18px !important;
            }

            #herramientasMenuMovilRow {
                --bs-gutter-y: 0.75rem;
            }

            #herramientasMenuMovil .herr-movil-btn {
                box-shadow: var(--lsp-sombra-card) !important;
            }

            /* --- Jugar: una misma familia visual para todos los juegos --- */
            #seccionQuiz {
                margin-bottom: 24px !important;
            }

            #seccionQuiz > .d-flex:first-child {
                margin-bottom: 12px !important;
            }

            #seccionQuiz > .d-flex:first-child h4 {
                font-size: 1.15rem !important;
                letter-spacing: -0.015em;
            }

            #quizMenuJuegos .juegos-menu-subtitulo {
                margin-bottom: 12px !important;
            }

            #quizMenuJuegos .row.g-3 {
                --bs-gutter-x: 0.75rem;
                --bs-gutter-y: 0.75rem;
            }

            #quizMenuJuegos .menu-juego-btn {
                min-height: 164px;
                padding: 17px 10px !important;
                border-radius: var(--lsp-radio-card) !important;
                border-width: 1.5px !important;
                box-shadow: 0 6px 16px rgba(15, 23, 42, 0.065);
                transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease !important;
            }

            #quizMenuJuegos .menu-juego-btn:active {
                transform: scale(0.97) !important;
            }

            #btnMenuJuegoCompletar {
                background: #eef6ff !important;
                border-color: #bfdbfe !important;
            }

            #btnMenuJuegoUnir {
                background: #edf9f3 !important;
                border-color: #bdebd2 !important;
            }

            #btnMenuJuegoQuiz {
                background: #f4efff !important;
                border-color: #d8c7fb !important;
            }

            #btnMenuJuegoMatematicas {
                background: #fff8df !important;
                border-color: #f3dd99 !important;
            }

            #btnMenuJuegoOraciones {
                background: #fff1e8 !important;
                border-color: #f5cdb6 !important;
            }

            #quizMenuJuegos .juego-preview {
                min-height: 56px;
                margin-bottom: 5px;
            }

            #quizMenuJuegos .juego-titulo {
                font-size: 0.94rem;
                line-height: 1.18;
            }

            #quizMenuJuegos .juego-desc {
                font-size: 0.74rem;
                line-height: 1.25;
                color: #64748b;
            }

            /* --- Footer: menos alto y tarjeta legal más pequeña --- */
            .footer-lspedia.mt-5 {
                margin-top: 1.35rem !important;
            }

            .footer-lspedia .footer-top {
                --bs-gutter-y: 0.65rem;
            }

            .footer-lspedia .footer-logo {
                width: 106px !important;
                max-width: 31vw !important;
            }

            .footer-lspedia .footer-redes {
                gap: 10px !important;
            }

            .footer-lspedia .footer-red-icono {
                width: 39px !important;
                height: 39px !important;
                flex-basis: 39px !important;
            }

            .footer-lspedia .footer-red-icono svg {
                width: 19px !important;
                height: 19px !important;
            }

            .footer-lspedia .footer-desarrollado {
                max-width: 330px;
                margin-inline: auto;
                font-size: 0.82rem;
                line-height: 1.35;
            }

            .footer-lspedia .footer-corazon {
                transform: scale(0.84);
            }

            .footer-lspedia .footer-bottom {
                width: min(100%, 520px);
                margin: 12px auto 2px !important;
                padding: 10px 12px 9px !important;
                border-radius: 18px !important;
                box-shadow: 0 7px 18px rgba(71, 85, 105, 0.09) !important;
                animation-duration: 6.5s !important;
            }

            .footer-lspedia .footer-escudo {
                width: 34px !important;
                height: 34px !important;
                margin-bottom: 5px !important;
                box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.045) !important;
            }

            .footer-lspedia .footer-escudo svg {
                width: 17px !important;
                height: 17px !important;
            }

            .footer-derechos-principal {
                max-width: 440px !important;
                margin-bottom: 6px !important;
                font-size: 0.79rem !important;
                line-height: 1.32 !important;
            }

            .footer-link-licencia.footer-link-boton {
                min-height: 32px !important;
                padding: 5px 12px !important;
                font-size: 0.79rem !important;
            }

            /* Reduce espacios finales innecesarios de bloques principales. */
            .stats-panel-destacado.mb-5 {
                margin-bottom: 1.65rem !important;
            }
        }

        @keyframes mbnActivoEntrada {
            0% { transform: translateY(-8px) scale(0.82); }
            68% { transform: translateY(-19px) scale(1.05); }
            100% { transform: translateY(-17px) scale(1); }
        }

        @media (max-width: 576px) {
            #quizMenuJuegos .menu-juego-btn {
                min-height: 154px;
                padding: 14px 8px !important;
            }

            .footer-lspedia .footer-bottom {
                width: calc(100% - 8px);
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .mbn-item.active .mbn-icon-wrap {
                animation: none !important;
            }
        }
    </style>
'''

if "</head>" not in index:
    raise SystemExit("No se encontró </head> en index.html")
index = index.replace("</head>", bloque + "\n</head>", 1)
index_path.write_text(index, encoding="utf-8")

# Incrementa automáticamente la versión PWA existente. Así este ajuste no
# depende de que la rama esté todavía en una versión concreta: si develop ya
# avanzó a v52, por ejemplo, este cambio pasa a v53 sin pisar trabajo nuevo.
sw = sw_path.read_text(encoding="utf-8")
match = re.search(r'const VERSION_APP = "v(\d+)";', sw)
if not match:
    raise SystemExit("No se encontró VERSION_APP en sw.js")
version_actual = int(match.group(1))
version_nueva = version_actual + 1
sw = sw[:match.start()] + f'const VERSION_APP = "v{version_nueva}";' + sw[match.end():]
sw_path.write_text(sw, encoding="utf-8")
print(f"VERSION_APP actualizada: v{version_actual} -> v{version_nueva}")
