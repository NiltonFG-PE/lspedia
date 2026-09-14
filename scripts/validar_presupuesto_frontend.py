#!/usr/bin/env python3
"""Presupuesto conservador de tamaño para el frontend de LSPedia.

No sustituye una prueba real de Core Web Vitals. Evita regresiones evidentes:
archivos monolíticos que crecen demasiado o un shell PWA que incorpora recursos
pesados por accidente.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

LIMITES = {
    "index.html": 400_000,
    "js/script.js": 400_000,
    "css/estilos.css": 120_000,
    "css/mejoras-producto.css": 80_000,
    "sw.js": 35_000,
}
MAX_JS_INDIVIDUAL = 450_000
MAX_CSS_INDIVIDUAL = 150_000
MAX_SHELL_LOCAL = 1_300_000


def kb(n):
    return f"{n / 1024:.1f} KiB"


def validar_limites(errores):
    for rel, limite in LIMITES.items():
        path = ROOT / rel
        if not path.exists():
            errores.append(f"Falta archivo crítico: {rel}")
            continue
        size = path.stat().st_size
        print(f"{rel}: {kb(size)} / límite {kb(limite)}")
        if size > limite:
            errores.append(f"{rel} supera el presupuesto: {kb(size)} > {kb(limite)}")


def validar_individuales(errores):
    for carpeta, patron, limite in (("js", "*.js", MAX_JS_INDIVIDUAL), ("css", "*.css", MAX_CSS_INDIVIDUAL)):
        for path in sorted((ROOT / carpeta).glob(patron)):
            size = path.stat().st_size
            if size > limite:
                errores.append(f"{path.relative_to(ROOT)} demasiado grande: {kb(size)} > {kb(limite)}")


def recursos_shell():
    sw = (ROOT / "sw.js").read_text(encoding="utf-8")
    match = re.search(r"const\s+ARCHIVOS_CASCARON\s*=\s*\[(.*?)\];", sw, re.S)
    if not match:
        return []
    return re.findall(r'["\']([^"\']+)["\']', match.group(1))


def validar_shell(errores):
    total = 0
    faltantes = []
    recursos = recursos_shell()
    for recurso in recursos:
        limpio = recurso.split("?", 1)[0]
        if limpio in {"./", "./index.html"}:
            continue
        path = ROOT / limpio.lstrip("./")
        if path.is_file():
            total += path.stat().st_size
        else:
            faltantes.append(limpio)
    print(f"Shell PWA local: {kb(total)} en {len(recursos)} entradas declaradas")
    if total > MAX_SHELL_LOCAL:
        errores.append(f"El shell PWA supera el presupuesto local: {kb(total)} > {kb(MAX_SHELL_LOCAL)}")
    if faltantes:
        errores.append("El Service Worker referencia archivos inexistentes: " + ", ".join(sorted(set(faltantes))))


def main():
    errores = []
    validar_limites(errores)
    validar_individuales(errores)
    validar_shell(errores)
    if errores:
        for e in errores:
            print("ERROR:", e, file=sys.stderr)
        return 1
    print("Presupuesto frontend dentro de límites conservadores.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
