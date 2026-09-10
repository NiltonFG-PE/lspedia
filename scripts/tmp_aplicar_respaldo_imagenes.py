#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

(ROOT / 'img' / 'imagen-no-disponible.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" role="img" aria-label="Imagen no disponible">
  <rect width="320" height="240" rx="24" fill="#f1f5f9"/>
  <rect x="48" y="42" width="224" height="156" rx="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="6"/>
  <circle cx="116" cy="91" r="18" fill="#fbbf24"/>
  <path d="M69 175l61-58 39 36 28-25 54 47H69z" fill="#93c5fd"/>
  <path d="M69 175l61-58 39 36 28-25 54 47" fill="none" stroke="#64748b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M75 52l170 136" stroke="#ef4444" stroke-width="9" stroke-linecap="round" opacity=".88"/>
</svg>
''', encoding='utf-8')

validator = r'''#!/usr/bin/env python3
"""Valida imágenes locales usadas por el contenido activo de LSPedia.

Los JSON de respaldo/mock no bloquean la publicación porque no son la fuente
normal. Las rutas activas de data/*.json sí son estrictas. Las referencias
literales históricas de HTML/CSS/JS se reportan como aviso para no romper una
publicación por código auxiliar que ya tenga fallback en el navegador.
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
EXTS = ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif')
PATRON = re.compile(r'(?:\./|/)?(img/[A-Za-z0-9_À-ÿÑñ .@()\-/]+?\.(?:png|jpe?g|webp|gif|svg|avif))(?:[?#][^\"\'\s)<,]*)?', re.I)


def limpiar(valor: str) -> str | None:
    s = unquote(str(valor or '').strip()).replace('\\', '/')
    s = s.split('?', 1)[0].split('#', 1)[0]
    while s.startswith('./'):
        s = s[2:]
    s = s.lstrip('/')
    if not s.startswith('img/') or not s.lower().endswith(EXTS):
        return None
    if any(x in s for x in ('{', '}', '${', '<', '>', '*')):
        return None
    return s


def agregar_desde_cadena(cadena: str, origen: str, salida: dict[str, set[str]]):
    encontrados = False
    for m in PATRON.finditer(cadena):
        ruta = limpiar(m.group(1))
        if ruta:
            encontrados = True
            salida.setdefault(ruta, set()).add(origen)
    if not encontrados:
        ruta = limpiar(cadena)
        if ruta:
            salida.setdefault(ruta, set()).add(origen)


def extraer_json(obj, origen: str, salida: dict[str, set[str]]):
    if isinstance(obj, dict):
        for v in obj.values():
            extraer_json(v, origen, salida)
    elif isinstance(obj, list):
        for v in obj:
            extraer_json(v, origen, salida)
    elif isinstance(obj, str):
        agregar_desde_cadena(obj, origen, salida)


def extraer_texto(path: Path, salida: dict[str, set[str]]):
    texto = path.read_text(encoding='utf-8', errors='ignore')
    texto = re.sub(r'/\*.*?\*/', '', texto, flags=re.S)
    texto = re.sub(r'(^|\n)\s*//.*?(?=\n|$)', r'\1', texto)
    for m in PATRON.finditer(texto):
        ruta = limpiar(m.group(1))
        if ruta:
            salida.setdefault(ruta, set()).add(path.relative_to(ROOT).as_posix())


def sugerir_case(ruta: str) -> str | None:
    actual = ROOT
    partes_reales = []
    for parte in Path(ruta).parts:
        if not actual.is_dir():
            return None
        mapa = {p.name.casefold(): p.name for p in actual.iterdir()}
        real = mapa.get(parte.casefold())
        if real is None:
            return None
        partes_reales.append(real)
        actual /= real
    sugerida = '/'.join(partes_reales)
    return sugerida if sugerida != ruta else None


def nombre_no_recomendado(ruta: str) -> bool:
    base = Path(ruta).stem
    ascii_base = ''.join(c for c in unicodedata.normalize('NFD', base) if unicodedata.category(c) != 'Mn')
    return base != base.lower() or ' ' in base or ascii_base != base or 'ñ' in base.lower()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--solo-data', action='append', default=[])
    args = ap.parse_args()

    referencias: dict[str, set[str]] = {}
    if args.solo_data:
        json_paths = [ROOT / p for p in args.solo_data]
    else:
        json_paths = [p for p in sorted((ROOT / 'data').glob('*.json')) if 'mock' not in p.stem.lower() and 'backup' not in p.stem.lower()]

    for path in json_paths:
        if not path.exists():
            print(f'❌ No existe {path.relative_to(ROOT).as_posix()}')
            return 1
        try:
            datos = json.loads(path.read_text(encoding='utf-8'))
        except Exception as exc:
            print(f'❌ JSON inválido {path.relative_to(ROOT).as_posix()}: {exc}')
            return 1
        extraer_json(datos, path.relative_to(ROOT).as_posix(), referencias)

    if not args.solo_data:
        for patron in ('*.html', 'admin/*.html', 'css/*.css', 'js/*.js'):
            for path in ROOT.glob(patron):
                if path.is_file():
                    extraer_texto(path, referencias)

    errores = []
    faltantes_codigo = []
    nombres = []
    for ruta, origenes in sorted(referencias.items()):
        if not (ROOT / ruta).is_file():
            sugerida = sugerir_case(ruta)
            detalle = f' (¿quizá {sugerida}?)' if sugerida else ''
            msg = f"{ruta}{detalle} <- {', '.join(sorted(origenes))}"
            if any(o.startswith('data/') for o in origenes):
                errores.append(msg)
            else:
                faltantes_codigo.append(msg)
        elif nombre_no_recomendado(ruta):
            nombres.append(ruta)

    print('\n=== VALIDACIÓN DE IMÁGENES LSPedia ===')
    print(f'ℹ️  {len(referencias)} rutas locales activas revisadas.')
    for msg in faltantes_codigo:
        print(f'⚠️  Referencia histórica sin archivo (el navegador usará respaldo): {msg}')
    for ruta in nombres[:25]:
        print(f'⚠️  Para nuevos archivos usa minúsculas/sin tildes/sin espacios: {ruta}')
    if len(nombres) > 25:
        print(f'⚠️  ... y {len(nombres)-25} nombre(s) heredado(s) más.')
    for msg in errores:
        print(f'❌ Imagen de contenido no encontrada: {msg}')
    print(f'Resumen: {len(errores)} error(es), {len(faltantes_codigo)+len(nombres)} aviso(s).')
    return 1 if errores else 0


if __name__ == '__main__':
    raise SystemExit(main())
'''
(ROOT / 'scripts' / 'validar_imagenes.py').write_text(validator, encoding='utf-8')

script_path = ROOT / 'js' / 'script.js'
script = script_path.read_text(encoding='utf-8')
if 'SISTEMA GLOBAL ANTI-IMÁGENES ROTAS' not in script:
    script += r'''

/* ============================================================
   SISTEMA GLOBAL ANTI-IMÁGENES ROTAS
   ------------------------------------------------------------
   Si cualquier <img> falla, incluso uno creado dinámicamente por
   Diccionario, Vocabulario, Quiz o Juegos, se sustituye por un
   respaldo visual local y se registra la ruta técnica en Analytics.
   ============================================================ */
(function activarRespaldoGlobalImagenesLSPedia(){
    "use strict";
    const FALLBACK = "img/imagen-no-disponible.svg";

    function aplicarFallback(img){
        if(!img || img.tagName !== "IMG" || img.dataset.lspediaImagenFallback === "1") return;
        const original = img.currentSrc || img.getAttribute("src") || "";
        if(!original || original.indexOf("imagen-no-disponible.svg") !== -1) return;
        img.dataset.lspediaImagenFallback = "1";
        img.dataset.lspediaSrcOriginal = original;
        img.classList.add("lspedia-imagen-fallback");
        img.src = FALLBACK;
        try {
            if(typeof window.gtag === "function"){
                const ruta = new URL(original, window.location.href).pathname.slice(0, 180);
                window.gtag("event", "image_load_error", { image_path: ruta });
            }
        } catch (_) { /* el respaldo no depende de Analytics */ }
    }

    document.addEventListener("error", function(evento){
        const destino = evento.target;
        if(destino && destino.tagName === "IMG") aplicarFallback(destino);
    }, true);

    window.LSPediaImagenes = Object.freeze({ aplicarFallback });
})();
'''
    script_path.write_text(script, encoding='utf-8')

css_path = ROOT / 'css' / 'estilos.css'
css = css_path.read_text(encoding='utf-8')
if 'RESPALDO VISUAL PARA IMÁGENES QUE NO CARGAN' not in css:
    css += r'''

/* ============================================================
   RESPALDO VISUAL PARA IMÁGENES QUE NO CARGAN
   ============================================================ */
img.lspedia-imagen-fallback {
    object-fit: contain !important;
    object-position: center !important;
    box-sizing: border-box !important;
    padding: clamp(8px, 9%, 28px) !important;
    background: #f6f8fb !important;
}
'''
    css_path.write_text(css, encoding='utf-8')

sw_path = ROOT / 'sw.js'
sw = sw_path.read_text(encoding='utf-8').replace('const VERSION_APP = "v59";', 'const VERSION_APP = "v60";')
if 'img/imagen-no-disponible.svg' not in sw:
    needle = '    "img/icons/icon-512-maskable.png"\n'
    if needle not in sw:
        raise SystemExit('No pude ubicar ARCHIVOS_CASCARON en sw.js')
    sw = sw.replace(needle, '    "img/icons/icon-512-maskable.png",\n    "img/imagen-no-disponible.svg"\n', 1)
sw_path.write_text(sw, encoding='utf-8')

validar_path = ROOT / '.github' / 'workflows' / 'validar-lspedia.yml'
yml = validar_path.read_text(encoding='utf-8')
# Agrega rutas a push y pull_request sin duplicarlas.
partes = yml.split('  pull_request:', 1)
for idx in range(len(partes)):
    bloque = partes[idx]
    if '      - "img/**"\n' not in bloque:
        bloque = bloque.replace('      - "data/**"\n', '      - "data/**"\n      - "img/**"\n      - "css/**"\n      - "scripts/validar_imagenes.py"\n', 1)
    partes[idx] = bloque
yml = '  pull_request:'.join(partes)
if '      - name: Validar imágenes locales' not in yml:
    yml += '\n      - name: Validar imágenes locales\n        run: python scripts/validar_imagenes.py\n'
validar_path.write_text(yml, encoding='utf-8')

alf_path = ROOT / '.github' / 'workflows' / 'actualizar-alfabetizacion.yml'
alf = alf_path.read_text(encoding='utf-8')
if '"scripts/validar_imagenes.py"' not in alf:
    alf = alf.replace('      - "scripts/validar_alfabetizacion.py"\n', '      - "scripts/validar_alfabetizacion.py"\n      - "scripts/validar_imagenes.py"\n')
if 'python scripts/validar_imagenes.py --solo-data data/alfabetizacion.json' not in alf:
    alf = alf.replace('          python scripts/validar_alfabetizacion.py\n', '          python scripts/validar_alfabetizacion.py\n          python scripts/validar_imagenes.py --solo-data data/alfabetizacion.json\n')
alf_path.write_text(alf, encoding='utf-8')

print('Cambios anti-imágenes preparados.')
