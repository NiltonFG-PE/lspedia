#!/usr/bin/env python3
"""Genera data/vocabulario.json desde la Hoja 2 de LSPedia.

La Hoja 2 se publica a través del mismo Google Apps Script que usaba
js/quiz.js. Este script descarga el banco una sola vez durante la
sincronización y deja un JSON estático que Vocabulario y Quiz pueden leer
rápido desde GitHub Pages.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from normalizar_categorias import normalizar_categoria_vocabulario

ROOT = Path(__file__).resolve().parent.parent
DESTINO = ROOT / "data" / "vocabulario.json"
APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw9d7br5C8C4gfk4dJAY6FHRKTKTMI23bNQvO58OQ5TlPe9z5awMWjNIlCLILNLH0t51w/exec"
CALLBACK = "lspediaSyncVocabulario"


def normalizar_nivel(valor):
    original = "" if valor is None else str(valor).strip()
    texto = original.casefold()
    if texto in {"difícil", "dificil"}:
        return "Difícil"
    if texto == "medio":
        return "Medio"
    if texto in {"fácil", "facil"}:
        return "Fácil"
    return original


def descargar() -> list[dict]:
    separador = "&" if "?" in APPS_SCRIPT_URL else "?"
    url = APPS_SCRIPT_URL + separador + urllib.parse.urlencode({"callback": CALLBACK})
    solicitud = urllib.request.Request(
        url,
        headers={
            "User-Agent": "LSPedia-vocabulario-sync/1.0",
            "Accept": "application/javascript, application/json, text/plain, */*",
        },
    )
    with urllib.request.urlopen(solicitud, timeout=30) as respuesta:
        texto = respuesta.read().decode("utf-8-sig").strip()

    if texto.startswith("{"):
        payload = json.loads(texto)
    else:
        patron = re.compile(r"^\s*" + re.escape(CALLBACK) + r"\s*\((.*)\)\s*;?\s*$", re.S)
        coincidencia = patron.match(texto)
        if not coincidencia:
            raise RuntimeError("La respuesta de Apps Script no tiene un formato JSON/JSONP reconocido.")
        payload = json.loads(coincidencia.group(1))

    if not isinstance(payload, dict) or not payload.get("ok"):
        detalle = payload.get("error") if isinstance(payload, dict) else None
        raise RuntimeError(f"Apps Script devolvió un error: {detalle or 'respuesta inválida'}")

    preguntas = payload.get("preguntas")
    if not isinstance(preguntas, list):
        raise RuntimeError("Apps Script no devolvió la lista 'preguntas'.")

    salida = []
    for fila in preguntas:
        if not isinstance(fila, dict):
            continue
        palabra = str(fila.get("palabra") or "").strip()
        video = str(fila.get("video") or "").strip()
        if not palabra or not video:
            continue
        nueva = dict(fila)
        nueva["palabra"] = palabra
        nueva["video"] = video
        if "categoria" in nueva:
            nueva["categoria"] = normalizar_categoria_vocabulario(nueva.get("categoria"))
        if "nivel" in nueva:
            nueva["nivel"] = normalizar_nivel(nueva.get("nivel"))
        salida.append(nueva)

    if not salida:
        raise RuntimeError("La Hoja 2 no devolvió ninguna palabra válida con video. Se conserva el archivo anterior.")
    return salida


def main() -> int:
    try:
        datos = descargar()
        DESTINO.parent.mkdir(parents=True, exist_ok=True)
        temporal = DESTINO.with_suffix(".json.tmp")
        temporal.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
        comprobacion = json.loads(temporal.read_text(encoding="utf-8"))
        if not isinstance(comprobacion, list) or not comprobacion:
            raise RuntimeError("El JSON temporal no pasó la validación.")
        temporal.replace(DESTINO)
        print(f"Vocabulario actualizado: {len(datos)} palabras con video y categorías normalizadas.")
        return 0
    except Exception as exc:
        print(f"ERROR: no se pudo actualizar vocabulario.json: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
