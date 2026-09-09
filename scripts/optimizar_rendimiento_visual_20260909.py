from pathlib import Path
import re

repo = Path(__file__).resolve().parents[1]
index_path = repo / "index.html"
sw_path = repo / "sw.js"

index = index_path.read_text(encoding="utf-8")
marker = 'id="rendimiento-movil-20260909"'
if marker in index:
    raise SystemExit("La optimización de rendimiento ya existe en index.html")

bloque = r'''
    <style id="rendimiento-movil-20260909">
        /* ============================================================
           RENDIMIENTO VISUAL MÓVIL
           Mantiene el diseño actual, pero evita repintados continuos:
           - sin blur dinámico en la barra superior;
           - animaciones decorativas infinitas desactivadas en móvil;
           - buscador de Vocabulario llama la atención solo al entrar;
           - transiciones de resultados un poco más cortas.
           ============================================================ */
        @media (max-width: 1199.98px) {
            nav.navbar {
                background-color: rgba(15, 23, 42, 0.96) !important;
                -webkit-backdrop-filter: none !important;
                backdrop-filter: none !important;
            }

            /* Evita trabajo constante de GPU/CPU en elementos decorativos. */
            .footer-lspedia .footer-red-icono,
            .footer-lspedia .footer-red-icono::before,
            .footer-lspedia .footer-bottom,
            .footer-lspedia .footer-bottom::after,
            .footer-lspedia .footer-escudo,
            .stat2-onda,
            .stat2-confetti i,
            .stat2-grid-icono i,
            .stat2-clapper,
            .btn-compartir,
            .btn-compartir .btn-compartir-icono,
            .nosotros-apoyo-icono {
                animation: none !important;
            }

            /* El buscador conserva su llamada visual, pero solo dos veces. */
            body.vista-temas-movil #bloqueBuscadorCategorias .input-group {
                animation: vocabBuscadorAtencion 1.9s ease-in-out 2 !important;
                will-change: auto !important;
            }

            body.vista-temas-movil #btnBuscarCategorias span {
                animation: vocabLupaAtencion 1.9s ease-in-out 2 !important;
            }

            /* Aparición más rápida de tarjetas de resultados. */
            .categoria-resultado-item {
                animation-duration: 0.25s !important;
                transition-duration: 0.14s !important;
            }

            /* Sombras más ligeras en elementos fijos, menos costosas al scroll. */
            .mobile-bottom-nav {
                box-shadow: 0 -4px 12px rgba(15, 23, 42, 0.09) !important;
            }

            .footer-lspedia .footer-bottom {
                box-shadow: 0 5px 14px rgba(71, 85, 105, 0.08) !important;
            }
        }

        /* En dispositivos táctiles no necesitamos efectos hover costosos. */
        @media (hover: none), (pointer: coarse) {
            .categoria-card:hover,
            .categoria-resultado-item:hover,
            .stat2-red-icono:hover,
            .nosotros-apoyo-card:hover {
                filter: none !important;
            }
        }
    </style>
'''

if "</head>" not in index:
    raise SystemExit("No se encontró </head> en index.html")
index = index.replace("</head>", bloque + "\n</head>", 1)
index_path.write_text(index, encoding="utf-8")

sw = sw_path.read_text(encoding="utf-8")
m = re.search(r'const VERSION_APP = "v(\d+)";', sw)
if not m:
    raise SystemExit("No se encontró VERSION_APP en sw.js")
actual = int(m.group(1))
nueva = actual + 1
sw = sw[:m.start()] + f'const VERSION_APP = "v{nueva}";' + sw[m.end():]
sw_path.write_text(sw, encoding="utf-8")
print(f"PWA: v{actual} -> v{nueva}")
