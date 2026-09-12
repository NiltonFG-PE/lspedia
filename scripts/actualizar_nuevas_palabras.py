#!/usr/bin/env python3
"""Genera data/nuevas-palabras.json con palabras realmente publicadas.

Prioridad para decidir la fecha de publicación:
1. ``fechaPublicacion`` guardada por el Publicador, aceptando también variantes
   de mayúsculas/minúsculas como ``fechapublicacion`` provenientes de Sheets.
2. Fecha en que se agregó a Git la ilustración local de la palabra.
3. Historial antiguo: commit en que la palabra pasó a tener video.

La segunda y tercera reglas solo existen como compatibilidad para contenido
publicado antes de que LSPedia empezara a guardar ``fechaPublicacion``.
"""
from __future__ import annotations

import datetime as dt
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import unquote
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "palabras.json"
DESTINO = ROOT / "data" / "nuevas-palabras.json"
MAX_COMMITS = 160
MAX_ITEMS = 12

try:
    ZONA_LIMA = ZoneInfo("America/Lima")
except Exception:  # pragma: no cover - respaldo para entornos sin tzdata
    ZONA_LIMA = dt.timezone(dt.timedelta(hours=-5))


def normal(v: object) -> str:
    return str(v or "").strip().casefold()


def valor_fecha_publicacion(item: dict) -> object:
    """Obtiene fechaPublicacion sin depender de mayúsculas/minúsculas."""
    for nombre, valor in item.items():
        if str(nombre).strip().casefold() == "fechapublicacion":
            return valor
    return None


def cargar_texto_git(spec: str) -> list[dict]:
    try:
        r = subprocess.run(
            ["git", "show", spec],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=True,
        )
        data = json.loads(r.stdout)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def clave(item: dict) -> str:
    ident = str(item.get("id") or "").strip()
    return "id:" + ident if ident else "p:" + normal(item.get("palabra"))


def publicable(item: dict | None) -> bool:
    if not isinstance(item, dict):
        return False
    return bool(
        str(item.get("palabra") or "").strip()
        and str(item.get("video") or "").strip()
    )


def mapa(items: list[dict]) -> dict[str, dict]:
    return {
        clave(x): x
        for x in items
        if isinstance(x, dict) and x.get("palabra")
    }


def parsear_fecha(valor: object) -> dt.datetime | None:
    """Convierte fechas ISO o formatos habituales de Google Sheets."""
    texto = str(valor or "").strip()
    if not texto:
        return None

    candidato = texto[:-1] + "+00:00" if texto.endswith("Z") else texto
    try:
        fecha = dt.datetime.fromisoformat(candidato)
        if fecha.tzinfo is None:
            fecha = fecha.replace(tzinfo=ZONA_LIMA)
        return fecha
    except ValueError:
        pass

    # Ej.: Thu Sep 10 2026 22:15:00 GMT-0500 (Peru Standard Time)
    js = re.sub(r"\s*\([^)]*\)\s*$", "", texto)
    try:
        return dt.datetime.strptime(
            js,
            "%a %b %d %Y %H:%M:%S GMT%z",
        )
    except ValueError:
        pass

    formatos = (
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
    )
    for formato in formatos:
        try:
            return dt.datetime.strptime(texto, formato).replace(tzinfo=ZONA_LIMA)
        except ValueError:
            continue

    return None


def fecha_iso_utc(fecha: dt.datetime) -> str:
    if fecha.tzinfo is None:
        fecha = fecha.replace(tzinfo=ZONA_LIMA)
    return (
        fecha.astimezone(dt.timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def ruta_imagen_local(item: dict) -> str:
    """Devuelve la ruta Git real de una imagen local ``img/...``."""
    valor = str(item.get("imagen") or "").split(",", 1)[0].strip()
    if not valor:
        return ""

    # En palabras antiguas la hoja puede guardar la URL codificada para web,
    # por ejemplo ``img/diccionario/de%20nada.webp`` o acentos como %C3%B3.
    # Git, en cambio, conserva el nombre real con espacios/Unicode.
    valor = unquote(valor).replace("\\", "/")
    while valor.startswith("./"):
        valor = valor[2:]
    valor = valor.lstrip("/")

    if valor.startswith("img/"):
        return valor
    return ""


def fechas_archivos_agregados() -> dict[str, dt.datetime]:
    """Obtiene en una sola llamada Git la fecha de alta de imágenes locales."""
    r = subprocess.run(
        [
            "git",
            "log",
            "--format=@@%cI",
            "--diff-filter=A",
            "--name-only",
            "--",
            "img",
        ],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    fechas: dict[str, dt.datetime] = {}
    fecha_actual: dt.datetime | None = None

    # git log viene de más reciente a más antiguo. setdefault conserva la
    # incorporación más reciente si un archivo fue borrado y agregado otra vez.
    for linea in r.stdout.splitlines():
        linea = linea.strip()
        if not linea:
            continue
        if linea.startswith("@@"):
            fecha_actual = parsear_fecha(linea[2:])
            continue
        if fecha_actual is not None:
            fechas.setdefault(linea.replace("\\", "/"), fecha_actual)

    return fechas


def fechas_publicacion_historial(
    por_clave: dict[str, dict],
) -> dict[str, dt.datetime]:
    """Respaldo antiguo: detecta cuándo un registro pasó a tener video."""
    log = subprocess.run(
        [
            "git",
            "log",
            f"-n{MAX_COMMITS}",
            "--format=%H|%cI",
            "--",
            "data/palabras.json",
        ],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    ).stdout.splitlines()

    detectadas: dict[str, dt.datetime] = {}
    for linea in log:
        if "|" not in linea:
            continue

        sha, fecha_texto = linea.split("|", 1)
        fecha = parsear_fecha(fecha_texto)
        if fecha is None:
            continue

        ahora = mapa(cargar_texto_git(f"{sha}:data/palabras.json"))
        antes = mapa(cargar_texto_git(f"{sha}^:data/palabras.json"))

        for k in por_clave:
            if k in detectadas:
                continue
            if publicable(ahora.get(k)) and not publicable(antes.get(k)):
                detectadas[k] = fecha

    return detectadas


def main() -> int:
    actual = json.loads(DATA.read_text(encoding="utf-8"))
    if not isinstance(actual, list):
        raise SystemExit("palabras.json debe ser una lista")

    por_clave = {
        k: x
        for k, x in mapa(actual).items()
        if publicable(x)
    }

    fechas_imagen = fechas_archivos_agregados()
    fechas_historial = fechas_publicacion_historial(por_clave)

    candidatos: list[tuple[dt.datetime, dict]] = []

    for k, item in por_clave.items():
        fecha = parsear_fecha(valor_fecha_publicacion(item))
        origen = "fechaPublicacion"

        if fecha is None:
            ruta_imagen = ruta_imagen_local(item)
            fecha = fechas_imagen.get(ruta_imagen) if ruta_imagen else None
            origen = "imagen-git"

        if fecha is None:
            fecha = fechas_historial.get(k)
            origen = "historial-publicacion-video"

        if fecha is None:
            continue

        candidatos.append(
            (
                fecha,
                {
                    "id": str(item.get("id") or "").strip(),
                    "palabra": str(item.get("palabra") or "").strip(),
                    "categoria": str(item.get("categoria") or "").strip(),
                    "imagen": str(item.get("imagen") or "").strip(),
                    "fecha": fecha_iso_utc(fecha),
                    "origenFecha": origen,
                },
            )
        )

    candidatos.sort(key=lambda par: par[0], reverse=True)
    items = [registro for _fecha, registro in candidatos[:MAX_ITEMS]]

    salida = {
        "generadoEn": fecha_iso_utc(dt.datetime.now(dt.timezone.utc)),
        "metodo": "fechaPublicacion-con-respaldo-imagen-git-e-historial",
        "items": items,
    }

    DESTINO.write_text(
        json.dumps(salida, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )

    fuentes: dict[str, int] = {}
    for item in items:
        origen = item.get("origenFecha", "desconocido")
        fuentes[origen] = fuentes.get(origen, 0) + 1

    resumen = ", ".join(f"{k}: {v}" for k, v in sorted(fuentes.items()))
    print(
        f"✅ Nuevas palabras publicadas: {len(items)} elemento(s)."
        + (f" Fuentes: {resumen}." if resumen else "")
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
