#!/usr/bin/env python3
"""Genera sitemap.xml de LSPedia desde data/palabras.json.

- Conserva la portada y licencia.
- Añade una URL ?p=<id> por cada registro válido.
- Usa IDs únicos y estables cuando están disponibles.
- Mantiene compatibilidad temporal con datos antiguos sin `id`.
- Solo reescribe sitemap.xml cuando su contenido cambia.
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import quote

BASE_URL = "https://lspedia.site"


def slug(texto: str) -> str:
    normalizado = unicodedata.normalize("NFKD", str(texto or ""))
    ascii_texto = "".join(c for c in normalizado if not unicodedata.combining(c))
    ascii_texto = ascii_texto.casefold()
    ascii_texto = re.sub(r"[^a-z0-9]+", "-", ascii_texto)
    return ascii_texto.strip("-")


def cargar_referencias(ruta: Path) -> list[str]:
    try:
        datos = json.loads(ruta.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise SystemExit(f"ERROR: no existe {ruta}")
    except json.JSONDecodeError as exc:
        raise SystemExit(f"ERROR: {ruta} no contiene JSON válido: {exc}")

    if not isinstance(datos, list):
        raise SystemExit("ERROR: data/palabras.json debe contener una lista de palabras.")

    referencias: list[str] = []
    vistas: set[str] = set()

    for fila in datos:
        if not isinstance(fila, dict):
            continue

        palabra = str(fila.get("palabra", "")).strip()
        if not palabra:
            continue

        referencia = str(fila.get("id", "")).strip() or slug(palabra)
        if not referencia:
            continue

        if referencia in vistas:
            raise SystemExit(
                f"ERROR: referencia duplicada en sitemap: {referencia}. "
                "Ejecuta primero scripts/migrar_ids_palabras.py."
            )

        vistas.add(referencia)
        referencias.append(referencia)

    if not referencias:
        raise SystemExit("ERROR: no se encontró ninguna palabra válida en data/palabras.json.")

    return referencias


def bloque_url(loc: str, changefreq: str, priority: str) -> list[str]:
    return [
        "    <url>",
        f"        <loc>{loc}</loc>",
        f"        <changefreq>{changefreq}</changefreq>",
        f"        <priority>{priority}</priority>",
        "    </url>",
    ]


def construir_sitemap(referencias: list[str]) -> str:
    lineas = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    lineas += bloque_url(f"{BASE_URL}/", "weekly", "1.0")
    lineas += bloque_url(f"{BASE_URL}/licencia.html", "yearly", "0.2")

    for referencia in referencias:
        encoded = quote(referencia, safe="")
        lineas += bloque_url(f"{BASE_URL}/?p={encoded}", "monthly", "0.8")

    lineas.append("</urlset>")
    return "\n".join(lineas) + "\n"


def main() -> int:
    repo = Path(__file__).resolve().parent.parent
    json_path = repo / "data" / "palabras.json"
    sitemap_path = repo / "sitemap.xml"

    referencias = cargar_referencias(json_path)
    nuevo = construir_sitemap(referencias)
    anterior = sitemap_path.read_text(encoding="utf-8") if sitemap_path.exists() else ""

    if nuevo == anterior:
        print(f"Sitemap ya estaba actualizado: {len(referencias)} URLs de palabras.")
        return 0

    sitemap_path.write_text(nuevo, encoding="utf-8", newline="\n")
    print(f"Sitemap actualizado: {len(referencias)} palabras + portada + licencia.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
