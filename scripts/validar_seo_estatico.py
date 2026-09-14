#!/usr/bin/env python3
"""Valida las señales SEO que deben existir antes de ejecutar JavaScript dinámico."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    errores: list[str] = []
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    seo = (ROOT / "js" / "seo-institucional.js").read_text(encoding="utf-8")
    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    sw = (ROOT / "sw.js").read_text(encoding="utf-8")

    h1 = '<span class="titulo-acento">Diccionario visual</span> de español con apoyo en Lengua de Señas Peruana (LSP)'
    requeridos_index = [
        '<title>LSPedia - Diccionario visual de español con apoyo en Lengua de Señas Peruana</title>',
        'rel="canonical" href="https://lspedia.site/"',
        h1,
        'const esVocabulario = fuente === "vocabulario";',
        'https://lspedia.site/?vista=vocabulario&p=',
        '&fuente=vocabulario',
        '"@type": "WebSite"',
        '"@type": "SearchAction"',
    ]
    for patron in requeridos_index:
        if patron not in index:
            errores.append(f"index.html: falta {patron!r}")

    if 'Diccionario</span> de Lengua de Señas Peruana (LSP) y Español' in index:
        errores.append("index.html: reapareció el H1 institucional histórico")

    if "Diccionario visual de español con apoyo en Lengua de Señas Peruana (LSP)" not in seo:
        errores.append("seo-institucional.js: H1 dinámico no coincide con el institucional")

    if "Sitemap: https://lspedia.site/sitemap.xml" not in robots:
        errores.append("robots.txt: no declara el sitemap oficial")

    if 'const VERSION_APP = "v128";' not in sw:
        errores.append("sw.js: se esperaba al menos la versión PWA v128 tras corregir index.html")

    if errores:
        for error in errores:
            print("ERROR SEO estático:", error, file=sys.stderr)
        return 1

    print("SEO estático validado: H1, canonical por fuente, metadatos, robots y PWA coherentes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
