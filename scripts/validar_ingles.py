#!/usr/bin/env python3
"""Valida cobertura mínima de la experiencia inglesa de LSPedia."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PALABRAS = ROOT / "data" / "palabras.json"
VOCABULARIO = ROOT / "data" / "vocabulario.json"


def texto(valor: object) -> str:
    return "" if valor is None else str(valor).strip()


def cargar(ruta: Path) -> list[dict]:
    datos = json.loads(ruta.read_text(encoding="utf-8"))
    if not isinstance(datos, list):
        raise SystemExit(f"ERROR EN: {ruta.relative_to(ROOT)} debe contener una lista.")
    return [x for x in datos if isinstance(x, dict)]


def publicable_diccionario(item: dict) -> bool:
    return bool(
        texto(item.get("palabra"))
        and texto(item.get("categoria"))
        and (
            texto(item.get("video"))
            or texto(item.get("definicion"))
            or texto(item.get("imagen"))
        )
    )


def validar() -> int:
    diccionario = [x for x in cargar(PALABRAS) if publicable_diccionario(x)]
    vocabulario = cargar(VOCABULARIO)

    faltantes_dic = [
        f"{texto(x.get('palabra'))} [{texto(x.get('categoria'))}]"
        for x in diccionario
        if not texto(x.get("ingles")) or texto(x.get("ingles")).startswith("#")
    ]
    faltantes_voc = [
        f"{texto(x.get('palabra'))} [{texto(x.get('categoria'))}]"
        for x in vocabulario
        if not texto(x.get("ingles")) or texto(x.get("ingles")).startswith("#")
    ]

    if faltantes_dic or faltantes_voc:
        if faltantes_dic:
            print("ERROR EN: faltan traducciones del Diccionario:")
            for item in faltantes_dic[:30]:
                print(" -", item)
        if faltantes_voc:
            print("ERROR EN: faltan traducciones de Vocabulario:")
            for item in faltantes_voc[:30]:
                print(" -", item)
        return 1

    print(
        f"OK EN: Diccionario={len(diccionario)}/{len(diccionario)} · "
        f"Vocabulario={len(vocabulario)}/{len(vocabulario)} con término inglés."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(validar())
