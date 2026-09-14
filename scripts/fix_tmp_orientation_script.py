#!/usr/bin/env python3
from pathlib import Path

p = Path('scripts/tmp_mejorar_senas_orientacion_auto.py')
s = p.read_text(encoding='utf-8')
start = s.index("html = repl(html,\n\"\"\"          <div class=\"guia-captura\"")
end_marker = "\n'svg silueta')"
end = s.index(end_marker, start) + len(end_marker)
correcto = '''html = repl(html,\n'          <div class="guia-captura" aria-hidden="true"></div>\\n          <div id="cuentaRegresivaSenas"',\n'          <div class="guia-captura" aria-hidden="true"></div>\\n          <svg id="siluetaGuiaSenas" class="silueta-guia ajustar" viewBox="0 0 100 150" aria-hidden="true" focusable="false">\\n            <ellipse class="cuerpo" cx="50" cy="24" rx="11" ry="14"></ellipse>\\n            <path class="cuerpo" d="M31 58 Q37 45 50 44 Q63 45 69 58 L75 112 Q64 124 50 124 Q36 124 25 112 Z"></path>\\n            <path class="cuerpo" d="M32 58 Q20 69 15 96 M68 58 Q80 69 85 96"></path>\\n            <ellipse class="manos" cx="13" cy="104" rx="9" ry="12"></ellipse>\\n            <ellipse class="manos" cx="87" cy="104" rx="9" ry="12"></ellipse>\\n          </svg>\\n          <div id="cuentaRegresivaSenas"',\n'svg silueta')'''
s = s[:start] + correcto + s[end:]
p.write_text(s, encoding='utf-8')
print('OK: migración temporal corregida')
