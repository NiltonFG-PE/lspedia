#!/usr/bin/env python3
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent

def read(p): return (ROOT/p).read_text(encoding='utf-8')
def write(p,s): (ROOT/p).write_text(s,encoding='utf-8',newline='\n')
def once(s,a,b,label):
    if b in s: return s
    if a not in s: raise SystemExit(f'No se encontró bloque para {label}')
    return s.replace(a,b,1)

# 1) Generador: las rutas de ejemplos se canonicalizan antes de comprobar existencia.
p='scripts/generar_alfabetizacion.py';s=read(p)
s=once(s,'from pathlib import Path\n','from pathlib import Path\n\nfrom normalizar_media_alfabetizacion import canonicalizar_ruta_ejemplo\n','import canonicalizador')
s=once(s,'    if not normalizada.startswith("img/"):\n        return ""\n    if not (ROOT / normalizada).is_file():\n','    if not normalizada.startswith("img/"):\n        return ""\n    normalizada = canonicalizar_ruta_ejemplo(normalizada)\n    if not (ROOT / normalizada).is_file():\n','canonicalización de ruta')
write(p,s)

# 2) Nombre visible: "La palabra del día". IDs internos se conservan por compatibilidad.
p='js/script.js';s=read(p)
s=s.replace('labelSenalDelDia.textContent = "✨ Palabra del día";','labelSenalDelDia.textContent = "✨ La palabra del día";')
s=s.replace('labelSenalDelDia.textContent = "✨ Palabra de ayer";','labelSenalDelDia.textContent = "✨ La palabra de ayer";')
s=s.replace('`✨ Palabra de hace ${offset} días`','`✨ La palabra de hace ${offset} días`')
s=s.replace('"Expandir Palabra del día" : "Contraer Palabra del día"','"Expandir la palabra del día" : "Contraer la palabra del día"')
s=s.replace('title="Compartir esta seña" aria-label="Compartir esta seña"','title="Compartir esta palabra" aria-label="Compartir esta palabra"')
write(p,s)

# 3) Cargar el módulo nuevo y su CSS; ajustar etiqueta inicial.
p='index.html';s=read(p)
s=s.replace('aria-label="Contraer Palabra del día"','aria-label="Contraer la palabra del día"')
s=s.replace('id="labelSenalDelDia">✨ Palabra del día</span>','id="labelSenalDelDia">✨ La palabra del día</span>')
if 'css/mejoras-producto.css' not in s:
    s=s.replace('<link rel="stylesheet" href="css/subtitulos.css">','<link rel="stylesheet" href="css/subtitulos.css">\n    <link rel="stylesheet" href="css/mejoras-producto.css">',1)
if 'js/mejoras-producto.js' not in s:
    s=s.replace('</body>','<script src="js/mejoras-producto.js"></script>\n</body>',1)
write(p,s)

# 4) Service Worker v65 y nuevos recursos del cascarón.
p='sw.js';s=read(p)
s=s.replace('const VERSION_APP = "v64";','const VERSION_APP = "v65";')
if 'css/mejoras-producto.css' not in s:
    s=s.replace('    "css/subtitulos.css",','    "css/subtitulos.css",\n    "css/mejoras-producto.css",',1)
if 'js/mejoras-producto.js' not in s:
    s=s.replace('    "js/subtitulos.js",','    "js/subtitulos.js",\n    "js/mejoras-producto.js",',1)
write(p,s)

# 5) Workflows permanentes.
write('.github/workflows/actualizar-alfabetizacion.yml','''name: Actualizar alfabetizacion desde Google Sheets

on:
  push:
    branches: [develop]
    paths:
      - "js/alfabetizacion.js"
      - "scripts/generar_alfabetizacion.py"
      - "scripts/migrar_alfabetizacion_json_local.py"
      - "scripts/normalizar_media_alfabetizacion.py"
      - "scripts/auditar_alfabetizacion.py"
      - "scripts/validar_alfabetizacion.py"
      - "scripts/validar_imagenes.py"
      - "img/alfabetizacion/**"
      - ".github/workflows/actualizar-alfabetizacion.yml"
  schedule:
    - cron: "7,37 * * * *"
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: actualizar-alfabetizacion-develop
  cancel-in-progress: true

jobs:
  actualizar-alfabetizacion:
    runs-on: ubuntu-latest
    steps:
      - name: Descargar develop
        uses: actions/checkout@v4
        with:
          ref: develop
          fetch-depth: 0
      - name: Preparar Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.x"
      - name: Normalizar nombres de recursos
        run: python scripts/normalizar_media_alfabetizacion.py
      - name: Migrar navegador a JSON local
        run: python scripts/migrar_alfabetizacion_json_local.py
      - name: Descargar Alfabetizacion y generar JSON
        run: python scripts/generar_alfabetizacion.py
      - name: Validar y auditar antes de publicar
        shell: bash
        run: |
          python -m json.tool data/alfabetizacion.json > /dev/null
          python scripts/normalizar_media_alfabetizacion.py --check
          python scripts/validar_alfabetizacion.py
          python scripts/auditar_alfabetizacion.py
          python scripts/validar_imagenes.py --solo-data data/alfabetizacion.json
          node --check js/alfabetizacion.js
          git diff --check
      - name: Guardar cambios si hubo actualizacion
        shell: bash
        run: |
          if git diff --quiet -- js/alfabetizacion.js data/alfabetizacion.json sw.js img/alfabetizacion/ejemplos; then
            echo "Alfabetizacion ya estaba actualizada."
            exit 0
          fi
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add js/alfabetizacion.js data/alfabetizacion.json sw.js img/alfabetizacion/ejemplos
          git commit -m "Sincronizar Alfabetizacion y normalizar recursos"
          git push origin HEAD:develop
''')

write('.github/workflows/actualizar-sitemap.yml','''name: Actualizar IDs y sitemap

on:
  push:
    branches:
      - develop
    paths:
      - "data/palabras.json"
      - "js/script.js"
      - "scripts/migrar_ids_palabras.py"
      - "scripts/separar_diccionario_vocabulario.py"
      - "scripts/generar_sitemap.py"
      - "scripts/actualizar_nuevas_palabras.py"
      - "scripts/normalizar_categorias.py"
      - "scripts/validar_lspedia.py"
      - ".github/workflows/actualizar-sitemap.yml"
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: actualizar-ids-sitemap-develop
  cancel-in-progress: true

jobs:
  actualizar-datos:
    runs-on: ubuntu-latest
    steps:
      - name: Descargar repositorio
        uses: actions/checkout@v4
        with:
          ref: develop
          fetch-depth: 0
      - name: Preparar Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.x"
      - name: Crear y migrar IDs únicos
        run: python scripts/migrar_ids_palabras.py
      - name: Separar Diccionario y Vocabulario
        run: python scripts/separar_diccionario_vocabulario.py
      - name: Generar sitemap.xml
        run: python scripts/generar_sitemap.py
      - name: Detectar nuevas palabras reales
        run: python scripts/actualizar_nuevas_palabras.py
      - name: Validar Diccionario antes de guardar
        shell: bash
        run: |
          python -m json.tool data/palabras.json > /dev/null
          python -m json.tool data/nuevas-palabras.json > /dev/null
          python scripts/validar_lspedia.py --fuente diccionario
          node --check js/script.js
          git diff --check
      - name: Guardar cambios automáticos
        shell: bash
        run: |
          if git diff --quiet -- data/palabras.json data/nuevas-palabras.json js/script.js sitemap.xml; then
            echo "IDs, nuevas palabras y sitemap ya estaban actualizados."
            exit 0
          fi
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add data/palabras.json data/nuevas-palabras.json js/script.js sitemap.xml
          git commit -m "Actualizar Diccionario nuevas palabras y sitemap"
          git push origin HEAD:develop
''')

write('.github/workflows/validar-lspedia.yml','''name: Validar LSPedia

on:
  push:
    branches: [develop]
    paths:
      - "data/**"
      - "img/**"
      - "css/**"
      - "js/**"
      - "index.html"
      - "sw.js"
      - "scripts/validar_lspedia.py"
      - "scripts/validar_imagenes.py"
      - "scripts/validar_alfabetizacion.py"
      - "scripts/auditar_alfabetizacion.py"
      - "scripts/normalizar_media_alfabetizacion.py"
      - "scripts/normalizar_categorias.py"
      - ".github/workflows/validar-lspedia.yml"
  pull_request:
    branches: [develop]
    paths:
      - "data/**"
      - "img/**"
      - "css/**"
      - "js/**"
      - "index.html"
      - "sw.js"
      - "scripts/validar_lspedia.py"
      - "scripts/validar_imagenes.py"
      - "scripts/validar_alfabetizacion.py"
      - "scripts/auditar_alfabetizacion.py"
      - "scripts/normalizar_media_alfabetizacion.py"
      - "scripts/normalizar_categorias.py"
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: validar-lspedia-${{ github.ref }}
  cancel-in-progress: true

jobs:
  validar:
    runs-on: ubuntu-latest
    steps:
      - name: Descargar repositorio
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event_name == 'pull_request' && github.event.pull_request.head.sha || 'develop' }}
      - name: Preparar Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.x"
      - name: Validar Diccionario y Vocabulario
        run: python scripts/validar_lspedia.py
      - name: Auditar Alfabetizacion completa
        shell: bash
        run: |
          python scripts/normalizar_media_alfabetizacion.py --check
          python scripts/validar_alfabetizacion.py
          python scripts/auditar_alfabetizacion.py
      - name: Validar sintaxis de JavaScript
        shell: bash
        run: |
          set -e
          while IFS= read -r -d '' archivo; do
            echo "Revisando $archivo"
            node --check "$archivo"
          done < <(find js -maxdepth 1 -type f -name '*.js' -print0 | sort -z)
          node --check sw.js
      - name: Validar JSON principales
        shell: bash
        run: |
          python -m json.tool data/palabras.json > /dev/null
          python -m json.tool data/vocabulario.json > /dev/null
          python -m json.tool data/alfabetizacion.json > /dev/null
          if [ -f data/nuevas-palabras.json ]; then python -m json.tool data/nuevas-palabras.json > /dev/null; fi
          echo "JSON válidos."
      - name: Validar imágenes locales
        run: python scripts/validar_imagenes.py
      - name: Verificar formato y archivo protegido
        shell: bash
        run: |
          git diff --check
          test -f 'video/lspedia_transparente anterior.webm'
          test "$(git hash-object 'video/lspedia_transparente anterior.webm')" = 'ca9a110b75384b534f8ebdcae45406fb178df083'
''')

print('Parches 3–12 preparados.')
