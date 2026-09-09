from pathlib import Path

repo = Path(__file__).resolve().parents[1]
index_path = repo / "index.html"
sw_path = repo / "sw.js"

index = index_path.read_text(encoding="utf-8")
marker = 'id="vocabulario-ajuste-buscador-20260909"'
if marker in index:
    raise SystemExit("El ajuste visual ya existe en index.html")

bloque = r'''
    <style id="vocabulario-ajuste-buscador-20260909">
        /* Ajuste móvil de Vocabulario: menos aire entre el hero y el buscador,
           y una llamada visual suave para que el campo de búsqueda sea la
           primera acción evidente al entrar a la sección. */
        @media (max-width: 991.98px) {
            body.vista-temas-movil #bloqueBuscadorCategorias {
                margin-top: -24px !important;
            }

            body.vista-temas-movil #bloqueBuscadorCategorias .input-group {
                transform-origin: center center;
                animation: vocabBuscadorAtencion 3.2s ease-in-out infinite !important;
                will-change: transform, box-shadow;
            }

            body.vista-temas-movil #btnBuscarCategorias span {
                animation: vocabLupaAtencion 3.2s ease-in-out infinite !important;
                transform-origin: center center;
            }
        }

        @keyframes vocabBuscadorAtencion {
            0%, 62%, 100% {
                transform: scale(1);
                box-shadow: 0 9px 22px rgba(25, 118, 243, 0.17),
                            0 0 0 0 rgba(25, 118, 243, 0.00);
            }
            12% {
                transform: scale(1.012);
                box-shadow: 0 12px 28px rgba(25, 118, 243, 0.28),
                            0 0 0 7px rgba(25, 118, 243, 0.08);
            }
            24% {
                transform: scale(1);
                box-shadow: 0 9px 22px rgba(25, 118, 243, 0.17),
                            0 0 0 2px rgba(25, 118, 243, 0.025);
            }
            36% {
                transform: scale(1.008);
                box-shadow: 0 11px 26px rgba(25, 118, 243, 0.24),
                            0 0 0 5px rgba(25, 118, 243, 0.06);
            }
            48% {
                transform: scale(1);
                box-shadow: 0 9px 22px rgba(25, 118, 243, 0.17),
                            0 0 0 0 rgba(25, 118, 243, 0.00);
            }
        }

        @keyframes vocabLupaAtencion {
            0%, 8%, 28%, 48%, 100% { transform: scale(1) rotate(0deg); }
            14% { transform: scale(1.16) rotate(-7deg); }
            20% { transform: scale(1.08) rotate(6deg); }
            36% { transform: scale(1.12) rotate(-4deg); }
            42% { transform: scale(1.05) rotate(3deg); }
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
old_version = 'const VERSION_APP = "v38";'
new_version = 'const VERSION_APP = "v39";'
if sw.count(old_version) != 1:
    raise SystemExit("No se encontró exactamente una VERSION_APP v38")
sw = sw.replace(old_version, new_version, 1)
sw_path.write_text(sw, encoding="utf-8")
