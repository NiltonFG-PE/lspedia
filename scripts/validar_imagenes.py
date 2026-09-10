#!/usr/bin/env python3
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
