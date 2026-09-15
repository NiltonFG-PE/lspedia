#!/usr/bin/env python3
"""Audita contenido pendiente sin modificar datos.

La salida distingue los motivos editoriales que importan en LSPedia:

Diccionario
- falta definición
- falta imagen real
- falta video (la ficha puede seguir siendo pública si lo demás está completo)

Vocabulario
- falta imagen real (no público)
- falta video (puede ser público, pero no sirve para Quiz/Lo nuevo)

El script es informativo: nunca borra, rellena ni publica contenido por sí solo.
"""
from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMAGEN_RE = re.compile(r"\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$", re.I)
PREFIJO_RE = re.compile(r"^(?:https?://|/|\.\.?/|img/)", re.I)


def texto(valor: object) -> str:
    return str(valor or "").strip()


def imagen_real(valor: object) -> bool:
    principal = texto(valor).split(",", 1)[0].strip()
    return bool(principal and PREFIJO_RE.search(principal) and IMAGEN_RE.search(principal))


def cargar(nombre: str) -> list[dict]:
    ruta = ROOT / "data" / nombre
    datos = json.loads(ruta.read_text(encoding="utf-8"))
    if not isinstance(datos, list):
        raise RuntimeError(f"{nombre} debe contener una lista JSON")
    return [x for x in datos if isinstance(x, dict)]


def etiqueta(item: dict, indice: int) -> str:
    palabra = texto(item.get("palabra")) or "(sin palabra)"
    categoria = texto(item.get("categoria")) or "(sin categoría)"
    return f"#{indice} {palabra} · {categoria}"


def auditar_diccionario(datos: list[dict]) -> Counter:
    conteo = Counter()
    ejemplos: dict[str, list[str]] = {
        "falta_definicion": [],
        "falta_imagen": [],
        "falta_video": [],
        "publica_sin_video": [],
    }

    for i, item in enumerate(datos, 1):
        palabra = texto(item.get("palabra"))
        categoria = texto(item.get("categoria"))
        definicion = texto(item.get("definicion"))
        imagen = imagen_real(item.get("imagen"))
        video = texto(item.get("video"))

        if not definicion:
            conteo["falta_definicion"] += 1
            if len(ejemplos["falta_definicion"]) < 12:
                ejemplos["falta_definicion"].append(etiqueta(item, i))
        if not imagen:
            conteo["falta_imagen"] += 1
            if len(ejemplos["falta_imagen"]) < 12:
                ejemplos["falta_imagen"].append(etiqueta(item, i))
        if not video:
            conteo["falta_video"] += 1
            if len(ejemplos["falta_video"]) < 12:
                ejemplos["falta_video"].append(etiqueta(item, i))

        publica = bool(palabra and categoria and definicion and imagen)
        if publica:
            conteo["publicas"] += 1
            if not video:
                conteo["publica_sin_video"] += 1
                if len(ejemplos["publica_sin_video"]) < 12:
                    ejemplos["publica_sin_video"].append(etiqueta(item, i))

    print("\nDICCIONARIO")
    print(
        f"  registros={len(datos)} · públicas={conteo['publicas']} · "
        f"falta definición={conteo['falta_definicion']} · "
        f"falta imagen={conteo['falta_imagen']} · "
        f"falta video={conteo['falta_video']} · "
        f"públicas sin video={conteo['publica_sin_video']}"
    )
    for clave, titulo in (
        ("falta_definicion", "Ejemplos sin definición"),
        ("falta_imagen", "Ejemplos sin imagen real"),
        ("falta_video", "Ejemplos sin video"),
    ):
        if ejemplos[clave]:
            print(f"  {titulo}: " + " | ".join(ejemplos[clave]))
    return conteo


def auditar_vocabulario(datos: list[dict]) -> Counter:
    conteo = Counter()
    ejemplos: dict[str, list[str]] = {
        "falta_imagen": [],
        "falta_video": [],
        "publica_sin_video": [],
    }

    for i, item in enumerate(datos, 1):
        palabra = texto(item.get("palabra"))
        categoria = texto(item.get("categoria"))
        imagen = imagen_real(item.get("imagen"))
        video = texto(item.get("video"))

        if not imagen:
            conteo["falta_imagen"] += 1
            if len(ejemplos["falta_imagen"]) < 12:
                ejemplos["falta_imagen"].append(etiqueta(item, i))
        if not video:
            conteo["falta_video"] += 1
            if len(ejemplos["falta_video"]) < 12:
                ejemplos["falta_video"].append(etiqueta(item, i))

        publica = bool(palabra and categoria and imagen)
        if publica:
            conteo["publicas"] += 1
            if not video:
                conteo["publica_sin_video"] += 1
                if len(ejemplos["publica_sin_video"]) < 12:
                    ejemplos["publica_sin_video"].append(etiqueta(item, i))

    print("\nVOCABULARIO")
    print(
        f"  registros={len(datos)} · públicas={conteo['publicas']} · "
        f"falta imagen={conteo['falta_imagen']} · "
        f"falta video={conteo['falta_video']} · "
        f"públicas sin video={conteo['publica_sin_video']}"
    )
    for clave, titulo in (
        ("falta_imagen", "Ejemplos sin imagen real"),
        ("falta_video", "Ejemplos sin video"),
    ):
        if ejemplos[clave]:
            print(f"  {titulo}: " + " | ".join(ejemplos[clave]))
    return conteo


def main() -> int:
    dic = cargar("palabras.json")
    voc = cargar("vocabulario.json")
    d = auditar_diccionario(dic)
    v = auditar_vocabulario(voc)

    print("\nRESUMEN")
    print(
        "  pendientes críticos para publicación: "
        f"Diccionario sin definición={d['falta_definicion']}, "
        f"Diccionario sin imagen={d['falta_imagen']}, "
        f"Vocabulario sin imagen={v['falta_imagen']}."
    )
    print(
        "  pendientes de video (no bloquean publicación pública): "
        f"Diccionario={d['falta_video']}, Vocabulario={v['falta_video']}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
