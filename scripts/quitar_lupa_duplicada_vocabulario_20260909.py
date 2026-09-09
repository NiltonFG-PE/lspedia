from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
index_path = root / "index.html"
sw_path = root / "sw.js"

index = index_path.read_text(encoding="utf-8")
patron = re.compile(r'''\n\s*body\.vista-temas-movil #bloqueBuscadorCategorias \.input-group::before \{\n\s*content: "🔎";\n\s*width: 48px;\n\s*flex: 0 0 48px;\n\s*display: flex;\n\s*align-items: center;\n\s*justify-content: center;\n\s*font-size: 1\.18rem;\n\s*background: #ffffff;\n\s*\}\n''')
index2, n = patron.subn("\n", index, count=1)
if n != 1:
    raise SystemExit(f"Se esperaba quitar exactamente una lupa decorativa y se quitaron {n}")

# Al desaparecer el icono izquierdo, recuperamos el padding natural del input.
index2 = index2.replace(
    'padding: 0 8px 0 0 !important;',
    'padding: 0 18px 0 20px !important;',
    1,
)
if index2 == index:
    raise SystemExit("index.html no cambió")
index_path.write_text(index2, encoding="utf-8")

sw = sw_path.read_text(encoding="utf-8")
m = re.search(r'const VERSION_APP = "v(\d+)";', sw)
if not m:
    raise SystemExit("No se encontró VERSION_APP")
actual = int(m.group(1))
nueva = actual + 1
sw = sw[:m.start()] + f'const VERSION_APP = "v{nueva}";' + sw[m.end():]
sw_path.write_text(sw, encoding="utf-8")
print(f"Lupa izquierda eliminada. PWA v{actual} -> v{nueva}")
