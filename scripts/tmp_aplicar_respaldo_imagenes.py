#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

placeholder = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" role="img" aria-label="Imagen no disponible">
  <rect width="320" height="240" rx="24" fill="#f1f5f9"/>
  <rect x="48" y="42" width="224" height="156" rx="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="6"/>
  <circle cx="116" cy="91" r="18" fill="#fbbf24"/>
  <path d="M69 175l61-58 39 36 28-25 54 47H69z" fill="#93c5fd"/>
  <path d="M69 175l61-58 39 36 28-25 54 47" fill="none" stroke="#64748b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M75 52l170 136" stroke="#ef4444" stroke-width="9" stroke-linecap="round" opacity=".88"/>
</svg>
'''
(ROOT / 'img' / 'imagen-no-disponible.svg').write_text(placeholder, encoding='utf-8')

validator = r'''#!/usr/bin/env python3
"""Comprueba que las imágenes locales referenciadas por LSPedia existan.

- Revisa rutas img/... de los JSON de data/.
- Revisa referencias literales de imágenes en HTML/CSS/JS.
- GitHub/Linux distingue mayúsculas y minúsculas, igual que el hosting.
- Las rutas dinámicas con variables se ignoran deliberadamente.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
EXTS = ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif')
PATRON_LITERAL = re.compile(r'(?:\./|/)?(img/[A-Za-z0-9_À-ÿÑñ .@()\-/]+?\.(?:png|jpe?g|webp|gif|svg|avif))(?:[?#][^\"\'\s)<]*)?', re.I)


def normalizar_ruta(valor: str) -> str | None:
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


def extraer_json(obj, origen: str, salida: dict[str, set[str]]):
    if isinstance(obj, dict):
        for valor in obj.values():
            extraer_json(valor, origen, salida)
    elif isinstance(obj, list):
        for valor in obj:
            extraer_json(valor, origen, salida)
    elif isinstance(obj, str):
        ruta = normalizar_ruta(obj)
        if ruta:
            salida.setdefault(ruta, set()).add(origen)


def extraer_texto(path: Path, salida: dict[str, set[str]]):
    texto = path.read_text(encoding='utf-8', errors='ignore')
    # Evita que ejemplos documentales en comentarios activen falsos errores.
    texto = re.sub(r'/\*.*?\*/', '', texto, flags=re.S)
    texto = re.sub(r'(^|\n)\s*//.*?(?=\n|$)', r'\1', texto)
    for match in PATRON_LITERAL.finditer(texto):
        ruta = normalizar_ruta(match.group(1))
        if ruta:
            salida.setdefault(ruta, set()).add(path.relative_to(ROOT).as_posix())


def sugerir_case(ruta: str) -> str | None:
    partes = Path(ruta).parts
    actual = ROOT
    construida = []
    for parte in partes:
        if not actual.is_dir():
            return None
        candidatos = {p.name.casefold(): p.name for p in actual.iterdir()}
        real = candidatos.get(parte.casefold())
        if real is None:
            return None
        construida.append(real)
        actual = actual / real
    sugerida = '/'.join(construida)
    return sugerida if sugerida != ruta else None


def nombre_recomendado(ruta: str) -> bool:
    nombre = Path(ruta).name
    base = Path(nombre).stem
    sin_tilde = ''.join(c for c in unicodedata.normalize('NFD', base) if unicodedata.category(c) != 'Mn')
    return base != base.lower() or ' ' in base or sin_tilde != base or 'ñ' in base.lower()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--solo-data', action='append', default=[], help='Revisar únicamente un JSON concreto, relativo al repo.')
    args = parser.parse_args()

    referencias: dict[str, set[str]] = {}
    if args.solo_data:
        json_paths = [ROOT / p for p in args.solo_data]
    else:
        json_paths = sorted((ROOT / 'data').glob('*.json'))

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
    avisos = []
    for ruta, origenes in sorted(referencias.items()):
        if not (ROOT / ruta).is_file():
            sugerida = sugerir_case(ruta)
            detalle = f" (¿quizá {sugerida}?)" if sugerida else ''
            errores.append(f"{ruta}{detalle} <- {', '.join(sorted(origenes))}")
        elif nombre_recomendado(ruta):
            avisos.append(ruta)

    print('\n=== VALIDACIÓN DE IMÁGENES LSPedia ===')
    print(f'ℹ️  {len(referencias)} rutas locales de imagen revisadas.')
    for ruta in avisos[:30]:
        print(f'⚠️  Nombre no recomendado (para nuevos archivos usa minúsculas/sin tildes/sin espacios): {ruta}')
    if len(avisos) > 30:
        print(f'⚠️  ... y {len(avisos)-30} aviso(s) más.')
    for error in errores:
        print(f'❌ Imagen no encontrada: {error}')
    print(f'Resumen: {len(errores)} error(es), {len(avisos)} aviso(s).')
    return 1 if errores else 0


if __name__ == '__main__':
    raise SystemExit(main())
'''
(ROOT / 'scripts' / 'validar_imagenes.py').write_text(validator, encoding='utf-8')

script_path = ROOT / 'js' / 'script.js'
script = script_path.read_text(encoding='utf-8')
marker = 'SISTEMA GLOBAL ANTI-IMÁGENES ROTAS'
if marker not in script:
    script += r'''

/* ============================================================
   SISTEMA GLOBAL ANTI-IMÁGENES ROTAS
   ------------------------------------------------------------
   Intercepta fallos de <img>, incluidos elementos creados después
   por Diccionario, Vocabulario, Quiz y Juegos, y muestra un respaldo
   visual local en vez del icono roto del navegador.
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

        // Reporte técnico anónimo: solo la ruta del recurso que falló.
        try {
            if(typeof window.gtag === "function"){
                const ruta = new URL(original, window.location.href).pathname.slice(0, 180);
                window.gtag("event", "image_load_error", { image_path: ruta });
            }
        } catch (_) { /* el respaldo visual no depende de Analytics */ }
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
css_marker = 'RESPALDO VISUAL PARA IMÁGENES QUE NO CARGAN'
if css_marker not in css:
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
sw = sw_path.read_text(encoding='utf-8')
sw = sw.replace('const VERSION_APP = "v59";', 'const VERSION_APP = "v60";')
if 'img/imagen-no-disponible.svg' not in sw:
    needle = '    "img/icons/icon-512-maskable.png"\n'
    repl = '    "img/icons/icon-512-maskable.png",\n    "img/imagen-no-disponible.svg"\n'
    if needle not in sw:
        raise SystemExit('No pude ubicar la lista ARCHIVOS_CASCARON de sw.js')
    sw = sw.replace(needle, repl, 1)
sw_path.write_text(sw, encoding='utf-8')

validar_path = ROOT / '.github' / 'workflows' / 'validar-lspedia.yml'
yml = validar_path.read_text(encoding='utf-8')
for bloque in ['      - "img/**"\n', '      - "css/**"\n', '      - "scripts/validar_imagenes.py"\n']:
    if bloque not in yml:
        yml = yml.replace('      - "data/**"\n', '      - "data/**"\n' + bloque, 1)
# segundo bloque pull_request: insertar si no quedó dos veces
if yml.count('      - "img/**"\n') < 2:
    pos = yml.find('  pull_request:')
    if pos != -1:
        before, after = yml[:pos], yml[pos:]
        after = after.replace('      - "data/**"\n', '      - "data/**"\n      - "img/**"\n      - "css/**"\n      - "scripts/validar_imagenes.py"\n', 1)
        yml = before + after
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
