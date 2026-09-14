#!/usr/bin/env python3
"""Valida que las cargas críticas del frontend usen la capa de red resiliente."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


def leer(ruta: str) -> str:
    path = ROOT / ruta
    if not path.is_file():
        raise SystemExit(f"ERROR red segura: falta {ruta}")
    return path.read_text(encoding="utf-8")


def exigir(contenido: str, patrones: list[str], ruta: str, errores: list[str]) -> None:
    for patron in patrones:
        if patron not in contenido:
            errores.append(f"{ruta}: falta patrón requerido {patron!r}")


def prohibir(contenido: str, patrones: list[str], ruta: str, errores: list[str]) -> None:
    for patron in patrones:
        if patron in contenido:
            errores.append(f"{ruta}: patrón antiguo/no permitido {patron!r}")


def main() -> int:
    errores: list[str] = []
    core = leer("js/lspedia-core.js")
    vocab = leer("js/vocabulario-publico.js")
    juegos = leer("js/juegos-banco-compartido.js")

    exigir(core, [
        "async function fetchConTimeout",
        "async function leerJsonSeguro",
        "LSPediaTimeoutError",
        "reintentos",
        "fetchConTimeout: fetchConTimeout",
        "leerJsonSeguro: leerJsonSeguro",
    ], "js/lspedia-core.js", errores)

    exigir(vocab, [
        "core.leerJsonSeguro",
        "timeoutMs: 6500",
        "reintentos: 1",
        "cache: 'no-store'",
    ], "js/vocabulario-publico.js", errores)

    exigir(juegos, [
        "c.leerJsonSeguro",
        "Promise.allSettled",
        "timeoutMs: 6500",
        "reintentos: 1",
        "No fue posible cargar ninguna fuente del banco de Juegos",
    ], "js/juegos-banco-compartido.js", errores)

    prohibir(juegos, ["data/palabras.json", "QuizV2.obtenerBanco"], "js/juegos-banco-compartido.js", errores)

    if errores:
        for error in errores:
            print("ERROR:", error, file=sys.stderr)
        return 1

    print("Red segura validada: timeout/reintento central y degradación parcial de Juegos activas.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
