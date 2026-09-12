#!/usr/bin/env python3
"""Genera data/vocabulario.json directamente desde Hoja 2 de Google Sheets.

Vocabulario y Quiz comparten el mismo JSON, pero con reglas distintas:
- Vocabulario puede consultar una palabra aunque todavía no tenga video,
  siempre que la ficha visual ya esté preparada con definición e imagen.
- QuizV2 filtra en el navegador y solo usa filas que sí tienen video.
- Los borradores que solo tienen palabra/categoría permanecen en Google Sheets
  y no se publican todavía en el JSON del sitio.

Así una ficha puede empezar como concepto + imagen y recibir su video en LSP
más adelante sin duplicar la palabra ni romper los juegos.
"""
from __future__ import annotations

import csv
import io
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from normalizar_categorias import normalizar_categoria_vocabulario

ROOT = Path(__file__).resolve().parent.parent
DESTINO = ROOT / "data" / "vocabulario.json"
SPREADSHEET_ID = "1fqC1aUpwdz6l0xRyYYfki7vJtjIql6sOEzpfWElknT0"
HOJA = "Hoja 2"
CAMPOS = (
    "palabra",
    "variantes",
    "video",
    "categoria",
    "nivel",
    "orden",
    "imagen",
    "definicion",
    "fechaPublicacion",
    "ingles",
    "definicionIngles",
)


def texto(valor: object) -> str:
    return "" if valor is None else str(valor).strip()


def normalizar_nivel(valor: object) -> str:
    original = texto(valor)
    bajo = original.casefold()
    if bajo in {"difícil", "dificil"}:
        return "Difícil"
    if bajo == "medio":
        return "Medio"
    if bajo in {"fácil", "facil"}:
        return "Fácil"
    return original


def clave(valor: object) -> str:
    return texto(valor).casefold().replace(" ", "").replace("_", "")


def descargar_csv() -> list[dict[str, str]]:
    base = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/gviz/tq"
    parametros = urllib.parse.urlencode({"tqx": "out:csv", "sheet": HOJA, "headers": "1"})
    solicitud = urllib.request.Request(
        base + "?" + parametros,
        headers={
            "User-Agent": "LSPedia-vocabulario-sync/2.1",
            "Accept": "text/csv,text/plain,*/*",
        },
    )
    with urllib.request.urlopen(solicitud, timeout=35) as respuesta:
        if getattr(respuesta, "status", 200) >= 400:
            raise RuntimeError(f"Google Sheets respondió HTTP {respuesta.status}.")
        crudo = respuesta.read(5_000_001)
        if len(crudo) > 5_000_000:
            raise RuntimeError("Hoja 2 supera el límite de 5 MB.")

    lector = csv.DictReader(io.StringIO(crudo.decode("utf-8-sig")))
    if not lector.fieldnames:
        raise RuntimeError("Hoja 2 no devolvió encabezados.")

    salida: list[dict[str, str]] = []
    for fila in lector:
        if not isinstance(fila, dict):
            continue
        salida.append({texto(k): texto(v) for k, v in fila.items() if k is not None})
    if not salida:
        raise RuntimeError("Hoja 2 no devolvió filas.")
    return salida


def limpiar(filas: list[dict[str, str]]) -> list[dict]:
    salida: list[dict] = []
    vistos: set[tuple[str, str]] = set()
    borradores_omitidos = 0

    for fila in filas:
        mapa = {clave(k): v for k, v in fila.items()}
        palabra = texto(mapa.get("palabra"))
        categoria = texto(mapa.get("categoria"))
        if not palabra or not categoria:
            continue

        video = texto(mapa.get("video"))
        imagen = texto(mapa.get("imagen"))
        definicion = texto(mapa.get("definicion"))

        # Una fila sin video solo se publica cuando la ficha visual está lista:
        # concepto + al menos una imagen. Los borradores vacíos permanecen en
        # Sheets y no llegan todavía al buscador ni a las categorías públicas.
        if not video and not (definicion and imagen):
            borradores_omitidos += 1
            continue

        # En Vocabulario una misma palabra/categoría no debe duplicarse.
        identidad = (palabra.casefold(), categoria.casefold())
        if identidad in vistos:
            continue
        vistos.add(identidad)

        registro = {
            "palabra": palabra,
            "variantes": texto(mapa.get("variantes")),
            "video": video,
            "categoria": normalizar_categoria_vocabulario(categoria),
            "nivel": normalizar_nivel(mapa.get("nivel")),
            "orden": texto(mapa.get("orden")),
            "imagen": imagen,
            "definicion": definicion,
            "fechaPublicacion": texto(mapa.get("fechapublicacion")),
            "ingles": texto(mapa.get("ingles")),
            "definicionIngles": texto(mapa.get("definicioningles")),
        }
        salida.append({campo: registro[campo] for campo in CAMPOS})

    if not salida:
        raise RuntimeError("Hoja 2 no devolvió ninguna palabra preparada para publicar.")
    print(f"Borradores de Vocabulario omitidos por no tener video ni ficha visual completa: {borradores_omitidos}.")
    return salida


def main() -> int:
    temporal = DESTINO.with_suffix(".json.tmp")
    try:
        datos = limpiar(descargar_csv())
        DESTINO.parent.mkdir(parents=True, exist_ok=True)
        temporal.write_text(
            json.dumps(datos, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
            newline="\n",
        )
        comprobacion = json.loads(temporal.read_text(encoding="utf-8"))
        if not isinstance(comprobacion, list) or not comprobacion:
            raise RuntimeError("El JSON temporal no pasó la validación.")
        temporal.replace(DESTINO)
        con_video = sum(1 for p in datos if texto(p.get("video")))
        visuales_sin_video = sum(
            1 for p in datos
            if not texto(p.get("video")) and texto(p.get("definicion")) and texto(p.get("imagen"))
        )
        print(
            f"Vocabulario actualizado: {len(datos)} fichas consultables; "
            f"{con_video} con video para Quiz y {visuales_sin_video} visuales sin video."
        )
        return 0
    except Exception as exc:
        try:
            temporal.unlink(missing_ok=True)
        except Exception:
            pass
        print(f"ERROR: no se pudo actualizar vocabulario.json: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
