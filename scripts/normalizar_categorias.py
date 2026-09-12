#!/usr/bin/env python3
"""Normaliza categorías de LSPedia sin mezclar Diccionario y Vocabulario.

Regla editorial de LSPedia:
- Cada palabra pertenece a una sola categoría principal.
- El nombre de la categoría debe ser una sola palabra.

Cada fuente conserva su propia lista de categorías canónicas. Los alias
históricos y los nombres compuestos conocidos se convierten a una categoría
de una sola palabra para que una sincronización futura no deshaga la
organización de las hojas.
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


# Categorías canónicas del Diccionario. Todas son una sola palabra.
# Se conservan categorías útiles y específicas que ya forman parte de la
# organización editorial de LSPedia, como Bienestar, Comportamiento y
# Habilidades.
CATEGORIAS_DICCIONARIO = [
    "Animales",
    "Bienestar",
    "Calle",
    "Cantidad",
    "Casa",
    "Ciencia",
    "Ciudad",
    "Colegio",
    "Comida",
    "Comportamiento",
    "Comunicación",
    "Cortesía",
    "Deportes",
    "Descripción",
    "Economía",
    "Educación",
    "Emociones",
    "Familia",
    "Filosofía",
    "Habilidades",
    "Naturaleza",
    "Ocio",
    "Política",
    "Psicología",
    "Reflexión",
    "Salud",
    "Saludos",
    "Sociedad",
    "Tecnología",
    "Tiempo",
    "Trabajo",
    "Trámites",
    "Transporte",
    "Universidad",
    "Valores",
    "Verbos",
]

_CANON_DICC = {_clave(nombre): nombre for nombre in CATEGORIAS_DICCIONARIO}

# Alias históricos del Diccionario. Los nombres compuestos se consolidan en
# una sola categoría principal. "Alimentos" se conserva como alias de Comida
# para que los datos antiguos sigan siendo compatibles.
_ALIAS_DICC = {
    "alimentos": "Comida",
    "ciencia/tecnologia": "Ciencia",
    "tecnologia/ciencia": "Tecnología",
    "educacion/habilidades": "Habilidades",
    "educacion/politica": "Política",
    "educacion/trabajo": "Trabajo",
    "sociedad/educacion": "Sociedad",
    "tecnologia/redes sociales": "Tecnología",
    "tecnologia/trabajo": "Trabajo",
    "trabajo/comercio": "Trabajo",
    "trabajo/economia": "Economía",
    "etica/legal": "Valores",
    "etica/trabajo": "Valores",
    "metas y desafios": "Verbos",
    "metas/desafios": "Verbos",
}


# Categorías canónicas de Vocabulario. La fuente mezcla categorías
# gramaticales (Verbos, Adjetivos, Adverbios) y temáticas, pero todas usan un
# nombre de una sola palabra.
CATEGORIAS_VOCABULARIO = [
    "Adjetivos",
    "Adverbios",
    "Animales",
    "Cantidad",
    "Casa",
    "Colores",
    "Comida",
    "Comunicación",
    "Cortesía",
    "Cuerpo",
    "Educación",
    "Emociones",
    "Familia",
    "Geografía",
    "Naturaleza",
    "Números",
    "Personas",
    "Preguntas",
    "Profesiones",
    "Ropa",
    "Sociedad",
    "Tecnología",
    "Tiempo",
    "Trámites",
    "Valores",
    "Verbos",
]

_CANON_VOCAB = {_clave(nombre): nombre for nombre in CATEGORIAS_VOCABULARIO}
_ALIAS_VOCAB = {
    "adjetivo": "Adjetivos",
    "adverbio": "Adverbios",
    "animal": "Animales",
    "color": "Colores",
    "alimentos": "Comida",
    "emocion": "Emociones",
    "emociones": "Emociones",
    "tiempos": "Tiempo",
    "verbo": "Verbos",
    "profesiones/ocupaciones": "Profesiones",
    "ocupaciones": "Profesiones",
    "redes sociales/aplicaciones": "Tecnología",
    "relaciones familiares y personales": "Familia",
    "ropa y accesorios": "Ropa",
    "sustantivo": "Personas",
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
