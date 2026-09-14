#!/usr/bin/env python3
"""Valida el dataset experimental del buscador por señas de LSPedia."""

from __future__ import annotations

import json
import math
from pathlib import Path

RUTA = Path("data/senas-ia-dataset.json")
DIMENSION = 127
MIN_FRAMES = 8
MAX_FRAMES = 80


def error(mensaje: str) -> None:
    raise SystemExit(f"ERROR dataset señas IA: {mensaje}")


def main() -> None:
    if not RUTA.is_file():
        error(f"falta {RUTA}")

    try:
        data = json.loads(RUTA.read_text(encoding="utf-8"))
    except Exception as exc:
        error(f"JSON inválido: {exc}")

    if not isinstance(data, dict):
        error("la raíz debe ser un objeto")
    if data.get("formato") != "lspedia-senas-ia-v2":
        error("formato no reconocido")
    if data.get("version") != 2:
        error("version debe ser 2")
    if data.get("vectorDimension") != DIMENSION:
        error(f"vectorDimension debe ser {DIMENSION}")
    if data.get("framesPorMuestra") != 24:
        error("framesPorMuestra debe ser 24")

    conceptos = data.get("conceptos", [])
    muestras = data.get("muestras", [])
    if not isinstance(conceptos, list):
        error("conceptos debe ser una lista")
    if not isinstance(muestras, list):
        error("muestras debe ser una lista")

    conceptos_limpios: list[str] = []
    vistos_conceptos: set[str] = set()
    for concepto in conceptos:
        if not isinstance(concepto, str) or not concepto.strip():
            error("hay un concepto vacío o no textual")
        limpio = " ".join(concepto.split())
        clave = limpio.casefold()
        if clave in vistos_conceptos:
            error(f"concepto duplicado: {limpio}")
        vistos_conceptos.add(clave)
        conceptos_limpios.append(limpio)

    ids: set[str] = set()
    etiquetas_muestras: set[str] = set()
    for indice, muestra in enumerate(muestras, start=1):
        if not isinstance(muestra, dict):
            error(f"muestra {indice} no es un objeto")

        identificador = str(muestra.get("id", "")).strip()
        etiqueta = str(muestra.get("etiqueta", "")).strip()
        frames = muestra.get("frames")

        if not identificador:
            error(f"muestra {indice} sin id")
        if identificador in ids:
            error(f"id duplicado: {identificador}")
        ids.add(identificador)

        if not etiqueta or len(etiqueta) > 60:
            error(f"muestra {indice} con etiqueta inválida")
        etiquetas_muestras.add(etiqueta.casefold())

        if not isinstance(frames, list) or not MIN_FRAMES <= len(frames) <= MAX_FRAMES:
            error(
                f"muestra {identificador}: frames debe tener entre "
                f"{MIN_FRAMES} y {MAX_FRAMES} elementos"
            )

        for num_frame, vector in enumerate(frames, start=1):
            if not isinstance(vector, list) or len(vector) != DIMENSION:
                error(
                    f"muestra {identificador}, frame {num_frame}: "
                    f"vector debe tener {DIMENSION} valores"
                )
            for valor in vector:
                if isinstance(valor, bool) or not isinstance(valor, (int, float)):
                    error(f"muestra {identificador}: vector contiene un valor no numérico")
                if not math.isfinite(float(valor)) or abs(float(valor)) >= 1000:
                    error(f"muestra {identificador}: vector contiene un valor fuera de rango")

    if conceptos_limpios:
        faltantes = sorted(etiquetas_muestras - {x.casefold() for x in conceptos_limpios})
        if faltantes:
            error("hay etiquetas de muestras ausentes en conceptos: " + ", ".join(faltantes))

    print(
        "Dataset señas IA válido: "
        f"{len(muestras)} muestras, {len(set(etiquetas_muestras) | set(vistos_conceptos))} conceptos."
    )


if __name__ == "__main__":
    main()
