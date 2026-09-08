#!/usr/bin/env python3
"""Genera data/alfabetizacion.json desde el Apps Script de LSPedia.

El navegador NO usa este endpoint. Solo GitHub Actions (o este script local)
consulta Google, valida la respuesta y publica un JSON estático de solo lectura.
Se usa una lista blanca de campos para evitar publicar columnas accidentales.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESTINO = ROOT / "data" / "alfabetizacion.json"
APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw2OCpT7GlBL_UkyUxqD6o-YBmmR5TAzKBywPaVGO9UbdEG4_f2eqrCVpQV6If9IouoDA/exec"
CALLBACK = "lspediaSyncAlfabetizacion"

CAMPOS_ALFABETO = ("tipo", "caracter", "imagenBoca", "trazoVideo")
CAMPOS_EJEMPLOS = ("caracter", "palabra", "imagen", "orden")


def texto(valor: object) -> str:
    return "" if valor is None else str(valor).strip()


def ruta_media(valor: object) -> str:
    """Acepta solo rutas locales de LSPedia o URL http/https."""
    valor = texto(valor)
    if not valor:
        return ""
    if valor.startswith(("img/", "./img/", "/img/", "http://", "https://")):
        return valor
    return ""


def convertir_orden(valor: object) -> int:
    try:
        return int(float(str(valor).strip()))
    except (TypeError, ValueError):
        return 0


def descargar_payload() -> dict:
    separador = "&" if "?" in APPS_SCRIPT_URL else "?"
    parametros = urllib.parse.urlencode({
        "modo": "alfabetizacion",
        "callback": CALLBACK,
    })
    url = APPS_SCRIPT_URL + separador + parametros
    solicitud = urllib.request.Request(
        url,
        headers={
            "User-Agent": "LSPedia-alfabetizacion-sync/1.0",
            "Accept": "application/javascript, application/json, text/plain, */*",
        },
    )
    with urllib.request.urlopen(solicitud, timeout=35) as respuesta:
        if getattr(respuesta, "status", 200) >= 400:
            raise RuntimeError(f"Apps Script respondió HTTP {respuesta.status}.")
        crudo = respuesta.read(2_000_001)
        if len(crudo) > 2_000_000:
            raise RuntimeError("La respuesta de Apps Script supera el límite de 2 MB.")
        contenido = crudo.decode("utf-8-sig").strip()

    if contenido.startswith("{"):
        payload = json.loads(contenido)
    else:
        patron = re.compile(
            r"^\s*" + re.escape(CALLBACK) + r"\s*\((.*)\)\s*;?\s*$",
            re.S,
        )
        coincidencia = patron.match(contenido)
        if not coincidencia:
            raise RuntimeError("La respuesta de Apps Script no tiene un formato JSON/JSONP reconocido.")
        payload = json.loads(coincidencia.group(1))

    if not isinstance(payload, dict) or payload.get("ok") is not True:
        detalle = payload.get("error") if isinstance(payload, dict) else None
        raise RuntimeError(f"Apps Script devolvió un error: {detalle or 'respuesta inválida'}")
    return payload


def limpiar_alfabeto(filas: object) -> list[dict]:
    if not isinstance(filas, list):
        raise RuntimeError("Apps Script no devolvió una lista 'alfabeto'.")

    salida: list[dict] = []
    vistos: set[tuple[str, str]] = set()
    for fila in filas:
        if not isinstance(fila, dict):
            continue
        tipo = texto(fila.get("tipo")).lower()
        caracter = texto(fila.get("caracter"))
        if tipo not in {"letra", "numero"} or not caracter or len(caracter) > 4:
            continue
        clave = (tipo, caracter.casefold())
        if clave in vistos:
            continue
        vistos.add(clave)

        limpio = {
            "tipo": tipo,
            "caracter": caracter,
            "imagenBoca": ruta_media(fila.get("imagenBoca")),
            "trazoVideo": ruta_media(fila.get("trazoVideo")),
        }
        salida.append({campo: limpio[campo] for campo in CAMPOS_ALFABETO})

    if not salida:
        raise RuntimeError("No se recibió ningún carácter válido de Alfabetización.")
    return salida


def limpiar_ejemplos(filas: object) -> list[dict]:
    if filas is None:
        return []
    if not isinstance(filas, list):
        raise RuntimeError("Apps Script no devolvió una lista 'ejemplos'.")

    salida: list[dict] = []
    for fila in filas:
        if not isinstance(fila, dict):
            continue
        caracter = texto(fila.get("caracter"))
        palabra = texto(fila.get("palabra"))
        if not caracter or not palabra:
            continue
        limpio = {
            "caracter": caracter,
            "palabra": palabra,
            "imagen": ruta_media(fila.get("imagen")),
            "orden": convertir_orden(fila.get("orden")),
        }
        salida.append({campo: limpio[campo] for campo in CAMPOS_EJEMPLOS})
    return salida


def generar() -> dict:
    payload = descargar_payload()
    return {
        "ok": True,
        "alfabeto": limpiar_alfabeto(payload.get("alfabeto")),
        "ejemplos": limpiar_ejemplos(payload.get("ejemplos")),
    }


def main() -> int:
    temporal = DESTINO.with_suffix(".json.tmp")
    try:
        datos = generar()
        DESTINO.parent.mkdir(parents=True, exist_ok=True)
        temporal.write_text(
            json.dumps(datos, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
            newline="\n",
        )
        comprobacion = json.loads(temporal.read_text(encoding="utf-8"))
        if not comprobacion.get("ok") or not comprobacion.get("alfabeto"):
            raise RuntimeError("El JSON temporal no pasó la comprobación final.")
        temporal.replace(DESTINO)
        print(
            "Alfabetización actualizada: "
            f"{len(datos['alfabeto'])} caracteres y {len(datos['ejemplos'])} ejemplos."
        )
        return 0
    except Exception as exc:
        try:
            temporal.unlink(missing_ok=True)
        except Exception:
            pass
        print(f"ERROR: no se pudo actualizar alfabetizacion.json: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
