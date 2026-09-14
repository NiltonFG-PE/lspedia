#!/usr/bin/env python3
"""Genera data/traducciones-en.json desde Diccionario de Google Sheets.

La traducción escrita en la hoja es la fuente de verdad para el contenido
nuevo. Publicador.gs rellena `ingles` y `definicionIngles` automáticamente.
Este generador mantiene GitHub sincronizado y sirve también para reconstruir
el banco completo sin tocar el español canónico.

Solo genera traducciones de fichas consultables del Diccionario: registros que
tienen video, definición o imagen. Los borradores que solo tienen palabra y
categoría permanecen fuera hasta que tengan contenido educativo.
"""
from __future__ import annotations

import csv
import datetime as dt
import io
import json
import urllib.parse
import urllib.request
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESTINO = ROOT / "data" / "traducciones-en.json"
SPREADSHEET_ID = "1fqC1aUpwdz6l0xRyYYfki7vJtjIql6sOEzpfWElknT0"
HOJA = "Diccionario"


def texto(valor: object) -> str:
    return "" if valor is None else str(valor).strip()


def clave(valor: object) -> str:
    base = texto(valor).casefold()
    base = "".join(
        c for c in unicodedata.normalize("NFD", base)
        if unicodedata.category(c) != "Mn"
    )
    return "".join(c for c in base if c.isalnum())


def descargar_csv() -> list[dict[str, str]]:
    base = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/gviz/tq"
    query = urllib.parse.urlencode({"tqx": "out:csv", "sheet": HOJA, "headers": "1"})
    solicitud = urllib.request.Request(
        base + "?" + query,
        headers={
            "User-Agent": "LSPedia-traducciones-en/1.0",
            "Accept": "text/csv,text/plain,*/*",
        },
    )
    with urllib.request.urlopen(solicitud, timeout=35) as respuesta:
        crudo = respuesta.read(8_000_001)
        if len(crudo) > 8_000_000:
            raise RuntimeError("Diccionario supera el límite de 8 MB para traducciones.")

    lector = csv.DictReader(io.StringIO(crudo.decode("utf-8-sig")))
    if not lector.fieldnames:
        raise RuntimeError("Diccionario no devolvió encabezados.")

    filas: list[dict[str, str]] = []
    for fila in lector:
        if not isinstance(fila, dict):
            continue
        filas.append({texto(k): texto(v) for k, v in fila.items() if k is not None})
    return filas


def cargar_anterior() -> dict:
    if not DESTINO.exists():
        return {"version": 1, "actualizado": "", "traducciones": []}
    try:
        dato = json.loads(DESTINO.read_text(encoding="utf-8"))
        return dato if isinstance(dato, dict) else {"version": 1, "actualizado": "", "traducciones": []}
    except Exception:
        return {"version": 1, "actualizado": "", "traducciones": []}


def generar(filas: list[dict[str, str]], anterior: dict) -> list[dict]:
    aliases_previos: dict[tuple[str, str], list[str]] = {}
    for item in anterior.get("traducciones", []):
        if not isinstance(item, dict):
            continue
        if clave(item.get("fuente")) not in {"", "diccionario"}:
            continue
        aliases = item.get("aliases")
        aliases_previos[(clave(item.get("palabra")), clave(item.get("categoria")))] = (
            [texto(x) for x in aliases if texto(x)] if isinstance(aliases, list) else []
        )

    salida: list[dict] = []
    vistos: set[tuple[str, str]] = set()

    for fila in filas:
        mapa = {clave(k): v for k, v in fila.items()}
        palabra = texto(mapa.get("palabra"))
        categoria = texto(mapa.get("categoria"))
        definicion = texto(mapa.get("definicion"))
        video = texto(mapa.get("video"))
        imagen = texto(mapa.get("imagen"))
        ingles = texto(mapa.get("ingles"))
        definicion_ingles = texto(mapa.get("definicioningles"))

        if not palabra or not categoria or not ingles:
            continue
        if ingles.startswith("#") or definicion_ingles.startswith("#"):
            continue
        if not (video or definicion or imagen):
            continue

        identidad = (clave(palabra), clave(categoria))
        if identidad in vistos:
            continue
        vistos.add(identidad)

        salida.append({
            "fuente": "diccionario",
            "palabra": palabra,
            "categoria": categoria,
            "ingles": ingles,
            "aliases": aliases_previos.get(identidad, []),
            "definicionIngles": definicion_ingles,
        })

    salida.sort(key=lambda x: (texto(x["palabra"]).casefold(), texto(x["categoria"]).casefold()))
    return salida


def main() -> int:
    anterior = cargar_anterior()
    traducciones = generar(descargar_csv(), anterior)
    if not traducciones:
        raise RuntimeError("No se generó ninguna traducción consultable del Diccionario.")

    anteriores = anterior.get("traducciones") if isinstance(anterior.get("traducciones"), list) else []
    cambiado = traducciones != anteriores
    actualizado = texto(anterior.get("actualizado"))
    if cambiado or not actualizado:
        actualizado = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")

    documento = {
        "version": 1,
        "actualizado": actualizado,
        "traducciones": traducciones,
    }
    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    DESTINO.write_text(
        json.dumps(documento, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    print(f"Traducciones EN: {len(traducciones)} fichas del Diccionario sincronizadas.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
