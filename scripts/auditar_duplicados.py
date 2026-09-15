#!/usr/bin/env python3
"""Auditoría editorial de duplicados en Diccionario y Vocabulario.

Por defecto es informativa y no modifica datos. Distingue:
- exactos: registros completamente idénticos;
- misma palabra + misma categoría con campos distintos: requieren decidir cuál
  conservar o si representan sentidos distintos;
- misma palabra en categorías distintas: posible polisemia/uso contextual;
- coincidencias entre Diccionario y Vocabulario: no son errores por sí mismas,
  pero conviene conocerlas porque ambas secciones son independientes.

Con --fix-exact elimina únicamente copias completamente idénticas dentro de
cada archivo y conserva la primera aparición. Nunca fusiona ni decide entre
registros diferentes y nunca elimina una coincidencia entre secciones.
"""
from __future__ import annotations

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


def agrupar_palabra(lista):
    grupos = defaultdict(list)
    for i, item in enumerate(lista):
        if not isinstance(item, dict):
            continue
        k = clave(item.get("palabra"))
        if k:
            grupos[k].append((i, item))
    return {k: v for k, v in grupos.items() if len(v) > 1}


def agrupar_palabra_categoria(lista):
    grupos = defaultdict(list)
    for i, item in enumerate(lista):
        if not isinstance(item, dict):
            continue
        kp = clave(item.get("palabra"))
        kc = clave(item.get("categoria"))
        if kp:
            grupos[(kp, kc)].append((i, item))
    return {k: v for k, v in grupos.items() if len(v) > 1}


def clasificar(lista):
    por_palabra = agrupar_palabra(lista)
    por_palabra_categoria = agrupar_palabra_categoria(lista)

    exactos_extra = 0
    grupos_misma_categoria_editorial = 0
    registros_misma_categoria_editorial = 0

    for items in por_palabra_categoria.values():
        por_firma = defaultdict(list)
        for idx, item in items:
            por_firma[firma(item)].append((idx, item))
        exactos_extra += sum(max(0, len(v) - 1) for v in por_firma.values())
        if len(por_firma) > 1:
            grupos_misma_categoria_editorial += 1
            registros_misma_categoria_editorial += len(items)

    grupos_multicategoria = 0
    for items in por_palabra.values():
        categorias = {clave(item.get("categoria")) for _, item in items}
        if len(categorias) > 1:
            grupos_multicategoria += 1

    return {
        "por_palabra": por_palabra,
        "por_palabra_categoria": por_palabra_categoria,
        "exactos_extra": exactos_extra,
        "grupos_misma_categoria_editorial": grupos_misma_categoria_editorial,
        "registros_misma_categoria_editorial": registros_misma_categoria_editorial,
        "grupos_multicategoria": grupos_multicategoria,
    }


def detalle_item(idx, item):
    return (
        f"#{idx + 1} id={texto(item.get('id')) or '—'} "
        f"definición={'sí' if texto(item.get('definicion')) else 'no'} "
        f"imagen={'sí' if texto(item.get('imagen')) else 'no'} "
        f"video={'sí' if texto(item.get('video')) else 'no'} "
        f"categoría={texto(item.get('categoria')) or '—'}"
    )


def describir(nombre, lista):
    info = clasificar(lista)
    por_palabra = info["por_palabra"]
    por_pc = info["por_palabra_categoria"]

    extras_palabra = sum(len(v) - 1 for v in por_palabra.values())
    print(
        f"{nombre}: {len(por_palabra)} palabra(s) repetida(s) · "
        f"{extras_palabra} registro(s) extra por nombre · "
        f"{info['exactos_extra']} copia(s) exacta(s) segura(s) · "
        f"{info['grupos_misma_categoria_editorial']} grupo(s) misma palabra/categoría con diferencias · "
        f"{info['grupos_multicategoria']} palabra(s) usadas en varias categorías"
    )

    # Prioridad: misma palabra + misma categoría, porque es el caso con mayor
    # probabilidad de duplicado editorial real.
    ordenados = sorted(
        por_pc.items(),
        key=lambda kv: (-len(kv[1]), kv[0][0], kv[0][1]),
    )
    for (_kp, _kc), items in ordenados[:30]:
        firmas = {firma(item) for _, item in items}
        tipo = "EXACTO" if len(firmas) == 1 else "MISMA-CATEGORÍA"
        print(
            f"  - [{tipo}] {texto(items[0][1].get('palabra'))} / "
            f"{texto(items[0][1].get('categoria')) or '—'} ({len(items)}): "
            + " | ".join(detalle_item(idx, item) for idx, item in items)
        )
    if len(ordenados) > 30:
        print(f"  … y {len(ordenados) - 30} grupo(s) palabra/categoría más.")

    return {
        "grupos_palabra": len(por_palabra),
        "extras_palabra": extras_palabra,
        "exactos_extra": info["exactos_extra"],
        "grupos_editoriales": info["grupos_misma_categoria_editorial"],
        "registros_editoriales": info["registros_misma_categoria_editorial"],
        "grupos_multicategoria": info["grupos_multicategoria"],
    }


def describir_coincidencias_entre_secciones(dic, voc):
    indice_dic = defaultdict(list)
    indice_voc = defaultdict(list)
    for i, item in enumerate(dic):
        if isinstance(item, dict) and clave(item.get("palabra")):
            indice_dic[clave(item.get("palabra"))].append((i, item))
    for i, item in enumerate(voc):
        if isinstance(item, dict) and clave(item.get("palabra")):
            indice_voc[clave(item.get("palabra"))].append((i, item))

    comunes = sorted(set(indice_dic) & set(indice_voc))
    print(
        f"Coincidencias entre secciones: {len(comunes)} palabra(s) aparecen tanto en "
        "Diccionario como en Vocabulario. No se consideran duplicados automáticos."
    )
    for k in comunes[:20]:
        d = indice_dic[k]
        v = indice_voc[k]
        nombre = texto(d[0][1].get("palabra")) or texto(v[0][1].get("palabra"))
        cats_d = sorted({texto(x.get("categoria")) or "—" for _, x in d})
        cats_v = sorted({texto(x.get("categoria")) or "—" for _, x in v})
        print(
            f"  - [ENTRE-SECCIONES] {nombre}: "
            f"Diccionario={', '.join(cats_d)} · Vocabulario={', '.join(cats_v)}"
        )
    if len(comunes) > 20:
        print(f"  … y {len(comunes) - 20} coincidencia(s) más.")
    return len(comunes)


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
    comunes = describir_coincidencias_entre_secciones(dic, voc)

    print(
        "TOTAL: "
        f"{r1['grupos_palabra'] + r2['grupos_palabra']} clave(s) repetida(s) dentro de una sección · "
        f"{r1['exactos_extra'] + r2['exactos_extra']} copia(s) exacta(s) segura(s) · "
        f"{r1['grupos_editoriales'] + r2['grupos_editoriales']} grupo(s) misma palabra/categoría que requieren criterio editorial · "
        f"{r1['grupos_multicategoria'] + r2['grupos_multicategoria']} grupo(s) multicategoría · "
        f"{comunes} coincidencia(s) entre secciones."
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
        "Los registros con cualquier diferencia y las coincidencias entre secciones quedaron intactos."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
