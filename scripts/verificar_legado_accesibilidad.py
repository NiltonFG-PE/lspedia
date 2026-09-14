#!/usr/bin/env python3
"""Comprueba que los módulos antiguos de accesibilidad no sigan referenciados.

Esta verificación es deliberadamente conservadora: antes de borrar archivos
históricos, exige que ninguna fuente activa del repositorio los nombre.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
OBJETIVOS = {
    "js/accesibilidad.js": {"js/accesibilidad.js", "accesibilidad.js"},
    "css/accesibilidad.css": {"css/accesibilidad.css", "accesibilidad.css"},
}
EXTENSIONES = {
    ".html", ".htm", ".js", ".mjs", ".css", ".json", ".py", ".yml", ".yaml",
    ".md", ".txt", ".xml", ".webmanifest", ".jsonld"
}
IGNORAR_DIRS = {".git", "node_modules", ".venv", "venv", "dist", "build"}
IGNORAR_ARCHIVOS = {
    Path("scripts/verificar_legado_accesibilidad.py"),
    Path("js/accesibilidad.js"),
    Path("css/accesibilidad.css"),
}


def archivos_texto():
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if any(parte in IGNORAR_DIRS for parte in rel.parts):
            continue
        if rel in IGNORAR_ARCHIVOS:
            continue
        if path.suffix.lower() not in EXTENSIONES and path.name not in {"CNAME"}:
            continue
        yield path, rel


def main():
    hallazgos = {objetivo: [] for objetivo in OBJETIVOS}
    for path, rel in archivos_texto():
        try:
            texto = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for objetivo, patrones in OBJETIVOS.items():
            if any(patron in texto for patron in patrones):
                hallazgos[objetivo].append(str(rel))

    con_referencias = False
    for objetivo, refs in hallazgos.items():
        if refs:
            con_referencias = True
            print(f"REFERENCIAS ACTIVAS: {objetivo}")
            for ref in sorted(set(refs)):
                print(f"  - {ref}")
        else:
            print(f"SIN REFERENCIAS: {objetivo}")

    if con_referencias:
        print("No es seguro eliminar los archivos de accesibilidad antiguos todavía.")
        return 1

    print("Los dos archivos de accesibilidad antiguos están huérfanos y pueden retirarse con seguridad.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
