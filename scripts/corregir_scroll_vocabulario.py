from pathlib import Path

repo = Path(__file__).resolve().parents[1]
script_path = repo / "js" / "script.js"
sw_path = repo / "sw.js"

script = script_path.read_text(encoding="utf-8")
old = "        panelCategorias.scrollIntoView({ behavior: 'smooth', block: 'center' });"
new = """        // Al entrar a Vocabulario, la primera referencia visual debe ser el\n        // buscador. Antes se centraba #panelCategorias y, al cerrar el aviso\n        // inicial, la pantalla quedaba a mitad de la sección. Reutilizamos el\n        // scroll estable para dejar el buscador justo debajo del navbar fijo.\n        scrollAlPrimerResultado(bloqueBuscadorCategorias || panelCategorias);"""

count = script.count(old)
if count != 1:
    raise SystemExit(f"Se esperaba 1 scroll antiguo de Vocabulario y se encontraron {count}")
script = script.replace(old, new, 1)
script_path.write_text(script, encoding="utf-8")

sw = sw_path.read_text(encoding="utf-8")
old_version = 'const VERSION_APP = "v37";'
new_version = 'const VERSION_APP = "v38";'
count_version = sw.count(old_version)
if count_version != 1:
    raise SystemExit(f"Se esperaba VERSION_APP v37 una vez y se encontró {count_version}")
sw = sw.replace(old_version, new_version, 1)
sw_path.write_text(sw, encoding="utf-8")
