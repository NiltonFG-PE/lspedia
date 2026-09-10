#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# 1) Corrige dos referencias históricas que apuntaban a archivos inexistentes.
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

# 2) Como script.js forma parte del cascarón PWA, generamos una nueva versión.
sw_path = ROOT / "sw.js"
sw = sw_path.read_text(encoding="utf-8")
if 'const VERSION_APP = "v61";' in sw:
    sw = sw.replace('const VERSION_APP = "v61";', 'const VERSION_APP = "v62";', 1)
elif 'const VERSION_APP = "v62";' not in sw:
    raise SystemExit("Versión inesperada de sw.js.")
sw_path.write_text(sw, encoding="utf-8")

# 3) El validador ahora cubre también videos visuales locales WEBM/MP4 y
#    la carpeta video/, no solo imágenes. Así una referencia rota similar
#    quedará detectada por CI antes de publicarse.
val_path = ROOT / "scripts" / "validar_imagenes.py"
val = val_path.read_text(encoding="utf-8")

val = val.replace(
    '"""Valida imágenes locales usadas por el contenido activo de LSPedia.',
    '"""Valida recursos visuales locales usados por el contenido activo de LSPedia.'
)
val = val.replace(
    "EXTS = ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif')",
    "EXTS = ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif', '.webm', '.mp4')"
)
val = val.replace(
    "PATRON = re.compile(r'(?:\\./|/)?(img/[A-Za-z0-9_À-ÿÑñ .@()\\-/]+?\\.(?:png|jpe?g|webp|gif|svg|avif))(?:[?#][^\\\"\\'\\s)<,]*)?', re.I)",
    "PATRON = re.compile(r'(?:\\./|/)?((?:img|video)/[A-Za-z0-9_À-ÿÑñ .@()\\-/]+?\\.(?:png|jpe?g|webp|gif|svg|avif|webm|mp4))(?:[?#][^\\\"\\'\\s)<,]*)?', re.I)"
)
val = val.replace(
    "if not s.startswith('img/') or not s.lower().endswith(EXTS):",
    "if not (s.startswith('img/') or s.startswith('video/')) or not s.lower().endswith(EXTS):"
)
val = val.replace(
    "print(f'❌ Imagen de contenido no encontrada: {msg}')",
    "print(f'❌ Recurso visual de contenido no encontrado: {msg}')"
)

checks = [
    "'.webm', '.mp4'",
    "(?:img|video)/",
    "s.startswith('video/')",
    "Recurso visual de contenido no encontrado",
]
for texto in checks:
    if texto not in val:
        raise SystemExit(f"No se pudo ampliar el validador: falta {texto}")

val_path.write_text(val, encoding="utf-8")
print("Referencias rotas corregidas y validador visual ampliado.")
