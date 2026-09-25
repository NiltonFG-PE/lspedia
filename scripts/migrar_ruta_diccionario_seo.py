#!/usr/bin/env python3
"""Migra el generador SEO del Diccionario de /palabra/ a /diccionario/.

Es intencionalmente conservador:
- modifica solo patrones exactos conocidos del generador;
- es idempotente;
- elimina la carpeta generada antigua `palabra/` solo si contiene el marcador
  de LSPedia SEO, para no borrar contenido manual por accidente.
"""
from pathlib import Path
import shutil

MARCADOR = ".lspedia-seo-generated"


def reemplazar(ruta: Path, anterior: str, nuevo: str, etiqueta: str, ya_migrado=None) -> bool:
    contenido = ruta.read_text(encoding="utf-8")
    marcadores = tuple(ya_migrado or (nuevo,))
    if anterior not in contenido and any(m in contenido for m in marcadores):
        print(f"{etiqueta}: ya estaba migrado.")
        return False
    cantidad = contenido.count(anterior)
    if cantidad != 1:
        raise SystemExit(
            f"ERROR: se esperaba 1 coincidencia para {etiqueta} y se encontraron {cantidad}. "
            "No se modificó el archivo."
        )
    ruta.write_text(contenido.replace(anterior, nuevo, 1), encoding="utf-8", newline="\n")
    print(f"{etiqueta}: migrado a /diccionario/.")
    return True


def limpiar_ruta_antigua(repo: Path) -> None:
    antigua = repo / "palabra"
    if not antigua.exists():
        print("palabra/: ya no existe.")
        return
    marcador = antigua / MARCADOR
    if not marcador.exists():
        raise SystemExit(
            "ERROR: existe palabra/ pero no tiene el marcador de contenido generado. "
            "No se borró nada."
        )
    shutil.rmtree(antigua)
    print("palabra/: carpeta SEO antigua eliminada de forma segura.")


def main() -> int:
    repo = Path(__file__).resolve().parent.parent
    generador = repo / "scripts" / "generar_paginas_seo.py"

    reemplazar(
        generador,
        "- palabra/<id>/index.html       (Diccionario)",
        "- diccionario/<id>/index.html   (Diccionario)",
        "documentación del generador",
        ya_migrado=("- diccionario/<id>/index.html",),
    )
    reemplazar(
        generador,
        '    raiz = repo / "palabra"',
        '    raiz = repo / "diccionario"',
        "directorio del Diccionario",
    )
    reemplazar(
        generador,
        '        canonical = f"{BASE_URL}/palabra/{quote(ref, safe=\'\')}/"',
        '        canonical = f"{BASE_URL}/diccionario/{quote(ref, safe=\'\')}/"',
        "canonical del Diccionario",
    )

    limpiar_ruta_antigua(repo)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
