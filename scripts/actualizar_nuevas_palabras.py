#!/usr/bin/env python3
"""Genera data/nuevas-palabras.json con lo último publicado en LSPedia.

Incluye contenido de Diccionario y Vocabulario, ordenado por fecha real de
publicación. Se conservan respaldos históricos para contenido anterior al
Publicador actual.

Prioridad para decidir la fecha:
1. ``fechaPublicacion`` (también acepta ``fechapublicacion`` de Sheets).
2. Fecha en que se agregó a Git la ilustración local.
3. Historial del archivo de datos: commit en que el registro pasó a tener video.
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
DICCIONARIO = ROOT / "data" / "palabras.json"
VOCABULARIO = ROOT / "data" / "vocabulario.json"
DESTINO = ROOT / "data" / "nuevas-palabras.json"
MAX_COMMITS = 160
MAX_ITEMS = 12

try:
    ZONA_LIMA = ZoneInfo("America/Lima")
except Exception:  # pragma: no cover
    ZONA_LIMA = dt.timezone(dt.timedelta(hours=-5))


def normal(v: object) -> str:
    return str(v or "").strip().casefold()


def valor_fecha_publicacion(item: dict) -> object:
    """Obtiene fechaPublicacion sin depender de mayúsculas/minúsculas."""
    for nombre, valor in item.items():
        if str(nombre).strip().casefold() == "fechapublicacion":
            return valor
    return None


def cargar_archivo(ruta: Path) -> list[dict]:
    data = json.loads(ruta.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise SystemExit(f"{ruta.name} debe ser una lista")
    return [x for x in data if isinstance(x, dict)]


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
    if ident:
        return "id:" + ident
    palabra = normal(item.get("palabra"))
    categoria = normal(item.get("categoria"))
    return "p:" + palabra + "|c:" + categoria


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


def buscar_registro_historial(items: list[dict], referencia: dict) -> dict | None:
    """Encuentra el mismo registro aunque un ID haya cambiado."""
    ident = normal(referencia.get("id"))
    if ident:
        por_id = [
            x for x in items
            if isinstance(x, dict) and normal(x.get("id")) == ident
        ]
        if len(por_id) == 1:
            return por_id[0]

    palabra = normal(referencia.get("palabra"))
    categoria = normal(referencia.get("categoria"))
    if not palabra:
        return None

    por_palabra = [
        x for x in items
        if isinstance(x, dict) and normal(x.get("palabra")) == palabra
    ]
    if len(por_palabra) == 1:
        return por_palabra[0]

    if categoria:
        por_categoria = [
            x for x in por_palabra if normal(x.get("categoria")) == categoria
        ]
        if len(por_categoria) == 1:
            return por_categoria[0]

    video = normal(referencia.get("video"))
    if video:
        por_video = [x for x in por_palabra if normal(x.get("video")) == video]
        if len(por_video) == 1:
            return por_video[0]

    return None


def parsear_fecha(valor: object) -> dt.datetime | None:
    """Convierte ISO o formatos habituales de Google Sheets."""
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

    js = re.sub(r"\s*\([^)]*\)\s*$", "", texto)
    try:
        return dt.datetime.strptime(js, "%a %b %d %Y %H:%M:%S GMT%z")
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
    valor = str(item.get("imagen") or "").split(",", 1)[0].strip()
    if not valor:
        return ""
    valor = unquote(valor).replace("\\", "/")
    while valor.startswith("./"):
        valor = valor[2:]
    valor = valor.lstrip("/")
    return valor if valor.startswith("img/") else ""


def fechas_archivos_agregados() -> dict[str, dt.datetime]:
    r = subprocess.run(
        [
            "git", "log", "--format=@@%cI", "--diff-filter=A",
            "--name-only", "--", "img",
        ],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )

    fechas: dict[str, dt.datetime] = {}
    fecha_actual: dt.datetime | None = None
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
    ruta_relativa: str,
) -> dict[str, dt.datetime]:
    """Detecta históricamente cuándo cada registro pasó a tener video."""
    log = subprocess.run(
        [
            "git", "log", f"-n{MAX_COMMITS}", "--format=%H|%cI",
            "--", ruta_relativa,
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

        ahora_items = cargar_texto_git(f"{sha}:{ruta_relativa}")
        antes_items = cargar_texto_git(f"{sha}^:{ruta_relativa}")

        for k, referencia in por_clave.items():
            if k in detectadas:
                continue
            ahora = buscar_registro_historial(ahora_items, referencia)
            antes = buscar_registro_historial(antes_items, referencia)
            if publicable(ahora) and not publicable(antes):
                detectadas[k] = fecha
    return detectadas


def candidatos_fuente(
    items: list[dict],
    fuente: str,
    ruta_relativa: str,
    fechas_imagen: dict[str, dt.datetime],
) -> list[tuple[dt.datetime, dict]]:
    por_clave = {
        k: x for k, x in mapa(items).items() if publicable(x)
    }
    fechas_historial = fechas_publicacion_historial(por_clave, ruta_relativa)
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
                    "fuente": fuente,
                },
            )
        )
    return candidatos


def main() -> int:
    diccionario = cargar_archivo(DICCIONARIO)
    vocabulario = cargar_archivo(VOCABULARIO)
    fechas_imagen = fechas_archivos_agregados()

    candidatos = candidatos_fuente(
        diccionario, "diccionario", "data/palabras.json", fechas_imagen
    )
    candidatos.extend(
        candidatos_fuente(
            vocabulario, "vocabulario", "data/vocabulario.json", fechas_imagen
        )
    )

    candidatos.sort(key=lambda par: par[0], reverse=True)
    items = [registro for _fecha, registro in candidatos[:MAX_ITEMS]]

    salida = {
        "generadoEn": fecha_iso_utc(dt.datetime.now(dt.timezone.utc)),
        "metodo": "fechaPublicacion-mixto-con-respaldo-imagen-git-e-historial",
        "maxItems": MAX_ITEMS,
        "diasEtiquetaNuevo": 14,
        "items": items,
    }

    DESTINO.write_text(
        json.dumps(salida, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )

    conteo_fuente: dict[str, int] = {}
    conteo_origen: dict[str, int] = {}
    for item in items:
        fuente = item.get("fuente", "desconocida")
        origen = item.get("origenFecha", "desconocido")
        conteo_fuente[fuente] = conteo_fuente.get(fuente, 0) + 1
        conteo_origen[origen] = conteo_origen.get(origen, 0) + 1

    fuentes = ", ".join(f"{k}: {v}" for k, v in sorted(conteo_fuente.items()))
    origenes = ", ".join(f"{k}: {v}" for k, v in sorted(conteo_origen.items()))
    print(
        f"✅ Lo nuevo: {len(items)} elemento(s). Fuentes: {fuentes}. Fechas: {origenes}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())