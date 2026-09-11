#!/usr/bin/env python3
"""Aplica una mejora puntual e idempotente a la ficha de Vocabulario.

Añade el bloque de definición a ``mostrarPalabraSimplificada`` sin tocar el
Quiz, la miniatura de YouTube ni el comportamiento de autoplay. El script se
usa durante la migración para modificar de forma segura el archivo grande
``js/script.js`` y puede ejecutarse más de una vez sin duplicar el cambio.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "js" / "script.js"
MARCADOR = "const bloqueDefinicionVocabulario ="


def main() -> int:
    texto = SCRIPT.read_text(encoding="utf-8")

    if MARCADOR in texto:
        print("✅ La definición de Vocabulario ya está integrada.")
        return 0

    inicio = texto.find("function mostrarPalabraSimplificada(p, opciones = {}){")
    if inicio < 0:
        raise SystemExit("No encontré mostrarPalabraSimplificada().")

    fin = texto.find("// --- REPRODUCTOR DE VIDEO CONTROLABLE", inicio)
    if fin < 0:
        raise SystemExit("No encontré el final de la ficha de Vocabulario.")

    bloque = texto[inicio:fin]

    patron_variantes = re.compile(
        r"(?m)^(    let bloqueVariantes = .*?;\n)"
    )
    coincidencia = patron_variantes.search(bloque)
    if not coincidencia:
        raise SystemExit("No encontré el bloque de variantes de Vocabulario.")

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
        raise SystemExit("No encontré el punto donde insertar la definición en la ficha.")
    bloque = bloque.replace(marcador_template, reemplazo_template, 1)

    nuevo = texto[:inicio] + bloque + texto[fin:]

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
    nuevo = nuevo.replace(comentario_antiguo, comentario_nuevo, 1)

    SCRIPT.write_text(nuevo, encoding="utf-8", newline="\n")
    print("✅ Ficha de Vocabulario actualizada: definición integrada.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
