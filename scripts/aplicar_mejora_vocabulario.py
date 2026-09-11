#!/usr/bin/env python3
"""Aplica mejoras puntuales e idempotentes a ``js/script.js``.

1. Añade la definición a la ficha de Vocabulario sin tocar el Quiz, su
   miniatura de YouTube ni el autoplay.
2. Hace que categorías nuevas usen automáticamente el icono WEBP creado por
   el Publicador en ``img/categorias/<slug>.webp``.

Este script se usa durante la migración del archivo grande ``js/script.js`` y
puede ejecutarse más de una vez sin duplicar cambios.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "js" / "script.js"
MARCADOR_DEFINICION = "const bloqueDefinicionVocabulario ="
MARCADOR_ICONOS = "function rutaIconoCategoriaDinamica(nombre)"


def aplicar_definicion_vocabulario(texto: str) -> tuple[str, bool]:
    if MARCADOR_DEFINICION in texto:
        return texto, False

    inicio = texto.find("function mostrarPalabraSimplificada(p, opciones = {}){")
    if inicio < 0:
        raise RuntimeError("No encontré mostrarPalabraSimplificada().")

    fin = texto.find("// --- REPRODUCTOR DE VIDEO CONTROLABLE", inicio)
    if fin < 0:
        raise RuntimeError("No encontré el final de la ficha de Vocabulario.")

    bloque = texto[inicio:fin]
    patron_variantes = re.compile(r"(?m)^(    let bloqueVariantes = .*?;\n)")
    coincidencia = patron_variantes.search(bloque)
    if not coincidencia:
        raise RuntimeError("No encontré el bloque de variantes de Vocabulario.")

    definicion = '''\

    const bloqueDefinicionVocabulario =
        p.definicion && String(p.definicion).trim() !== ""
            ? `<p class="mb-3 p-3 rounded" style="background-color: #eef6ff; border-left: 4px solid #0d6efd; font-size: 1rem; line-height: 1.5; color: #1e293b;">${formatearDefinicion(p.definicion)}</p>`
            : "";
'''
    posicion = coincidencia.end()
    bloque = bloque[:posicion] + definicion + bloque[posicion:]

    marcador_template = '''\
                ${generarBotonCompartir()}
            </div>
            ${bloqueVariantes}
'''
    reemplazo_template = '''\
                ${generarBotonCompartir()}
            </div>
            ${bloqueDefinicionVocabulario}
            ${bloqueVariantes}
'''
    if marcador_template not in bloque:
        raise RuntimeError("No encontré el punto donde insertar la definición en la ficha.")
    bloque = bloque.replace(marcador_template, reemplazo_template, 1)

    texto = texto[:inicio] + bloque + texto[fin:]

    comentario_antiguo = '''\
// --- TARJETA SIMPLIFICADA PARA PALABRAS DE LA HOJA 2 (banco del Quiz) ---
// La Hoja 2 solo tiene palabra, video, categoría y nivel (no definición,
// imagen, variantes ni seña sugerida), así que esta es una versión
// reducida de mostrarPalabra() con lo mínimo que hay disponible.
'''
    comentario_nuevo = '''\
// --- FICHA DE VOCABULARIO PARA PALABRAS DE LA HOJA 2 ---
// Vocabulario sigue usando el mismo banco que el Quiz, pero su ficha puede
// mostrar definición, variantes e ilustración propias cuando esos campos
// existen. El Quiz conserva su miniatura del video de YouTube.
'''
    texto = texto.replace(comentario_antiguo, comentario_nuevo, 1)
    return texto, True


def aplicar_iconos_categorias(texto: str) -> tuple[str, bool]:
    if MARCADOR_ICONOS in texto:
        return texto, False

    funcion_antigua = '''\
function infoCategoriaDiccionario(nombre, indiceFallback){
    const clave = nombre.trim().toLowerCase();
    if (CATEGORIAS_DICCIONARIO_INFO[clave]) return CATEGORIAS_DICCIONARIO_INFO[clave];
    const color = COLORES_CATEGORIAS[indiceFallback % COLORES_CATEGORIAS.length];
    return { icono: null, descripcion: "Explora estas palabras", fondo: color.fondo, borde: color.borde, texto: color.texto };
}
'''

    funcion_nueva = '''\
function slugIconoCategoria(nombre){
    return String(nombre || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function rutaIconoCategoriaDinamica(nombre){
    const slug = slugIconoCategoria(nombre);
    return slug ? `img/categorias/${slug}.webp` : "";
}

function infoCategoriaDiccionario(nombre, indiceFallback){
    const clave = nombre.trim().toLowerCase();
    if (CATEGORIAS_DICCIONARIO_INFO[clave]) return CATEGORIAS_DICCIONARIO_INFO[clave];
    const color = COLORES_CATEGORIAS[indiceFallback % COLORES_CATEGORIAS.length];
    return {
        icono: rutaIconoCategoriaDinamica(nombre),
        descripcion: "Explora estas palabras",
        fondo: color.fondo,
        borde: color.borde,
        texto: color.texto
    };
}
'''

    if funcion_antigua not in texto:
        raise RuntimeError("No encontré infoCategoriaDiccionario() en el formato esperado.")
    texto = texto.replace(funcion_antigua, funcion_nueva, 1)

    icono_vocab_antiguo = "        const icono = ICONOS_CATEGORIA_VOCABULARIO[nombreClave];"
    icono_vocab_nuevo = (
        "        const icono = ICONOS_CATEGORIA_VOCABULARIO[nombreClave] "
        "|| rutaIconoCategoriaDinamica(nombre);"
    )
    if icono_vocab_antiguo not in texto:
        raise RuntimeError("No encontré la selección de icono de Vocabulario.")
    texto = texto.replace(icono_vocab_antiguo, icono_vocab_nuevo, 1)

    return texto, True


def main() -> int:
    texto = SCRIPT.read_text(encoding="utf-8")
    cambios: list[str] = []

    texto, cambio = aplicar_definicion_vocabulario(texto)
    if cambio:
        cambios.append("definición de Vocabulario")

    texto, cambio = aplicar_iconos_categorias(texto)
    if cambio:
        cambios.append("iconos dinámicos de categorías")

    if not cambios:
        print("✅ Las mejoras de Vocabulario y categorías ya están integradas.")
        return 0

    SCRIPT.write_text(texto, encoding="utf-8", newline="\n")
    print("✅ Integrado: " + ", ".join(cambios) + ".")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
