#!/usr/bin/env python3
"""Auditoría informativa de duplicados en Diccionario y Vocabulario.

No modifica datos ni falla el CI por duplicados históricos. Su objetivo es
hacer visible la deuda editorial sin decidir automáticamente qué ficha conservar.
"""
from collections import defaultdict
from pathlib import Path
import json
import unicodedata

ROOT = Path(__file__).resolve().parents[1]


def texto(v):
    return str(v or "").strip()


def clave(v):
    s = unicodedata.normalize("NFD", texto(v).casefold())
    return " ".join("".join(ch for ch in s if unicodedata.category(ch) != "Mn").split())


def cargar(nombre):
    with (ROOT / "data" / nombre).open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, list):
        raise SystemExit(f"{nombre} no contiene una lista JSON")
    return data


def agrupar(lista):
    grupos = defaultdict(list)
    for i, item in enumerate(lista):
        if not isinstance(item, dict):
            continue
        k = clave(item.get("palabra"))
        if k:
            grupos[k].append((i, item))
    return {k: v for k, v in grupos.items() if len(v) > 1}


def describir(nombre, lista):
    dups = agrupar(lista)
    repetidos = sum(len(v) - 1 for v in dups.values())
    print(f"{nombre}: {len(dups)} palabras duplicadas · {repetidos} registros repetidos adicionales")
    for k, items in sorted(dups.items(), key=lambda kv: (-len(kv[1]), kv[0]))[:30]:
        detalles = []
        for idx, item in items:
            detalles.append(
                f"#{idx + 1} id={texto(item.get('id')) or '—'} "
                f"imagen={'sí' if texto(item.get('imagen')) else 'no'} "
                f"video={'sí' if texto(item.get('video')) else 'no'} "
                f"categoría={texto(item.get('categoria')) or '—'}"
            )
        print(f"  - {texto(items[0][1].get('palabra'))} ({len(items)}): " + " | ".join(detalles))
    if len(dups) > 30:
        print(f"  … y {len(dups) - 30} grupos más.")
    return len(dups), repetidos


def main():
    dic = cargar("palabras.json")
    voc = cargar("vocabulario.json")
    d1, r1 = describir("Diccionario", dic)
    d2, r2 = describir("Vocabulario", voc)
    print(f"TOTAL: {d1 + d2} claves duplicadas · {r1 + r2} registros extra.")
    print("Auditoría informativa: no se eliminó ningún registro automáticamente.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
