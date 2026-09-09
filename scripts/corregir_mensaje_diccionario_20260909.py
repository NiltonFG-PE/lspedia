from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
js_path = root / "js" / "script.js"
sw_path = root / "sw.js"

js = js_path.read_text(encoding="utf-8")

old1 = "+ '<p class=\"aviso-mision-linea1\">No enseñamos lengua de señas, <strong>eso le pertenece a los sordos</strong>.</p>'"
old2 = "+ '<p class=\"aviso-mision-linea2\">Te ayudamos a aprender palabras del español con <span class=\"subtitulo-resaltado\">videos en Lengua de Señas Peruana</span>.</p>'"

new1 = "+ '<p class=\"aviso-mision-linea1\"><span style=\"color:#42a5f5;font-weight:700;\">Diccionario visual de español</span> con apoyo en Lengua de Señas Peruana.<br>Su función es facilitar la comprensión de palabras y significados,</p>'"
new2 = "+ '<p class=\"aviso-mision-linea2\"><span style=\"color:#a66a00;font-weight:700;\">🪧No es un curso, ni enseñamos LSP.</span></p>'"

if old1 not in js or old2 not in js:
    raise SystemExit("No se encontró exactamente el mensaje antiguo esperado en js/script.js")

js = js.replace(old1, new1, 1).replace(old2, new2, 1)

if "No enseñamos lengua de señas, <strong>eso le pertenece a los sordos</strong>" in js:
    raise SystemExit("El mensaje antiguo todavía quedó en js/script.js")
if "Diccionario visual de español" not in js or "No es un curso, ni enseñamos LSP." not in js:
    raise SystemExit("El mensaje nuevo no quedó completo")

js_path.write_text(js, encoding="utf-8")

sw = sw_path.read_text(encoding="utf-8")
m = re.search(r'const VERSION_APP = "v(\d+)";', sw)
if not m:
    raise SystemExit("No se encontró VERSION_APP en sw.js")
actual = int(m.group(1))
nueva = actual + 1
sw = sw[:m.start()] + f'const VERSION_APP = "v{nueva}";' + sw[m.end():]
sw_path.write_text(sw, encoding="utf-8")

print(f"Mensaje de Diccionario corregido. PWA v{actual} -> v{nueva}")
