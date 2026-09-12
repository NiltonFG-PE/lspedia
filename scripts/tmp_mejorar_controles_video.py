from pathlib import Path
import re

css = Path('css/mejoras-producto.css')
texto = css.read_text(encoding='utf-8')

# El primer bloque global fue una etapa intermedia. El diseño final y más
# específico para Diccionario/Vocabulario es CONTROLES_VIDEO_PALABRA_V1,
# que está después y conserva las velocidades/tortuga/conejo. Retiramos el
# bloque intermedio para evitar reglas duplicadas o efectos fuera de la ficha.
inicio = texto.find('/* ============================================================\n   CONTROLES_VIDEO_VISUAL_V1_20260912')
fin = texto.find('/* ============================================================\n   CONTROLES_VIDEO_PALABRA_V1_20260912')
if inicio != -1 and fin != -1 and fin > inicio:
    texto = texto[:inicio].rstrip() + '\n\n' + texto[fin:]

css.write_text(texto, encoding='utf-8')

sw = Path('sw.js')
s = sw.read_text(encoding='utf-8')
s2, n = re.subn(r'const VERSION_APP = "v\d+";', 'const VERSION_APP = "v86";', s, count=1)
if n != 1:
    raise SystemExit('No se pudo confirmar VERSION_APP v86')
sw.write_text(s2, encoding='utf-8')
