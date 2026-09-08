#!/usr/bin/env python3
"""Genera sitemap.xml de LSPedia desde data/palabras.json.

- Conserva la portada y licencia.
- Añade una URL ?p=... por cada palabra no vacía.
- Evita duplicados ignorando mayúsculas/minúsculas y diferencias Unicode equivalentes.
- Mantiene el orden de palabras de palabras.json.
- Solo reescribe sitemap.xml cuando su contenido cambia.
"""
from __future__ import annotations

import json
import sys
import unicodedata
from pathlib import Path
from urllib.parse import quote

BASE_URL = "https://lspedia.site"


def clave_unica(texto: str) -> str:
    return unicodedata.normalize("NFKC", texto).casefold().strip()


def cargar_palabras(ruta: Path) -> list[str]:
    try:
        datos = json.loads(ruta.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise SystemExit(f"ERROR: no existe {ruta}")
    except json.JSONDecodeError as exc:
        raise SystemExit(f"ERROR: {ruta} no contiene JSON válido: {exc}")

    if not isinstance(datos, list):
        raise SystemExit("ERROR: data/palabras.json debe contener una lista de palabras.")

    palabras: list[str] = []
    vistas: set[str] = set()

    for fila in datos:
        if not isinstance(fila, dict):
            continue
        palabra = str(fila.get("palabra", "")).strip()
        if not palabra:
            continue
        clave = clave_unica(palabra)
        if clave in vistas:
            continue
        vistas.add(clave)
        palabras.append(palabra)

    if not palabras:
        raise SystemExit("ERROR: no se encontró ninguna palabra válida en data/palabras.json.")

    return palabras


def bloque_url(loc: str, changefreq: str, priority: str) -> list[str]:
    return [
        "    <url>",
        f"        <loc>{loc}</loc>",
        f"        <changefreq>{changefreq}</changefreq>",
        f"        <priority>{priority}</priority>",
        "    </url>",
    ]


def construir_sitemap(palabras: list[str]) -> str:
    lineas = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    lineas += bloque_url(f"{BASE_URL}/", "weekly", "1.0")
    lineas += bloque_url(f"{BASE_URL}/licencia.html", "yearly", "0.2")

    for palabra in palabras:
        # quote(..., safe="") usa %20 para espacios y codifica tildes/ñ,
        # generando la misma forma de URL que usa LSPedia en ?p=...
        encoded = quote(palabra, safe="")
        lineas += bloque_url(f"{BASE_URL}/?p={encoded}", "monthly", "0.8")

    lineas.append("</urlset>")
    return "\n".join(lineas) + "\n"


def main() -> int:
    repo = Path(__file__).resolve().parent.parent
    json_path = repo / "data" / "palabras.json"
    sitemap_path = repo / "sitemap.xml"

    palabras = cargar_palabras(json_path)
    nuevo = construir_sitemap(palabras)
    anterior = sitemap_path.read_text(encoding="utf-8") if sitemap_path.exists() else ""

    if nuevo == anterior:
        print(f"Sitemap ya estaba actualizado: {len(palabras)} palabras únicas.")
        return 0

    sitemap_path.write_text(nuevo, encoding="utf-8", newline="\n")
    print(f"Sitemap actualizado: {len(palabras)} palabras únicas + portada + licencia.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
