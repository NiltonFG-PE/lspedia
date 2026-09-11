#!/usr/bin/env python3
"""Validador automático de LSPedia.

Revisa Diccionario y Vocabulario como fuentes independientes. Los errores
estructurales hacen fallar la validación; las advertencias se muestran para
revisión pero no bloquean una actualización válida.

En el Diccionario puede haber borradores todavía sin video. Esos registros se
revisan, pero no cuentan como contenido publicable y sus duplicados de borrador
no bloquean el sitio. Una palabra con video sí se valida con reglas más estrictas.

Las categorías históricas siguen usando sus listas canónicas. Una categoría
nueva también es válida si tiene el icono WEBP que crea el Publicador en
``img/categorias/<slug>.webp``. Así se pueden ampliar categorías sin editar
este archivo cada vez, pero un nombre nuevo sin icono continúa bloqueándose.

Uso:
    python scripts/validar_lspedia.py
    python scripts/validar_lspedia.py --fuente diccionario
    python scripts/validar_lspedia.py --fuente vocabulario
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from normalizar_categorias import CATEGORIAS_DICCIONARIO, CATEGORIAS_VOCABULARIO

ROOT = Path(__file__).resolve().parent.parent
DICCIONARIO = ROOT / "data" / "palabras.json"
VOCABULARIO = ROOT / "data" / "vocabulario.json"
CARPETA_ICONOS_CATEGORIA = ROOT / "img" / "categorias"

NIVELES_VOCABULARIO = {"Fácil", "Medio", "Difícil"}
PATRON_ID = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
PATRON_YOUTUBE_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")


class Informe:
    def __init__(self) -> None:
        self.errores: list[str] = []
        self.advertencias: list[str] = []
        self.info: list[str] = []

    def error(self, mensaje: str) -> None:
        self.errores.append(mensaje)

    def aviso(self, mensaje: str) -> None:
        self.advertencias.append(mensaje)

    def dato(self, mensaje: str) -> None:
        self.info.append(mensaje)


def _texto(valor: object) -> str:
    return " ".join(("" if valor is None else str(valor)).strip().split())


def _clave(valor: object) -> str:
    texto = _texto(valor).casefold()
    return "".join(
        c for c in unicodedata.normalize("NFD", texto)
        if unicodedata.category(c) != "Mn"
    )


def _slug_categoria(valor: object) -> str:
    """Replica el slug que usa Publicador.gs para nombres de categorías."""
    texto = _clave(valor)
    texto = re.sub(r"[^a-z0-9]+", "-", texto)
    return texto.strip("-")


def _ruta_icono_categoria(valor: object) -> Path | None:
    slug = _slug_categoria(valor)
    if not slug:
        return None
    return CARPETA_ICONOS_CATEGORIA / f"{slug}.webp"


def _categoria_nueva_valida(valor: object) -> bool:
    ruta = _ruta_icono_categoria(valor)
    return bool(ruta and ruta.is_file())


def _cargar(ruta: Path, nombre: str, informe: Informe) -> list[dict]:
    if not ruta.exists():
        informe.error(f"{nombre}: no existe {ruta.relative_to(ROOT)}")
        return []
    try:
        datos = json.loads(ruta.read_text(encoding="utf-8"))
    except Exception as exc:
        informe.error(f"{nombre}: JSON inválido: {exc}")
        return []
    if not isinstance(datos, list):
        informe.error(f"{nombre}: el archivo debe contener una lista JSON.")
        return []
    salida: list[dict] = []
    for indice, fila in enumerate(datos, 1):
        if not isinstance(fila, dict):
            informe.error(f"{nombre} #{indice}: el registro no es un objeto JSON.")
            continue
        salida.append(fila)
    return salida


def _youtube_id(valor: object) -> str | None:
    texto = _texto(valor)
    if not texto:
        return None
    if PATRON_YOUTUBE_ID.fullmatch(texto):
        return texto
    try:
        u = urlparse(texto)
    except Exception:
        return None
    host = (u.netloc or "").lower().split(":")[0]
    path = u.path.strip("/")
    candidato = ""
    if host in {"youtu.be", "www.youtu.be"}:
        candidato = path.split("/")[0] if path else ""
    elif host.endswith("youtube.com"):
        if path == "watch":
            candidato = (parse_qs(u.query).get("v") or [""])[0]
        elif path.startswith(("embed/", "shorts/", "live/")):
            partes = path.split("/")
            candidato = partes[1] if len(partes) > 1 else ""
    return candidato if PATRON_YOUTUBE_ID.fullmatch(candidato) else None


def _revisar_campos_extranos(nombre: str, filas: list[dict], informe: Informe) -> None:
    """Avisa solo si una columna sin nombre contiene un valor real.

    palabras.json conserva actualmente una columna vacía heredada del origen de
    datos. Si la celda también está vacía es inocua y no genera ruido. Si alguien
    pega texto accidentalmente en esa columna, sí se muestra la advertencia.
    """
    sospechosos = []
    for i, fila in enumerate(filas, 1):
        for campo, valor in fila.items():
            if not _texto(campo) and _texto(valor):
                sospechosos.append((i, _texto(valor)))
    if sospechosos:
        ejemplos = "; ".join(
            f"#{i}={valor[:70]!r}" for i, valor in sospechosos[:3]
        )
        informe.aviso(
            f"{nombre}: {len(sospechosos)} valor(es) en una columna sin nombre. "
            f"Revisar posible dato pegado por accidente. {ejemplos}"
        )


def _validar_categoria(
    nombre_fuente: str,
    indice: int,
    palabra: str,
    categoria: str,
    categorias_permitidas: set[str],
    categorias_nuevas: set[str],
    informe: Informe,
) -> None:
    if not categoria:
        informe.error(
            f"{nombre_fuente} #{indice} ({palabra or 'sin palabra'}): falta 'categoria'."
        )
        return

    if categoria in categorias_permitidas:
        return

    if _categoria_nueva_valida(categoria):
        categorias_nuevas.add(categoria)
        return

    ruta = _ruta_icono_categoria(categoria)
    esperada = (
        str(ruta.relative_to(ROOT))
        if ruta is not None
        else "img/categorias/<categoria>.webp"
    )
    informe.error(
        f"{nombre_fuente} #{indice} ({palabra}): categoría nueva {categoria!r} "
        f"sin icono. El Publicador debe crear {esperada!r}."
    )


def validar_diccionario(informe: Informe) -> list[dict]:
    filas = _cargar(DICCIONARIO, "Diccionario", informe)
    if not filas:
        return filas

    categorias_permitidas = set(CATEGORIAS_DICCIONARIO)
    categorias_nuevas: set[str] = set()
    ids: dict[str, int] = {}
    palabras_categoria: dict[tuple[str, str], tuple[int, bool]] = {}
    palabras = Counter()
    sin_video = 0
    publicables = 0
    sin_definicion_publicable = 0
    ids_no_slug = 0
    duplicados_borrador = 0

    for i, fila in enumerate(filas, 1):
        palabra = _texto(fila.get("palabra"))
        categoria = _texto(fila.get("categoria"))
        identificador = _texto(fila.get("id"))
        video = _texto(fila.get("video"))
        es_publicable = bool(video)

        if not palabra:
            informe.error(f"Diccionario #{i}: falta 'palabra'.")
        _validar_categoria(
            "Diccionario",
            i,
            palabra,
            categoria,
            categorias_permitidas,
            categorias_nuevas,
            informe,
        )

        if not identificador:
            informe.error(f"Diccionario #{i} ({palabra}): falta ID estable.")
        else:
            clave_id = identificador.casefold()
            if clave_id in ids:
                informe.error(
                    f"Diccionario: ID duplicado {identificador!r} en registros "
                    f"#{ids[clave_id]} y #{i}."
                )
            else:
                ids[clave_id] = i
            if not PATRON_ID.fullmatch(identificador):
                ids_no_slug += 1

        if palabra:
            clave_palabra = _clave(palabra)
            palabras[clave_palabra] += 1
            par = (clave_palabra, _clave(categoria))
            if par in palabras_categoria:
                anterior_i, anterior_publicable = palabras_categoria[par]
                if es_publicable or anterior_publicable:
                    informe.error(
                        f"Diccionario: palabra publicable duplicada en la misma categoría: "
                        f"{palabra!r} (registros #{anterior_i} y #{i})."
                    )
                else:
                    duplicados_borrador += 1
            else:
                palabras_categoria[par] = (i, es_publicable)

        if video:
            publicables += 1
            if _youtube_id(video) is None:
                informe.error(
                    f"Diccionario #{i} ({palabra}): referencia de YouTube no reconocida: {video!r}."
                )
            if not _texto(fila.get("definicion")):
                sin_definicion_publicable += 1
        else:
            sin_video += 1

    duplicados_nombre = sum(1 for n in palabras.values() if n > 1)
    if duplicados_nombre:
        informe.aviso(
            f"Diccionario: {duplicados_nombre} nombre(s) aparecen más de una vez en los datos. "
            "No se mezclaron automáticamente; revisar si son conceptos distintos."
        )
    if duplicados_borrador:
        informe.aviso(
            f"Diccionario: {duplicados_borrador} duplicado(s) están solo entre borradores sin video. "
            "No cuentan como contenido publicable y no bloquean la actualización."
        )
    if ids_no_slug:
        informe.aviso(
            f"Diccionario: {ids_no_slug} ID(s) no usan el formato slug recomendado "
            "(minúsculas, números y guiones)."
        )
    if sin_definicion_publicable:
        informe.aviso(
            f"Diccionario: {sin_definicion_publicable} palabra(s) con video no tienen definición."
        )
    if categorias_nuevas:
        informe.dato(
            "Diccionario: categorías adicionales reconocidas por su icono: "
            + ", ".join(sorted(categorias_nuevas, key=str.casefold))
            + "."
        )
    _revisar_campos_extranos("Diccionario", filas, informe)
    informe.dato(
        f"Diccionario: {len(filas)} registros, {publicables} con video publicable, "
        f"{sin_video} sin video (no se publican), "
        f"{len(set(_texto(x.get('categoria')) for x in filas))} categorías."
    )
    return filas


def validar_vocabulario(informe: Informe) -> list[dict]:
    filas = _cargar(VOCABULARIO, "Vocabulario", informe)
    if not filas:
        return filas

    categorias_permitidas = set(CATEGORIAS_VOCABULARIO)
    categorias_nuevas: set[str] = set()
    referencias: dict[tuple[str, str], int] = {}
    sin_imagen = 0
    sin_definicion = 0

    for i, fila in enumerate(filas, 1):
        palabra = _texto(fila.get("palabra"))
        categoria = _texto(fila.get("categoria"))
        video = _texto(fila.get("video"))
        nivel = _texto(fila.get("nivel"))
        imagen = _texto(fila.get("imagen"))
        definicion = _texto(fila.get("definicion"))

        if not palabra:
            informe.error(f"Vocabulario #{i}: falta 'palabra'.")
        _validar_categoria(
            "Vocabulario",
            i,
            palabra,
            categoria,
            categorias_permitidas,
            categorias_nuevas,
            informe,
        )
        if not video:
            informe.error(f"Vocabulario #{i} ({palabra}): falta video.")
        elif _youtube_id(video) is None:
            informe.error(
                f"Vocabulario #{i} ({palabra}): referencia de YouTube no reconocida: {video!r}."
            )
        if not nivel:
            informe.aviso(f"Vocabulario #{i} ({palabra}): falta nivel.")
        elif nivel not in NIVELES_VOCABULARIO:
            informe.error(
                f"Vocabulario #{i} ({palabra}): nivel no válido {nivel!r}. "
                "Usar Fácil, Medio o Difícil."
            )
        if not definicion:
            sin_definicion += 1
        if not imagen:
            sin_imagen += 1
        elif imagen.startswith(("img/", "./img/")):
            ruta_texto = unquote(imagen.removeprefix("./"))
            ruta = ROOT / ruta_texto
            if not ruta.exists():
                informe.aviso(
                    f"Vocabulario #{i} ({palabra}): imagen local no encontrada: {imagen}."
                )

        referencia = (_clave(palabra), _clave(categoria))
        if all(referencia):
            if referencia in referencias:
                informe.error(
                    f"Vocabulario: referencia duplicada {palabra!r} / {categoria!r} "
                    f"en registros #{referencias[referencia]} y #{i}."
                )
            else:
                referencias[referencia] = i

    if sin_imagen:
        informe.aviso(f"Vocabulario: {sin_imagen} palabra(s) sin imagen.")
    if sin_definicion:
        informe.aviso(
            f"Vocabulario: {sin_definicion} palabra(s) todavía no tienen definición. "
            "El Publicador nuevo ya guarda este campo para las publicaciones futuras."
        )
    if categorias_nuevas:
        informe.dato(
            "Vocabulario: categorías adicionales reconocidas por su icono: "
            + ", ".join(sorted(categorias_nuevas, key=str.casefold))
            + "."
        )
    _revisar_campos_extranos("Vocabulario", filas, informe)
    informe.dato(
        f"Vocabulario: {len(filas)} registros con video, "
        f"{len(set(_texto(x.get('categoria')) for x in filas))} categorías."
    )
    return filas


def revisar_cruce_fuentes(diccionario: list[dict], vocabulario: list[dict], informe: Informe) -> None:
    nombres_dicc = {_clave(x.get("palabra")) for x in diccionario if _clave(x.get("palabra"))}
    nombres_vocab = {_clave(x.get("palabra")) for x in vocabulario if _clave(x.get("palabra"))}
    compartidas = sorted(nombres_dicc & nombres_vocab)
    informe.dato(
        f"Cruce de fuentes: {len(compartidas)} palabra(s) aparecen en Diccionario y Vocabulario. "
        "Esto es válido: las fuentes permanecen separadas."
    )


def imprimir(informe: Informe) -> None:
    print("\n=== VALIDACIÓN LSPedia ===")
    for mensaje in informe.info:
        print(f"ℹ️  {mensaje}")
    for mensaje in informe.advertencias:
        print(f"⚠️  {mensaje}")
    for mensaje in informe.errores:
        print(f"❌ {mensaje}")
    print(
        f"\nResumen: {len(informe.errores)} error(es), "
        f"{len(informe.advertencias)} advertencia(s)."
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--fuente",
        choices=["todo", "diccionario", "vocabulario"],
        default="todo",
        help="Fuente a validar.",
    )
    args = parser.parse_args()

    informe = Informe()
    diccionario: list[dict] = []
    vocabulario: list[dict] = []

    if args.fuente in {"todo", "diccionario"}:
        diccionario = validar_diccionario(informe)
    if args.fuente in {"todo", "vocabulario"}:
        vocabulario = validar_vocabulario(informe)
    if args.fuente == "todo" and diccionario and vocabulario:
        revisar_cruce_fuentes(diccionario, vocabulario, informe)

    imprimir(informe)
    return 1 if informe.errores else 0


if __name__ == "__main__":
    raise SystemExit(main())
