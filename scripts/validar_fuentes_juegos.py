#!/usr/bin/env python3
"""Protege las fuentes de contenido de los juegos de LSPedia.

Reglas:
- banco compartido: solo Vocabulario + Alfabetización.
- nunca data/palabras.json (Diccionario).
- Alfabetización usa el banco compartido y no el banco interno de QuizV2.
- Quiz puede conservar su propio banco para su mecánica de video.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


def leer(ruta):
    return (ROOT / ruta).read_text(encoding="utf-8")


def main():
    try:
        banco = leer("js/juegos-banco-compartido.js")
        alf = leer("js/alfabetizacion.js")
        cargador = leer("js/mejoras-producto.js")

        for requerido in (
            "data/vocabulario.json",
            "data/alfabetizacion.json",
            "obtenerCargado",
            "fuente: 'vocabulario'",
            "fuente: 'alfabetizacion'",
        ):
            if requerido not in banco:
                raise AssertionError(f"Banco compartido incompleto: falta {requerido}")

        if "data/palabras.json" in banco:
            raise AssertionError("El banco de Juegos intenta usar imágenes del Diccionario")

        if "LSPediaJuegosBanco.obtenerCargado" not in alf:
            raise AssertionError("Alfabetización no consume el banco compartido")
        if "QuizV2.obtenerBanco" in alf:
            raise AssertionError("Alfabetización volvió a depender directamente del banco interno del Quiz")
        if "window.obtenerBancoHoja2" not in alf:
            raise AssertionError("Falta el respaldo al getter público de Vocabulario")

        if "js/juegos-banco-compartido.js" not in cargador:
            raise AssertionError("El cargador de producto dejó de cargar el banco compartido")

        print("Fuentes de Juegos válidas: Vocabulario + Alfabetización; Diccionario excluido; Quiz desacoplado.")
        return 0
    except Exception as exc:
        print(f"ERROR fuentes de Juegos: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
