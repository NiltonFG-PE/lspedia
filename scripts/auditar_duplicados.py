#!/usr/bin/env python3
"""Auditoría de duplicados en Diccionario y Vocabulario.

Por defecto es informativa y no modifica datos.
Clasifica dos casos:
- exactos: registros completamente idénticos; pueden retirarse sin decisión editorial.
- editoriales: misma palabra normalizada pero campos distintos; requieren revisión humana.

Con --fix-exact elimina únicamente copias completamente idénticas y conserva la
primera aparición. Nunca fusiona ni decide entre registros distintos.
"""
from collections import defaultdict
from pathlib import Path
import argparse
import json
import unicodedata

ROOT = Path(__file__).resolve().parents[1]


def texto(v):
    return str(v or "").strip()


def clave(v):
    s = unicodedata.normalize("NFD", texto(v).casefold())
    return " ".join("".join(ch for ch in s if unicodedata.category(ch) != "Mn").split())


def firma(item):
    return json.dumps(item, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def cargar(nombre):
    path = ROOT / "data" / nombre
    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, list):
        raise SystemExit(f"{nombre} no contiene una lista JSON")
    return path, data


def guardar(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def agrupar(lista):
    grupos = defaultdict(list)
    for i, item in enumerate(lista):
        if not isinstance(item, dict):
            continue
        k = clave(item.get("palabra"))
        if k:
            grupos[k].append((i, item))
    return {k: v for k, v in grupos.items() if len(v) > 1}


def clasificar(lista):
    dups = agrupar(lista)
    exactos_extra = 0
    grupos_editoriales = 0
    registros_editoriales = 0

    for items in dups.values():
        por_firma = defaultdict(list)
        for idx, item in items:
            por_firma[firma(item)].append((idx, item))

        exactos_extra += sum(max(0, len(v) - 1) for v in por_firma.values())
        if len(por_firma) > 1:
            grupos_editoriales += 1
            registros_editoriales += len(items)

    return dups, exactos_extra, grupos_editoriales, registros_editoriales


def describir(nombre, lista):
    dups, exactos_extra, grupos_editoriales, registros_editoriales = clasificar(lista)
    repetidos = sum(len(v) - 1 for v in dups.values())
    print(
        f"{nombre}: {len(dups)} palabras duplicadas · {repetidos} registros extra · "
        f"{exactos_extra} copias exactas seguras · {grupos_editoriales} grupos editoriales"
    )

    for _k, items in sorted(dups.items(), key=lambda kv: (-len(kv[1]), kv[0]))[:30]:
        firmas = {firma(item) for _, item in items}
        tipo = "EXACTO" if len(firmas) == 1 else "EDITORIAL"
        detalles = []
        for idx, item in items:
            detalles.append(
                f"#{idx + 1} id={texto(item.get('id')) or '—'} "
                f"definición={'sí' if texto(item.get('definicion')) else 'no'} "
                f"imagen={'sí' if texto(item.get('imagen')) else 'no'} "
                f"video={'sí' if texto(item.get('video')) else 'no'} "
                f"categoría={texto(item.get('categoria')) or '—'}"
            )
        print(f"  - [{tipo}] {texto(items[0][1].get('palabra'))} ({len(items)}): " + " | ".join(detalles))

    if len(dups) > 30:
        print(f"  … y {len(dups) - 30} grupos más.")

    return {
        "grupos": len(dups),
        "extras": repetidos,
        "exactos_extra": exactos_extra,
        "grupos_editoriales": grupos_editoriales,
        "registros_editoriales": registros_editoriales,
    }


def quitar_exactos(lista):
    vistos = set()
    salida = []
    eliminados = 0
    for item in lista:
        if not isinstance(item, dict):
            salida.append(item)
            continue
        f = firma(item)
        if f in vistos:
            eliminados += 1
            continue
        vistos.add(f)
        salida.append(item)
    return salida, eliminados


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--fix-exact",
        action="store_true",
        help="elimina solo registros completamente idénticos; nunca fusiona variantes editoriales",
    )
    args = parser.parse_args()

    path_dic, dic = cargar("palabras.json")
    path_voc, voc = cargar("vocabulario.json")

    r1 = describir("Diccionario", dic)
    r2 = describir("Vocabulario", voc)

    print(
        "TOTAL: "
        f"{r1['grupos'] + r2['grupos']} claves duplicadas · "
        f"{r1['extras'] + r2['extras']} registros extra · "
        f"{r1['exactos_extra'] + r2['exactos_extra']} copias exactas seguras · "
        f"{r1['grupos_editoriales'] + r2['grupos_editoriales']} grupos que requieren criterio editorial."
    )

    if not args.fix_exact:
        print("Auditoría informativa: no se eliminó ningún registro.")
        return 0

    dic_limpio, eliminados_dic = quitar_exactos(dic)
    voc_limpio, eliminados_voc = quitar_exactos(voc)

    if eliminados_dic:
        guardar(path_dic, dic_limpio)
    if eliminados_voc:
        guardar(path_voc, voc_limpio)

    print(
        "Limpieza exacta: "
        f"Diccionario={eliminados_dic} · Vocabulario={eliminados_voc}. "
        "Los duplicados con diferencias quedaron intactos."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
