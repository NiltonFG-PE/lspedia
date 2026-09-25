#!/usr/bin/env python3
"""Comprueba que sitemap.xml refleje exactamente el contenido público de LSPedia."""
from pathlib import Path
import sys

from generar_sitemap import (
    cargar_lista,
    referencias_diccionario,
    referencias_vocabulario,
    construir_sitemap,
)

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    diccionario = cargar_lista(ROOT / "data" / "palabras.json", "data/palabras.json")
    vocabulario = cargar_lista(ROOT / "data" / "vocabulario.json", "data/vocabulario.json")
    refs_dic = referencias_diccionario(diccionario)
    refs_voc = referencias_vocabulario(vocabulario)
    esperado = construir_sitemap(refs_dic, refs_voc)

    ruta = ROOT / "sitemap.xml"
    if not ruta.is_file():
        print("ERROR sitemap público: falta sitemap.xml", file=sys.stderr)
        return 1
    actual = ruta.read_text(encoding="utf-8")
    if actual != esperado:
        print(
            "ERROR sitemap público: sitemap.xml no coincide con la regla pública. "
            "Ejecuta python scripts/generar_sitemap.py.",
            file=sys.stderr,
        )
        return 1

    # Un sitemap correcto no basta: cada URL debe tener su página real.
    for carpeta, refs in (("diccionario", refs_dic), ("vocabulario", refs_voc)):
        for ref in refs:
            pagina = ROOT / carpeta / ref / "index.html"
            canonical = f'https://lspedia.site/{carpeta}/{ref}/'
            if not pagina.is_file() or f'rel="canonical" href="{canonical}"' not in pagina.read_text(encoding="utf-8"):
                print(f"ERROR sitemap público: falta página o canonical coherente: {carpeta}/{ref}/", file=sys.stderr)
                return 1

    total = 2 + len(refs_dic) + len(refs_voc)
    print(
        "Sitemap público validado: "
        f"Diccionario={len(refs_dic)} · Vocabulario={len(refs_voc)} · total URLs={total}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
