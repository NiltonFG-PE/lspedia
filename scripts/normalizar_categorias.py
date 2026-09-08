#!/usr/bin/env python3
"""Normaliza categorías de LSPedia sin mezclar Diccionario y Vocabulario.

Cada fuente tiene sus propias categorías canónicas y sus propios alias.
Los nombres desconocidos se conservan (solo se limpian espacios), para no
impedir que en el futuro se agreguen categorías nuevas de forma intencional.
"""
from __future__ import annotations

import json
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DICCIONARIO = ROOT / "data" / "palabras.json"
VOCABULARIO = ROOT / "data" / "vocabulario.json"


def _clave(valor: object) -> str:
    texto = "" if valor is None else str(valor)
    texto = " ".join(texto.strip().split())
    texto = texto.replace(" / ", "/").replace("/ ", "/").replace(" /", "/")
    texto = "".join(
        c for c in unicodedata.normalize("NFD", texto.casefold())
        if unicodedata.category(c) != "Mn"
    )
    return texto


CATEGORIAS_DICCIONARIO = [
    "Alimentos",
    "Calle",
    "Cantidad",
    "Casa",
    "Ciencia",
    "Ciudad",
    "Colegio",
    "Comunicación",
    "Cortesía",
    "Deportes",
    "Descripción",
    "Economía",
    "Educación",
    "Emociones",
    "Familia",
    "Filosofía",
    "Naturaleza",
    "Política",
    "Psicología",
    "Reflexión",
    "Salud",
    "Saludos",
    "Sociedad",
    "Tecnología",
    "Trabajo",
    "Trámites",
    "Transporte",
    "Universidad",
]

_CANON_DICC = {_clave(nombre): nombre for nombre in CATEGORIAS_DICCIONARIO}

# Alias del Diccionario. Se consolidan categorías compuestas o demasiado
# específicas en la categoría principal más útil para navegar la web.
_ALIAS_DICC = {
    "comida": "Alimentos",
    "bienestar": "Salud",
    "comportamiento": "Psicología",
    "habilidades": "Educación",
    "ciencia/tecnologia": "Ciencia",
    "tecnologia/ciencia": "Tecnología",
    "educacion/habilidades": "Educación",
    "educacion/politica": "Política",
    "educacion/trabajo": "Trabajo",
    "sociedad/educacion": "Sociedad",
    "tecnologia/redes sociales": "Tecnología",
    "tecnologia/trabajo": "Trabajo",
    "trabajo/comercio": "Trabajo",
    "trabajo/economia": "Economía",
    "etica/legal": "Sociedad",
    "etica/trabajo": "Trabajo",
}

CATEGORIAS_VOCABULARIO = ["Adjetivos", "Emociones", "Tiempo", "Verbos"]
_CANON_VOCAB = {_clave(nombre): nombre for nombre in CATEGORIAS_VOCABULARIO}
_ALIAS_VOCAB = {
    "adjetivo": "Adjetivos",
    "emocion": "Emociones",
    "emociones": "Emociones",
    "tiempos": "Tiempo",
    "verbo": "Verbos",
}


def _limpiar_original(valor: object) -> str:
    return " ".join(("" if valor is None else str(valor)).strip().split())


def normalizar_categoria_diccionario(valor: object) -> str:
    original = _limpiar_original(valor)
    clave = _clave(original)
    if not clave:
        return ""
    if clave in _ALIAS_DICC:
        return _ALIAS_DICC[clave]
    if clave in _CANON_DICC:
        return _CANON_DICC[clave]
    return original


def normalizar_categoria_vocabulario(valor: object) -> str:
    original = _limpiar_original(valor)
    clave = _clave(original)
    if not clave:
        return ""
    if clave in _ALIAS_VOCAB:
        return _ALIAS_VOCAB[clave]
    if clave in _CANON_VOCAB:
        return _CANON_VOCAB[clave]
    return original


def normalizar_archivo(ruta: Path, fuente: str) -> tuple[int, int]:
    datos = json.loads(ruta.read_text(encoding="utf-8"))
    if not isinstance(datos, list):
        raise RuntimeError(f"{ruta} no contiene una lista JSON.")

    funcion = (
        normalizar_categoria_diccionario
        if fuente == "diccionario"
        else normalizar_categoria_vocabulario
    )

    cambios = 0
    con_categoria = 0
    for registro in datos:
        if not isinstance(registro, dict) or "categoria" not in registro:
            continue
        con_categoria += 1
        anterior = registro.get("categoria")
        nueva = funcion(anterior)
        if anterior != nueva:
            registro["categoria"] = nueva
            cambios += 1

    if cambios:
        ruta.write_text(
            json.dumps(datos, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
            newline="\n",
        )

    return cambios, con_categoria


def main() -> int:
    try:
        cambios_dicc, total_dicc = normalizar_archivo(DICCIONARIO, "diccionario")
        cambios_vocab, total_vocab = normalizar_archivo(VOCABULARIO, "vocabulario")
        print(f"Diccionario: {cambios_dicc} categorías normalizadas de {total_dicc} registros.")
        print(f"Vocabulario: {cambios_vocab} categorías normalizadas de {total_vocab} registros.")
        return 0
    except Exception as exc:
        print(f"ERROR normalizando categorías: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
