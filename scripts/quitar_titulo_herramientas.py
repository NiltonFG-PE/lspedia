from pathlib import Path
import re

repo = Path(__file__).resolve().parents[1]
index_path = repo / "index.html"
sw_path = repo / "sw.js"

html = index_path.read_text(encoding="utf-8")

patron = re.compile(
    r'\n\s*<h4 class="fw-bold mb-3 text-center herr-titulo-icono-wrap">\s*'
    r'<img src="img/categorias/Herramientas\.webp" alt="" loading="lazy" class="herr-titulo-icono">\s*'
    r'HERRAMIENTAS\s*</h4>',
    re.MULTILINE,
)

html_nuevo, cambios = patron.subn("", html, count=1)
if cambios != 1:
    raise SystemExit(f"Se esperaba quitar exactamente 1 título de Herramientas; se encontraron {cambios}.")

# La tarjeta debe seguir existiendo y la sección no debe perder funcionalidad.
if 'id="herramientasMenuMovil"' not in html_nuevo:
    raise SystemExit("No se encontró herramientasMenuMovil después del cambio.")
if 'id="btnHerrMovilAlfabetizacion"' not in html_nuevo or 'id="btnHerrMovilJugar"' not in html_nuevo or 'id="btnHerrMovilSubtitulos"' not in html_nuevo:
    raise SystemExit("Falta una de las tarjetas del menú de Herramientas.")

index_path.write_text(html_nuevo, encoding="utf-8")

sw = sw_path.read_text(encoding="utf-8")
if 'const VERSION_APP = "v36";' not in sw:
    raise SystemExit("No se encontró VERSION_APP v36; no se actualiza el service worker por seguridad.")
sw = sw.replace('const VERSION_APP = "v36";', 'const VERSION_APP = "v37";', 1)
sw_path.write_text(sw, encoding="utf-8")

print("Título redundante de Herramientas eliminado y PWA actualizada a v37.")
