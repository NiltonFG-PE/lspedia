#!/usr/bin/env python3
"""Aplica una sola vez la separación de fuentes Diccionario/Vocabulario.

Conserva Hoja 1 (Diccionario) y Hoja 2 (Vocabulario/Quiz) como colecciones
independientes aunque una palabra tenga el mismo nombre en ambas.
Es idempotente: si script.js ya contiene obtenerFuentePalabra(), no hace nada.
"""
from __future__ import annotations

import base64
import gzip
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "js" / "script.js"
MARCADOR = "function obtenerFuentePalabra(p){"
CHUNKS = [ROOT / "scripts" / f"separar_fuentes_chunk{i}.txt" for i in range(1, 5)]


def aplicar() -> bool:
    texto = SCRIPT.read_text(encoding="utf-8")
    if MARCADOR in texto:
        print("Separación Diccionario/Vocabulario ya aplicada.")
        return False

    faltantes = [str(p.relative_to(ROOT)) for p in CHUNKS if not p.exists()]
    if faltantes:
        raise SystemExit("ERROR: faltan fragmentos del parche: " + ", ".join(faltantes))

    codificado = "".join(p.read_text(encoding="utf-8").strip() for p in CHUNKS)
    try:
        parche = gzip.decompress(base64.b64decode(codificado))
    except Exception as exc:
        raise SystemExit(f"ERROR: el parche de separación está dañado: {exc}") from exc

    comprobar = subprocess.run(
        ["git", "apply", "--check", "-"], cwd=ROOT, input=parche,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    if comprobar.returncode != 0:
        raise SystemExit(
            "ERROR: el parche de separación ya no coincide con js/script.js actual.\n"
            + comprobar.stderr.decode("utf-8", errors="replace")
        )

    aplicar_parche = subprocess.run(["git", "apply", "-"], cwd=ROOT, input=parche)
    if aplicar_parche.returncode != 0:
        raise SystemExit("ERROR: no se pudo aplicar el parche de separación.")

    print("Separación Diccionario/Vocabulario aplicada correctamente.")
    return True


if __name__ == "__main__":
    aplicar()
