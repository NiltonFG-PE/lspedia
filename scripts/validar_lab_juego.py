#!/usr/bin/env python3
"""Valida invariantes del laboratorio del nuevo videojuego educativo."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "lab-juego-educativo.html"
JS = ROOT / "js" / "lab-juego-educativo.js"
SW = ROOT / "sw.js"


def main():
    errores = []
    for p in (HTML, JS, SW):
        if not p.exists():
            errores.append(f"Falta {p.relative_to(ROOT)}")
    if errores:
        print("\n".join("ERROR: " + e for e in errores), file=sys.stderr)
        return 1

    html = HTML.read_text(encoding="utf-8")
    js = JS.read_text(encoding="utf-8")
    sw = SW.read_text(encoding="utf-8")

    if 'noindex,nofollow' not in html:
        errores.append("el laboratorio debe permanecer noindex/nofollow")
    if 'data/vocabulario.json' not in js:
        errores.append("el laboratorio no carga Vocabulario")
    prohibidos = ['data/palabras.json', "fetch('data/palabras", 'fetch("data/palabras']
    if any(x in js for x in prohibidos):
        errores.append("el videojuego no puede usar imágenes/datos del Diccionario")
    if '/lab-juego-educativo.html' not in sw:
        errores.append("el Service Worker debe excluir el laboratorio del fallback a index.html")
    if "LSPedia Aventura" in js:
        errores.append("el prototipo nuevo no debe reactivar el módulo pausado LSPedia Aventura")

    if errores:
        for e in errores:
            print("ERROR:", e, file=sys.stderr)
        return 1

    print("Laboratorio de videojuego validado: aislado, noindex y sin Diccionario.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
