#!/usr/bin/env python3
from pathlib import Path
import re

index = Path('index.html')
texto = index.read_text(encoding='utf-8')

# Evita duplicar el bloque si el script se ejecuta más de una vez.
texto = re.sub(r'\n\s*<style id="palabra-dia-modernizada">.*?</style>\s*\n', '\n', texto, flags=re.S)

estilos = r'''
    <style id="palabra-dia-modernizada">
        /* Palabra del día — diseño aprobado. Solo moderniza la tarjeta;
           no toca ni reemplaza los videos animados del logo superior ni
           del personaje con lupa. */
        #senalDelDia .dia-rect-card {
            position: relative;
            background: linear-gradient(135deg, #071a3a 0%, #0b2d61 58%, #123f78 100%);
            border: 1px solid rgba(78, 163, 255, 0.30);
            border-radius: 20px;
            box-shadow: 0 12px 30px rgba(7, 26, 58, 0.20);
            overflow: hidden;
            animation: palabraDiaEntrada .42s cubic-bezier(.2,.75,.25,1) both;
        }

        #senalDelDia .dia-rect-card::after {
            content: "";
            position: absolute;
            width: 150px;
            height: 150px;
            right: -76px;
            bottom: -92px;
            border-radius: 50%;
            border: 18px solid rgba(255,255,255,.055);
            pointer-events: none;
        }

        #senalDelDia .dia-rect-media {
            background: #10213d;
            border: 1px solid rgba(255,255,255,.16);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.04);
        }

        #senalDelDia .dia-rect-media-img {
            transition: transform .28s ease, opacity .28s ease;
        }

        #senalDelDia .dia-rect-media:hover .dia-rect-media-img,
        #senalDelDia .dia-rect-media:focus .dia-rect-media-img {
            transform: scale(1.025);
        }

        #senalDelDia .dia-rect-media-play {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: rgba(4, 19, 43, .72);
            border: 2px solid rgba(255,255,255,.92);
            box-shadow: 0 5px 15px rgba(0,0,0,.18);
        }

        #senalDelDia .dia-rect-body {
            position: relative;
            z-index: 1;
        }

        #senalDelDia .dia-rect-nav {
            padding-right: 34px;
        }

        #senalDelDia .dia-rect-label {
            color: #ffd12a;
            text-transform: uppercase;
            letter-spacing: .35px;
            font-weight: 800;
            animation: palabraDiaDestello .9s ease .45s 1 both;
        }

        #senalDelDia .dia-rect-nav-btn {
            border: 1px solid rgba(255,255,255,.18);
            background: rgba(255,255,255,.10);
            color: #fff;
            transition: transform .18s ease, background-color .18s ease;
        }

        #senalDelDia .dia-rect-nav-btn:active {
            transform: scale(.92);
            background: rgba(255,255,255,.18);
        }

        #senalDelDia .dia-rect-badge {
            align-self: flex-start;
            color: #13213f !important;
            background: linear-gradient(180deg, #ffe358 0%, #ffc107 100%) !important;
            border: 0;
            border-radius: 999px;
            font-weight: 800;
            box-shadow: 0 4px 10px rgba(255, 193, 7, .18);
        }

        #senalDelDia .dia-rect-titulo {
            color: #fff;
            font-family: 'Poppins', sans-serif;
            font-weight: 800;
            letter-spacing: -.25px;
            text-shadow: 0 3px 12px rgba(0,0,0,.15);
        }

        /* En el mockup la definición corta se retira para que la palabra sea
           la protagonista y la tarjeta sea más fácil de leer en móvil. */
        #senalDelDia .dia-rect-desc {
            display: none !important;
        }

        #senalDelDia .dia-rect-btn {
            align-self: flex-start;
            min-width: 92px;
            border: 0;
            border-radius: 13px;
            padding: 7px 18px;
            color: #10213f;
            background: linear-gradient(180deg, #ffe25b 0%, #ffc107 100%);
            font-family: 'Poppins', sans-serif;
            font-weight: 800;
            box-shadow: 0 7px 16px rgba(255,193,7,.22);
            transition: transform .18s ease, box-shadow .18s ease;
            animation: palabraDiaBotonPulso .46s ease 1.15s 1 both;
        }

        #senalDelDia .dia-rect-btn::after {
            content: "›";
            display: inline-block;
            margin-left: 8px;
            font-size: 1.18em;
            line-height: 1;
            transition: transform .18s ease;
        }

        #senalDelDia .dia-rect-btn:hover,
        #senalDelDia .dia-rect-btn:focus-visible {
            color: #10213f;
            transform: translateY(-1px);
            box-shadow: 0 9px 19px rgba(255,193,7,.28);
            outline: none;
        }

        #senalDelDia .dia-rect-btn:active {
            transform: scale(.97);
        }

        #senalDelDia .dia-rect-btn:hover::after,
        #senalDelDia .dia-rect-btn:focus-visible::after {
            transform: translateX(2px);
        }

        /* El control superior deja de verse como una X. Funciona como
           contraer/expandir y mantiene la tarjeta disponible en pantalla. */
        #btnCerrarDelDia.btn-close {
            width: 31px;
            height: 31px;
            top: 10px !important;
            right: 10px !important;
            padding: 0 !important;
            opacity: 1;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,.14);
            background: rgba(255,255,255,.10) !important;
            box-shadow: none;
            display: grid;
            place-items: center;
            transition: transform .22s ease, background-color .22s ease;
        }

        #btnCerrarDelDia.btn-close::before {
            content: "⌃";
            color: #fff;
            font-family: Arial, sans-serif;
            font-size: 20px;
            font-weight: 700;
            line-height: 1;
            transform: translateY(2px);
        }

        #btnCerrarDelDia.btn-close:hover,
        #btnCerrarDelDia.btn-close:focus-visible {
            background: rgba(255,255,255,.18) !important;
            outline: none;
        }

        #btnCerrarDelDia.btn-close:active {
            transform: scale(.92);
        }

        /* Estado contraído: conserva una franja compacta con el nombre de la
           palabra. Un segundo toque en el chevron vuelve a expandirla. */
        #senalDelDia.dia-colapsada .dia-rect-card {
            min-height: 64px;
        }

        #senalDelDia.dia-colapsada .dia-rect-media,
        #senalDelDia.dia-colapsada .dia-rect-nav-btn,
        #senalDelDia.dia-colapsada .dia-rect-badge,
        #senalDelDia.dia-colapsada .dia-rect-desc,
        #senalDelDia.dia-colapsada .dia-rect-btn {
            display: none !important;
        }

        #senalDelDia.dia-colapsada .dia-rect-body {
            padding: 11px 48px 11px 16px !important;
            justify-content: center;
        }

        #senalDelDia.dia-colapsada .dia-rect-nav {
            margin: 0 0 1px !important;
            padding: 0 !important;
        }

        #senalDelDia.dia-colapsada .dia-rect-label {
            font-size: 9px !important;
        }

        #senalDelDia.dia-colapsada .dia-rect-titulo {
            display: block !important;
            margin: 0 !important;
            font-size: 15px !important;
            line-height: 1.15;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        #senalDelDia.dia-colapsada #btnCerrarDelDia.btn-close::before {
            content: "⌄";
            transform: translateY(-2px);
        }

        @keyframes palabraDiaEntrada {
            from { opacity: 0; transform: translateY(10px) scale(.985); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes palabraDiaDestello {
            0% { opacity: .55; filter: brightness(.9); }
            55% { opacity: 1; filter: brightness(1.35); }
            100% { opacity: 1; filter: brightness(1); }
        }

        @keyframes palabraDiaBotonPulso {
            0%, 100% { transform: scale(1); }
            55% { transform: scale(1.045); }
        }

        /* El layout móvil existente (tarjeta + avatar animado en la misma
           fila) se conserva. Solo damos más presencia a la miniatura. */
        @media (max-width: 991.98px) {
            #senalDelDia .dia-rect-card {
                border-radius: 17px;
                min-height: 126px;
            }
            #senalDelDia .dia-rect-media {
                width: 112px;
                aspect-ratio: 4 / 3;
                margin: 8px 0 8px 8px;
                border-radius: 12px;
            }
            #senalDelDia .dia-rect-body {
                padding: 9px 10px 9px 12px;
                justify-content: center;
            }
            #senalDelDia .dia-rect-nav {
                margin-bottom: 4px;
                gap: 5px;
            }
            #senalDelDia .dia-rect-nav-btn {
                width: 24px;
                height: 24px;
                border-radius: 7px;
                font-size: 10px;
            }
            #senalDelDia .dia-rect-label {
                font-size: 10.5px;
            }
            #senalDelDia .dia-rect-badge {
                font-size: 8.5px;
                padding: 2px 8px;
                margin-bottom: 4px;
            }
            #senalDelDia .dia-rect-titulo {
                font-size: clamp(17px, 4.6vw, 23px);
                line-height: 1.05;
                margin-bottom: 7px;
                padding-right: 28px;
            }
            #senalDelDia .dia-rect-btn {
                font-size: 12px;
                padding: 6px 14px;
                border-radius: 11px;
                min-width: 84px;
            }
        }

        @media (max-width: 430px) {
            #senalDelDia .dia-rect-media {
                width: 102px;
            }
            #senalDelDia .dia-rect-label { font-size: 9.5px; }
            #senalDelDia .dia-rect-titulo { font-size: 17px; }
            #senalDelDia .dia-rect-btn { font-size: 11.5px; }
        }

        @media (prefers-reduced-motion: reduce) {
            #senalDelDia .dia-rect-card,
            #senalDelDia .dia-rect-label,
            #senalDelDia .dia-rect-btn {
                animation: none !important;
            }
        }
    </style>
'''

if '</head>' not in texto:
    raise SystemExit('ERROR: no se encontró </head> en index.html')
texto = texto.replace('</head>', estilos + '\n</head>', 1)

# Texto corto aprobado para el botón.
texto, cambios_boton = re.subn(
    r'(<button\s+class="btn dia-rect-btn"\s+id="btnVerDelDia">)Ver ahora(</button>)',
    r'\1Ver\2',
    texto,
    count=1,
)
if cambios_boton != 1:
    raise SystemExit(f'ERROR: no se pudo cambiar "Ver ahora" por "Ver" ({cambios_boton}).')

# El botón superior ahora representa contraer/expandir, no cerrar.
texto, cambios_aria = re.subn(
    r'(id="btnCerrarDelDia"\s+aria-label=")Cerrar(")',
    r'\1Contraer Palabra del día\2',
    texto,
    count=1,
)
if cambios_aria != 1:
    raise SystemExit(f'ERROR: no se pudo actualizar aria-label del control ({cambios_aria}).')

index.write_text(texto, encoding='utf-8', newline='\n')

script = Path('js/script.js')
js = script.read_text(encoding='utf-8')

patron_cierre = re.compile(r'''    const btnCerrarDelDia = document\.getElementById\("btnCerrarDelDia"\);\n    if\(btnCerrarDelDia\)\{\n        btnCerrarDelDia\.onclick = \(\) => \{\n            document\.getElementById\("senalDelDia"\)\.style\.display = "none";\n            // El avatar se achica y se acomoda al costado del título \(en\n            // vez de quedar solo y grande arriba, empujando el título\n            // debajo\): ver la regla "body\.senal-cerrada" en index\.html\.\n            document\.body\.classList\.add\("senal-cerrada"\);\n        \};\n    \}\n''')

nuevo_cierre = '''    const btnCerrarDelDia = document.getElementById("btnCerrarDelDia");
    if(btnCerrarDelDia){
        const tarjetaDelDia = document.getElementById("senalDelDia");
        const CLAVE_PALABRA_DIA_COLAPSADA = "lspedia_palabra_dia_colapsada";

        const aplicarEstadoPalabraDia = (colapsada) => {
            if(!tarjetaDelDia) return;
            tarjetaDelDia.classList.toggle("dia-colapsada", colapsada);
            btnCerrarDelDia.setAttribute("aria-expanded", colapsada ? "false" : "true");
            btnCerrarDelDia.setAttribute("aria-label", colapsada ? "Expandir Palabra del día" : "Contraer Palabra del día");
            document.body.classList.remove("senal-cerrada");
        };

        let colapsadaInicial = false;
        try { colapsadaInicial = sessionStorage.getItem(CLAVE_PALABRA_DIA_COLAPSADA) === "1"; } catch(_error) {}
        aplicarEstadoPalabraDia(colapsadaInicial);

        btnCerrarDelDia.onclick = () => {
            const colapsada = !tarjetaDelDia.classList.contains("dia-colapsada");
            aplicarEstadoPalabraDia(colapsada);
            try { sessionStorage.setItem(CLAVE_PALABRA_DIA_COLAPSADA, colapsada ? "1" : "0"); } catch(_error) {}
        };
    }
'''

js, cambios_js = patron_cierre.subn(nuevo_cierre, js, count=1)
if cambios_js != 1:
    raise SystemExit(f'ERROR: no se encontró exactamente el comportamiento actual de btnCerrarDelDia ({cambios_js}).')
script.write_text(js, encoding='utf-8', newline='\n')

sw = Path('sw.js')
sw_texto = sw.read_text(encoding='utf-8')
sw_nuevo, cambios_sw = re.subn(
    r'const VERSION_APP = "v30";',
    'const VERSION_APP = "v31";',
    sw_texto,
    count=1,
)
if cambios_sw != 1:
    raise SystemExit('ERROR: no se encontró VERSION_APP v30 en sw.js.')
sw.write_text(sw_nuevo, encoding='utf-8', newline='\n')
