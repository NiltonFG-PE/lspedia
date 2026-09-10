#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Corrige dos referencias históricas que apuntaban a archivos inexistentes.
# Reutilizamos recursos ya existentes en el proyecto para no añadir peso ni
# inventar un archivo nuevo solo para este estado vacío.
js_path = ROOT / "js" / "script.js"
js = js_path.read_text(encoding="utf-8")

cambios = {
    'poster="img/avatar_duda_sin_fondo.png"': 'poster="img/avatar_sin_fondo.png"',
    '<source src="img/avatar_duda.webm" type="video/webm">': '<source src="img/avatar_lupa.webm" type="video/webm">',
}
for viejo, nuevo in cambios.items():
    if viejo in js:
        js = js.replace(viejo, nuevo)
    elif nuevo not in js:
        raise SystemExit(f"No se encontró la referencia esperada: {viejo}")

if "img/avatar_duda_sin_fondo.png" in js or "img/avatar_duda.webm" in js:
    raise SystemExit("Aún quedan referencias al recurso inexistente del avatar de duda.")

js_path.write_text(js, encoding="utf-8")

# script.js forma parte del cascarón PWA, por eso generamos nueva versión.
sw_path = ROOT / "sw.js"
sw = sw_path.read_text(encoding="utf-8")
if 'const VERSION_APP = "v61";' in sw:
    sw = sw.replace('const VERSION_APP = "v61";', 'const VERSION_APP = "v62";', 1)
elif 'const VERSION_APP = "v62";' not in sw:
    raise SystemExit("Versión inesperada de sw.js.")
sw_path.write_text(sw, encoding="utf-8")

print("Referencias visuales inexistentes corregidas.")
