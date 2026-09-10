#!/usr/bin/env python3
"""Genera data/alfabetizacion.json directamente desde Google Sheets.

El navegador NO consulta Google Sheets. Solo GitHub Actions (o este script local)
lee las dos pestañas publicadas del Sheet, valida los campos y publica un JSON
estático de solo lectura. Se usa una lista blanca de campos para evitar publicar
columnas accidentales.

Se dejó de depender del antiguo Apps Script de sincronización porque ese
endpoint puede cambiar o quedar eliminado. La lectura directa del mismo Sheet
reduce un punto de fallo y mantiene Alfabetización sincronizada automáticamente.
"""
from __future__ import annotations

import csv
import io
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DESTINO = ROOT / "data" / "alfabetizacion.json"
SPREADSHEET_ID = "1fqC1aUpwdz6l0xRyYYfki7vJtjIql6sOEzpfWElknT0"
HOJA_ALFABETO = "Alfabetización"
HOJA_EJEMPLOS = "AlfabetizacionEjemplos"

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


def descargar_hoja_csv(nombre_hoja: str) -> list[dict[str, str]]:
    """Descarga una pestaña del Sheet mediante la salida CSV de Google Visualization."""
    base = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/gviz/tq"
    parametros = urllib.parse.urlencode({
        "tqx": "out:csv",
        "sheet": nombre_hoja,
        "headers": "1",
    })
    url = base + "?" + parametros
    solicitud = urllib.request.Request(
        url,
        headers={
            "User-Agent": "LSPedia-alfabetizacion-sync/2.0",
            "Accept": "text/csv,text/plain,*/*",
        },
    )

    with urllib.request.urlopen(solicitud, timeout=35) as respuesta:
        if getattr(respuesta, "status", 200) >= 400:
            raise RuntimeError(
                f"Google Sheets respondió HTTP {respuesta.status} para {nombre_hoja!r}."
            )
        crudo = respuesta.read(2_000_001)
        if len(crudo) > 2_000_000:
            raise RuntimeError(f"La hoja {nombre_hoja!r} supera el límite de 2 MB.")

    contenido = crudo.decode("utf-8-sig")
    lector = csv.DictReader(io.StringIO(contenido))
    if not lector.fieldnames:
        raise RuntimeError(f"La hoja {nombre_hoja!r} no devolvió encabezados.")

    encabezados = {texto(campo) for campo in lector.fieldnames if campo is not None}
    salida: list[dict[str, str]] = []
    for fila in lector:
        if not isinstance(fila, dict):
            continue
        salida.append({texto(k): texto(v) for k, v in fila.items() if k is not None})

    if not salida:
        raise RuntimeError(f"La hoja {nombre_hoja!r} no devolvió filas de datos.")

    print(
        f"Google Sheets: {nombre_hoja} -> {len(salida)} filas; "
        f"columnas: {', '.join(sorted(encabezados))}."
    )
    return salida


def limpiar_alfabeto(filas: object) -> list[dict]:
    if not isinstance(filas, list):
        raise RuntimeError("Google Sheets no devolvió una lista para 'alfabeto'.")

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
        raise RuntimeError("Google Sheets no devolvió una lista para 'ejemplos'.")

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
    filas_alfabeto = descargar_hoja_csv(HOJA_ALFABETO)
    filas_ejemplos = descargar_hoja_csv(HOJA_EJEMPLOS)
    return {
        "ok": True,
        "alfabeto": limpiar_alfabeto(filas_alfabeto),
        "ejemplos": limpiar_ejemplos(filas_ejemplos),
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
