#!/usr/bin/env python3
"""Guardia conservadora para archivos históricos y respaldos necesarios.

Impide que reaparezcan módulos/parches retirados y comprueba que los respaldos
históricos que siguen formando parte de la aplicación mantengan una referencia
activa antes de conservarlos.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

RETIRADOS = {
    "js/accesibilidad.js": ("js/accesibilidad.js", "accesibilidad.js"),
    "css/accesibilidad.css": ("css/accesibilidad.css", "accesibilidad.css"),
    "scripts/tmp_aplicar_puntos_3_12.py": ("tmp_aplicar_puntos_3_12.py",),
}
RESPALDOS_REQUERIDOS = {
    "data/alfabetizacion-mock.json": ("data/alfabetizacion-mock.json", "alfabetizacion-mock.json"),
}

EXTENSIONES = {
    ".html", ".htm", ".js", ".mjs", ".css", ".json", ".py", ".yml", ".yaml",
    ".md", ".txt", ".xml", ".webmanifest", ".jsonld", ".bat", ".ps1"
}
IGNORAR_DIRS = {".git", "node_modules", ".venv", "venv", "dist", "build", "__pycache__"}
IGNORAR = {
    Path("scripts/verificar_archivos_huerfanos.py"),
    *(Path(p) for p in RETIRADOS),
    *(Path(p) for p in RESPALDOS_REQUERIDOS),
}


def fuentes_texto():
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if rel in IGNORAR or any(parte in IGNORAR_DIRS for parte in rel.parts):
            continue
        if path.suffix.lower() not in EXTENSIONES and path.name != "CNAME":
            continue
        try:
            yield rel, path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue


def buscar_referencias(patrones, fuentes):
    refs = []
    for rel, contenido in fuentes:
        if any(p in contenido for p in patrones):
            refs.append(str(rel))
    return sorted(set(refs))


def main():
    fuentes = list(fuentes_texto())
    errores = []

    for ruta, patrones in RETIRADOS.items():
        if (ROOT / ruta).exists():
            errores.append(f"El archivo retirado reapareció: {ruta}")
        refs = buscar_referencias(patrones, fuentes)
        if refs:
            errores.append(f"Hay referencias a {ruta}: {', '.join(refs)}")
        else:
            print(f"OK retirado y sin referencias: {ruta}")

    for ruta, patrones in RESPALDOS_REQUERIDOS.items():
        existe = (ROOT / ruta).exists()
        refs = buscar_referencias(patrones, fuentes)
        if not existe:
            errores.append(f"Falta respaldo requerido: {ruta}")
        elif not refs:
            errores.append(f"{ruta} quedó huérfano; revisar antes de conservarlo")
        else:
            print(f"CONSERVAR respaldo activo: {ruta} <- {', '.join(refs)}")

    if errores:
        for error in errores:
            print("ERROR:", error, file=sys.stderr)
        return 1

    print("Comprobación de archivos históricos superada.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
