from pathlib import Path

repo = Path(__file__).resolve().parents[1]
index_path = repo / "index.html"
sw_path = repo / "sw.js"

index = index_path.read_text(encoding="utf-8")
marker = 'id="vocabulario-ajuste-buscador-escritorio-20260909"'
if marker in index:
    raise SystemExit("El ajuste de escritorio ya existe en index.html")

bloque = r'''
    <style id="vocabulario-ajuste-buscador-escritorio-20260909">
        /* Vocabulario — ajuste específico para escritorio.
           Acerca el buscador al bloque superior y activa una llamada visual
           clara también fuera del modo móvil. */
        @media (min-width: 992px) {
            body.vista-temas-movil #bloqueBuscadorCategorias {
                margin-top: -72px !important;
                margin-bottom: 18px !important;
            }
        }

        body.vista-temas-movil #bloqueBuscadorCategorias .input-group {
            transform-origin: center center;
            animation: vocabBuscadorAtencionGlobal 3s ease-in-out infinite !important;
            will-change: transform, box-shadow;
        }

        body.vista-temas-movil #btnBuscarCategorias span {
            animation: vocabLupaAtencionGlobal 3s ease-in-out infinite !important;
            transform-origin: center center;
        }

        @keyframes vocabBuscadorAtencionGlobal {
            0%, 58%, 100% {
                transform: scale(1);
                box-shadow: 0 9px 22px rgba(25, 118, 243, 0.17),
                            0 0 0 0 rgba(25, 118, 243, 0);
            }
            12% {
                transform: scale(1.015);
                box-shadow: 0 13px 30px rgba(25, 118, 243, 0.30),
                            0 0 0 8px rgba(25, 118, 243, 0.09);
            }
            25% {
                transform: scale(1);
                box-shadow: 0 9px 22px rgba(25, 118, 243, 0.17),
                            0 0 0 2px rgba(25, 118, 243, 0.03);
            }
            38% {
                transform: scale(1.010);
                box-shadow: 0 12px 27px rgba(25, 118, 243, 0.26),
                            0 0 0 6px rgba(25, 118, 243, 0.07);
            }
            50% {
                transform: scale(1);
                box-shadow: 0 9px 22px rgba(25, 118, 243, 0.17),
                            0 0 0 0 rgba(25, 118, 243, 0);
            }
        }

        @keyframes vocabLupaAtencionGlobal {
            0%, 8%, 27%, 48%, 100% { transform: scale(1) rotate(0deg); }
            14% { transform: scale(1.18) rotate(-8deg); }
            20% { transform: scale(1.08) rotate(7deg); }
            36% { transform: scale(1.14) rotate(-5deg); }
            42% { transform: scale(1.06) rotate(4deg); }
        }

        body.vista-temas-movil #bloqueBuscadorCategorias .input-group:focus-within,
        body.vista-temas-movil #bloqueBuscadorCategorias .input-group:hover {
            animation-play-state: paused !important;
        }

        @media (prefers-reduced-motion: reduce) {
            body.vista-temas-movil #bloqueBuscadorCategorias .input-group,
            body.vista-temas-movil #btnBuscarCategorias span {
                animation: none !important;
            }
        }
    </style>
'''

if "</head>" not in index:
    raise SystemExit("No se encontró </head> en index.html")
index = index.replace("</head>", bloque + "\n</head>", 1)
index_path.write_text(index, encoding="utf-8")

sw = sw_path.read_text(encoding="utf-8")
old_version = 'const VERSION_APP = "v39";'
new_version = 'const VERSION_APP = "v40";'
if sw.count(old_version) != 1:
    raise SystemExit("No se encontró exactamente una VERSION_APP v39")
sw = sw.replace(old_version, new_version, 1)
sw_path.write_text(sw, encoding="utf-8")
