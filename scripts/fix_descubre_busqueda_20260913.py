#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / 'js' / 'script.js'
SW = ROOT / 'sw.js'

texto = SCRIPT.read_text(encoding='utf-8')
old = '''    if(texto === "") {\n        sugerencias.style.display = "none";\n        return;\n    }document.getElementById("senalDelDia").style.display = "none";\n'''
new = '''    if(texto === "") {\n        sugerencias.style.display = "none";\n        return;\n    }\n\n    // "Descubre" forma parte de la pantalla principal y debe permanecer\n    // visible mientras la persona escribe y revisa sugerencias. Solo se\n    // oculta cuando realmente se abre una ficha o se cambia de sección.\n    const descubreDuranteBusqueda = document.getElementById("senalDelDia");\n    if(descubreDuranteBusqueda) descubreDuranteBusqueda.style.display = "";\n'''
if texto.count(old) != 1:
    raise SystemExit(f'No se encontró exactamente una coincidencia del bloque antiguo; encontradas: {texto.count(old)}')
SCRIPT.write_text(texto.replace(old, new, 1), encoding='utf-8', newline='\n')

sw = SW.read_text(encoding='utf-8')
old_sw = 'const VERSION_APP = "v107";'
new_sw = 'const VERSION_APP = "v108";'
if sw.count(old_sw) != 1:
    raise SystemExit('No se encontró VERSION_APP v107 en sw.js')
SW.write_text(sw.replace(old_sw, new_sw, 1), encoding='utf-8', newline='\n')

print('Descubre ya no se oculta al escribir en el buscador. PWA: v108')
