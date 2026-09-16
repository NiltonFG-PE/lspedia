#!/usr/bin/env python3
"""Genera sitemap.xml de LSPedia desde las fuentes públicas reales.

Reglas vigentes:
- Diccionario: palabra + definición + categoría + imagen real.
- Vocabulario: palabra + categoría + imagen real; video opcional.
- Conserva portada y licencia.
- Diccionario usa páginas SEO /palabra/<id>/.
- Vocabulario usa páginas SEO /vocabulario/<id>/.
- Solo reescribe sitemap.xml cuando su contenido cambia.
"""
from __future__ import annotations

from html import escape as xml_escape
import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.parse import quote

BASE_URL = "https://lspedia.site"
IMAGEN_RE = re.compile(r"\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$", re.I)
PREFIJO_RE = re.compile(r"^(?:https?://|/|\.\.?/|img/)", re.I)


def texto(valor: object) -> str:
    return str(valor or "").strip()


def slug(texto_entrada: str) -> str:
    normalizado = unicodedata.normalize("NFKD", texto(texto_entrada))
    ascii_texto = "".join(c for c in normalizado if not unicodedata.combining(c))
    ascii_texto = ascii_texto.casefold()
    ascii_texto = re.sub(r"[^a-z0-9]+", "-", ascii_texto)
    return ascii_texto.strip("-")


def imagen_real(valor: object) -> bool:
    principal = texto(valor).split(",", 1)[0].strip()
    return bool(principal and PREFIJO_RE.search(principal) and IMAGEN_RE.search(principal))


def cargar_lista(ruta: Path, nombre: str) -> list[dict]:
    try:
        datos = json.loads(ruta.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise SystemExit(f"ERROR: no existe {ruta}")
    except json.JSONDecodeError as exc:
        raise SystemExit(f"ERROR: {ruta} no contiene JSON válido: {exc}")

    if not isinstance(datos, list):
        raise SystemExit(f"ERROR: {nombre} debe contener una lista JSON.")
    return [fila for fila in datos if isinstance(fila, dict)]


def publicable_diccionario(fila: dict) -> bool:
    return bool(
        texto(fila.get("palabra"))
        and texto(fila.get("definicion"))
        and texto(fila.get("categoria"))
        and imagen_real(fila.get("imagen"))
    )


def publicable_vocabulario(fila: dict) -> bool:
    return bool(
        texto(fila.get("palabra"))
        and texto(fila.get("categoria"))
        and imagen_real(fila.get("imagen"))
    )


def referencias_diccionario(filas: list[dict]) -> list[str]:
    referencias: list[str] = []
    vistas: set[str] = set()
    for fila in filas:
        if not publicable_diccionario(fila):
            continue
        referencia = slug(texto(fila.get("id")) or texto(fila.get("palabra")))
        if not referencia:
            continue
        if referencia in vistas:
            raise SystemExit(f"ERROR: referencia pública duplicada en Diccionario: {referencia}")
        vistas.add(referencia)
        referencias.append(referencia)
    return referencias


def referencias_vocabulario(filas: list[dict]) -> list[str]:
    referencias: list[str] = []
    vistas: set[str] = set()
    for fila in filas:
        if not publicable_vocabulario(fila):
            continue
        referencia = slug(texto(fila.get("id")))
        if not referencia:
            base = slug(texto(fila.get("palabra"))) or "palabra"
            categoria = slug(texto(fila.get("categoria")))
            referencia = f"{base}-{categoria}" if categoria else base
        if referencia in vistas:
            raise SystemExit(f"ERROR: referencia pública duplicada en Vocabulario: {referencia}")
        vistas.add(referencia)
        referencias.append(referencia)
    return referencias


def bloque_url(loc: str, changefreq: str, priority: str) -> list[str]:
    loc_xml = xml_escape(loc, quote=False)
    return [
        "    <url>",
        f"        <loc>{loc_xml}</loc>",
        f"        <changefreq>{changefreq}</changefreq>",
        f"        <priority>{priority}</priority>",
        "    </url>",
    ]


def construir_sitemap(diccionario: list[str], vocabulario: list[str]) -> str:
    lineas = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    lineas += bloque_url(f"{BASE_URL}/", "weekly", "1.0")
    lineas += bloque_url(f"{BASE_URL}/licencia.html", "yearly", "0.2")

    for referencia in diccionario:
        encoded = quote(referencia, safe="")
        lineas += bloque_url(f"{BASE_URL}/palabra/{encoded}/", "monthly", "0.8")

    for referencia in vocabulario:
        encoded = quote(referencia, safe="")
        lineas += bloque_url(f"{BASE_URL}/vocabulario/{encoded}/", "monthly", "0.8")

    lineas.append("</urlset>")
    return "\n".join(lineas) + "\n"


def main() -> int:
    repo = Path(__file__).resolve().parent.parent
    diccionario = cargar_lista(repo / "data" / "palabras.json", "data/palabras.json")
    vocabulario = cargar_lista(repo / "data" / "vocabulario.json", "data/vocabulario.json")
    refs_dic = referencias_diccionario(diccionario)
    refs_voc = referencias_vocabulario(vocabulario)

    if not refs_dic and not refs_voc:
        raise SystemExit("ERROR: no se encontró contenido público para el sitemap.")

    sitemap_path = repo / "sitemap.xml"
    nuevo = construir_sitemap(refs_dic, refs_voc)
    anterior = sitemap_path.read_text(encoding="utf-8") if sitemap_path.exists() else ""

    if nuevo == anterior:
        print(
            "Sitemap SEO ya estaba actualizado: "
            f"Diccionario={len(refs_dic)} · Vocabulario={len(refs_voc)}."
        )
        return 0

    sitemap_path.write_text(nuevo, encoding="utf-8", newline="\n")
    print(
        "Sitemap SEO actualizado: "
        f"Diccionario={len(refs_dic)} · Vocabulario={len(refs_voc)} · portada + licencia."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
