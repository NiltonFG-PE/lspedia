#!/usr/bin/env python3
"""Normaliza nombres de imágenes de ejemplos de Alfabetización.

Solo toca img/alfabetizacion/ejemplos/. Los archivos de grafías/círculo usan
el carácter real (A, Ñ, etc.) como parte de su contrato y NO se renombran.
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CARPETA = ROOT / "img" / "alfabetizacion" / "ejemplos"
JSONS = [ROOT / "data" / "alfabetizacion.json", ROOT / "data" / "alfabetizacion-mock.json"]
PREFIJO = "img/alfabetizacion/ejemplos/"


def nombre_canonico(nombre: str) -> str:
    p = Path(str(nombre).replace("\\", "/"))
    stem = unicodedata.normalize("NFKD", p.stem)
    stem = "".join(ch for ch in stem if not unicodedata.combining(ch))
    stem = stem.lower().strip()
    stem = re.sub(r"[^a-z0-9]+", "-", stem).strip("-") or "archivo"
    ext = p.suffix.lower()
    return stem + ext


def canonicalizar_ruta_ejemplo(ruta: str) -> str:
    valor = str(ruta or "").strip().replace("\\", "/")
    while valor.startswith("./"):
        valor = valor[2:]
    valor = valor.lstrip("/")
    if not valor.startswith(PREFIJO):
        return valor
    resto = valor[len(PREFIJO):]
    if "/" in resto or not resto:
        return valor
    return PREFIJO + nombre_canonico(resto)


def revisar_archivos(aplicar: bool) -> list[str]:
    problemas: list[str] = []
    if not CARPETA.is_dir():
        return [f"No existe {CARPETA.relative_to(ROOT).as_posix()}"]

    for origen in sorted(CARPETA.iterdir()):
        if not origen.is_file():
            continue
        destino = origen.with_name(nombre_canonico(origen.name))
        if destino == origen:
            continue
        problemas.append(f"{origen.name} -> {destino.name}")
        if not aplicar:
            continue
        if destino.exists():
            if origen.read_bytes() == destino.read_bytes():
                origen.unlink()
                continue
            raise RuntimeError(f"Colisión: {origen.name} y {destino.name} son archivos distintos.")
        origen.rename(destino)
        print(f"RENOMBRADO: {origen.relative_to(ROOT)} -> {destino.relative_to(ROOT)}")
    return problemas


def normalizar_json(path: Path, aplicar: bool) -> int:
    if not path.is_file():
        return 0
    datos = json.loads(path.read_text(encoding="utf-8"))
    cambios = 0
    for fila in datos.get("ejemplos", []) if isinstance(datos, dict) else []:
        if not isinstance(fila, dict):
            continue
        actual = str(fila.get("imagen") or "").strip()
        nuevo = canonicalizar_ruta_ejemplo(actual)
        if actual and nuevo != actual:
            cambios += 1
            if aplicar:
                fila["imagen"] = nuevo
                print(f"JSON {path.name}: {actual} -> {nuevo}")
    if cambios and aplicar:
        path.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    return cambios


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Solo comprobar; no modificar")
    args = parser.parse_args()
    aplicar = not args.check

    archivos = revisar_archivos(aplicar)
    cambios_json = sum(normalizar_json(path, aplicar) for path in JSONS)

    if args.check and (archivos or cambios_json):
        print("❌ Hay nombres/rutas no canónicos en ejemplos de Alfabetización.")
        for item in archivos:
            print("  -", item)
        if cambios_json:
            print(f"  - {cambios_json} referencia(s) JSON requieren normalización.")
        return 1

    print(f"✅ Normalización Alfabetización: {len(archivos)} archivo(s), {cambios_json} referencia(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
