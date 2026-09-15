#!/usr/bin/env python3
"""Genera data/vocabulario.json directamente desde Vocabulario de Google Sheets.

Regla pública vigente de LSPedia:
- Vocabulario público requiere palabra + categoría + imagen real.
- El video es opcional para aparecer en Vocabulario.
- QuizV2 lee el mismo JSON, pero filtra internamente solo las filas con video
  porque algunas actividades del Quiz sí lo necesitan.

Esto separa deliberadamente dos conceptos que antes estaban mezclados:
publicación pública de Vocabulario y disponibilidad para Quiz.

Las columnas de definición, video, nivel, orden y traducción acompañan la ficha
cuando existen, pero no cambian la regla pública por imagen.

La sincronización conserva explícitamente ``definicion`` y
``fechaPublicacion``. Los errores de fórmula de Google Sheets (por ejemplo
``#N/A``) nunca se publican como si fueran una fecha real: se convierten a
cadena vacía hasta que exista una fecha válida en la hoja.
"""
from __future__ import annotations

import csv
import io
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from normalizar_categorias import normalizar_categoria_vocabulario

ROOT = Path(__file__).resolve().parent.parent
DESTINO = ROOT / "data" / "vocabulario.json"
SPREADSHEET_ID = "1fqC1aUpwdz6l0xRyYYfki7vJtjIql6sOEzpfWElknT0"
HOJA = "Vocabulario"
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

PREFIJO_IMAGEN_RE = re.compile(r"^(?:https?://|/|\.\.?/|img/)", re.I)
EXTENSION_IMAGEN_RE = re.compile(
    r"\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$",
    re.I,
)


def texto(valor: object) -> str:
    return "" if valor is None else str(valor).strip()


def imagen_real(valor: object) -> bool:
    """Replica la regla pública del frontend para la imagen principal."""
    principal = texto(valor).split(",", 1)[0].strip()
    return bool(
        principal
        and PREFIJO_IMAGEN_RE.search(principal)
        and EXTENSION_IMAGEN_RE.search(principal)
    )


def normalizar_fecha_publicacion(valor: object) -> str:
    """Conserva la fecha visible del Sheet y descarta errores de fórmula."""
    fecha = texto(valor)
    if not fecha or fecha.startswith("#"):
        return ""
    return fecha


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
            "User-Agent": "LSPedia-vocabulario-sync/3.0",
            "Accept": "text/csv,text/plain,*/*",
        },
    )
    with urllib.request.urlopen(solicitud, timeout=35) as respuesta:
        if getattr(respuesta, "status", 200) >= 400:
            raise RuntimeError(f"Google Sheets respondió HTTP {respuesta.status}.")
        crudo = respuesta.read(5_000_001)
        if len(crudo) > 5_000_000:
            raise RuntimeError("Vocabulario supera el límite de 5 MB.")

    lector = csv.DictReader(io.StringIO(crudo.decode("utf-8-sig")))
    if not lector.fieldnames:
        raise RuntimeError("Vocabulario no devolvió encabezados.")

    salida: list[dict[str, str]] = []
    for fila in lector:
        if not isinstance(fila, dict):
            continue
        salida.append({texto(k): texto(v) for k, v in fila.items() if k is not None})
    if not salida:
        raise RuntimeError("Vocabulario no devolvió filas.")
    return salida


def limpiar(filas: list[dict[str, str]]) -> list[dict]:
    salida: list[dict] = []
    vistos: set[tuple[str, str]] = set()
    omitidos_campos_base = 0
    omitidos_sin_imagen = 0
    duplicados_omitidos = 0
    con_video = 0
    sin_video = 0
    con_definicion = 0
    con_fecha_publicacion = 0

    for fila in filas:
        mapa = {clave(k): v for k, v in fila.items()}
        palabra = texto(mapa.get("palabra"))
        categoria = texto(mapa.get("categoria"))
        imagen = texto(mapa.get("imagen"))

        if not palabra or not categoria:
            omitidos_campos_base += 1
            continue

        # Regla pública de Vocabulario: la imagen real es obligatoria.
        if not imagen_real(imagen):
            omitidos_sin_imagen += 1
            continue

        # En Vocabulario una misma palabra/categoría no debe duplicarse.
        identidad = (palabra.casefold(), categoria.casefold())
        if identidad in vistos:
            duplicados_omitidos += 1
            continue
        vistos.add(identidad)

        video = texto(mapa.get("video"))
        definicion = texto(mapa.get("definicion"))
        fecha_publicacion = normalizar_fecha_publicacion(mapa.get("fechapublicacion"))

        if video:
            con_video += 1
        else:
            sin_video += 1
        if definicion:
            con_definicion += 1
        if fecha_publicacion:
            con_fecha_publicacion += 1

        registro = {
            "palabra": palabra,
            "variantes": texto(mapa.get("variantes")),
            "video": video,
            "categoria": normalizar_categoria_vocabulario(categoria),
            "nivel": normalizar_nivel(mapa.get("nivel")),
            "orden": texto(mapa.get("orden")),
            "imagen": imagen,
            "definicion": definicion,
            "fechaPublicacion": fecha_publicacion,
            "ingles": texto(mapa.get("ingles")),
            "definicionIngles": texto(mapa.get("definicioningles")),
        }
        salida.append({campo: registro[campo] for campo in CAMPOS})

    if not salida:
        raise RuntimeError(
            "Vocabulario no devolvió ninguna ficha pública con palabra + categoría + imagen real."
        )

    print(
        "Vocabulario omitido: "
        f"campos base={omitidos_campos_base}; "
        f"sin imagen real={omitidos_sin_imagen}; "
        f"duplicados palabra/categoría={duplicados_omitidos}."
    )
    print(
        "Vocabulario público: "
        f"{len(salida)} fichas; {con_video} con video; {sin_video} sin video; "
        f"{con_definicion} con definición; "
        f"{con_fecha_publicacion} con fechaPublicacion."
    )
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
        print(
            f"Vocabulario actualizado: {len(datos)} fichas públicas por imagen. "
            "Quiz filtrará internamente las que tengan video."
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
