#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / 'css' / 'estilos.css'
SW = ROOT / 'sw.js'

css = CSS.read_text(encoding='utf-8')
patron = re.compile(r'(\.stat2-numero\s*\{\s*)display:\s*inline-block\s*;')
nuevo_css, n = patron.subn(r'\1display: block;\n    width: max-content;', css, count=1)
if n != 1:
    raise SystemExit(f'ERROR: se esperaba corregir 1 regla .stat2-numero y se corrigieron {n}.')
CSS.write_text(nuevo_css, encoding='utf-8', newline='\n')

sw = SW.read_text(encoding='utf-8')
if 'const VERSION_APP = "v108";' not in sw:
    raise SystemExit('ERROR: no se encontró VERSION_APP v108 en sw.js.')
SW.write_text(sw.replace('const VERSION_APP = "v108";', 'const VERSION_APP = "v109";', 1), encoding='utf-8', newline='\n')

print('Corregido: los números grandes de Estadísticas ocupan su propia línea.')
