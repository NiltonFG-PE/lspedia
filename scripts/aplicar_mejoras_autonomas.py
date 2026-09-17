#!/usr/bin/env python3
"""Aplica mejoras autónomas seguras y repetibles a LSPedia.

- Completa solo definiciones vacías del Diccionario desde un suplemento editorial.
- Extrae las consultas oEmbed de dos funciones de script.js hacia LSPediaMedia.
- Inserta el módulo multimedia antes de script.js en index.html.
- Añade el módulo multimedia al cascarón PWA si todavía no está declarado.

El script es idempotente: ejecutarlo varias veces no duplica cambios.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def leer(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def escribir_si_cambio(path: str, original: str, nuevo: str) -> bool:
    if nuevo == original:
        return False
    (ROOT / path).write_text(nuevo, encoding="utf-8")
    print(f"ACTUALIZADO {path}")
    return True


def escapar_json_string(valor: str) -> str:
    # json.dumps devuelve una cadena entre comillas con escapes correctos.
    return json.dumps(valor, ensure_ascii=False)


def aplicar_definiciones_diccionario() -> int:
    ruta = "data/palabras.json"
    original = leer(ruta)
    suplemento = json.loads(leer("data/diccionario-definiciones-autonomas.json"))
    definiciones = suplemento.get("definiciones", {})
    if not isinstance(definiciones, dict):
        raise SystemExit("El suplemento de definiciones no tiene un objeto 'definiciones'.")

    # Validamos primero el JSON actual para no modificar un archivo ya dañado.
    datos = json.loads(original)
    por_id = {str(item.get("id", "")): item for item in datos if isinstance(item, dict)}
    candidatos = {
        clave: definicion
        for clave, definicion in definiciones.items()
        if clave in por_id
        and not str(por_id[clave].get("definicion", "")).strip()
        and str(definicion).strip()
    }

    texto = original
    aplicadas = 0
    for clave, definicion in candidatos.items():
        # Limita la búsqueda al objeto que comienza con ese id y sustituye
        # exclusivamente un valor de definición vacío dentro del mismo objeto.
        patron = re.compile(
            r'("id"\s*:\s*' + re.escape(escapar_json_string(clave)) +
            r'(?:(?!\n\s*\},?).)*?"definicion"\s*:\s*)""',
            re.DOTALL,
        )
        reemplazo = lambda m, d=definicion: m.group(1) + escapar_json_string(str(d).strip())
        texto_nuevo, cantidad = patron.subn(reemplazo, texto, count=1)
        if cantidad:
            texto = texto_nuevo
            aplicadas += 1
        else:
            raise SystemExit(f"No se pudo ubicar de forma segura la definición vacía de {clave}.")

    # La salida debe seguir siendo JSON válido y mantener exactamente 1711 u otra
    # cantidad vigente de registros; este script nunca agrega ni elimina registros.
    datos_nuevos = json.loads(texto)
    if len(datos_nuevos) != len(datos):
        raise SystemExit("La cantidad de registros cambió inesperadamente.")

    escribir_si_cambio(ruta, original, texto)
    print(f"Definiciones del Diccionario aplicadas: {aplicadas}")
    return aplicadas


def fin_funcion(codigo: str, inicio: int) -> int:
    abre = codigo.find("{", inicio)
    if abre < 0:
        raise ValueError("Función sin llave de apertura")
    profundidad = 0
    i = abre
    estado = "codigo"
    escape = False
    while i < len(codigo):
        c = codigo[i]
        n = codigo[i + 1] if i + 1 < len(codigo) else ""
        if estado in {"simple", "doble", "template"}:
            if escape:
                escape = False
            elif c == "\\":
                escape = True
            elif (estado == "simple" and c == "'") or (estado == "doble" and c == '"') or (estado == "template" and c == "`"):
                estado = "codigo"
            i += 1
            continue
        if estado == "linea":
            if c == "\n":
                estado = "codigo"
            i += 1
            continue
        if estado == "bloque":
            if c == "*" and n == "/":
                estado = "codigo"
                i += 2
            else:
                i += 1
            continue
        if c == "/" and n == "/":
            estado = "linea"; i += 2; continue
        if c == "/" and n == "*":
            estado = "bloque"; i += 2; continue
        if c == "'": estado = "simple"; i += 1; continue
        if c == '"': estado = "doble"; i += 1; continue
        if c == "`": estado = "template"; i += 1; continue
        if c == "{":
            profundidad += 1
        elif c == "}":
            profundidad -= 1
            if profundidad == 0:
                return i + 1
        i += 1
    raise ValueError("No se encontró el final de la función")


def sustituir_funcion(codigo: str, nombre: str, nueva: str) -> tuple[str, bool]:
    patron = re.compile(r"function\s+" + re.escape(nombre) + r"\s*\(")
    m = patron.search(codigo)
    if not m:
        raise SystemExit(f"No se encontró la función {nombre} en script.js")
    fin = fin_funcion(codigo, m.start())
    actual = codigo[m.start():fin]
    if "LSPediaMedia" in actual:
        return codigo, False
    return codigo[:m.start()] + nueva.rstrip() + codigo[fin:], True


def modularizar_script_principal() -> int:
    ruta = "js/script.js"
    original = leer(ruta)
    codigo = original

    reemplazos = {
        "ajustarAspectoReproductorPalabra": '''function ajustarAspectoReproductorPalabra(videoId) {
    const media = window.LSPediaMedia;
    if (media && typeof media.ajustarAspecto === "function") {
        media.ajustarAspecto("reproductorPalabraWrap", videoId);
        return;
    }
    const wrap = document.getElementById("reproductorPalabraWrap");
    if (wrap) wrap.style.aspectRatio = "16 / 9";
}''',
        "ajustarAspectoReproductorSugerida": '''function ajustarAspectoReproductorSugerida(videoId) {
    const media = window.LSPediaMedia;
    if (media && typeof media.ajustarAspecto === "function") {
        media.ajustarAspecto("reproductorSugeridaWrap", videoId);
        return;
    }
    const wrap = document.getElementById("reproductorSugeridaWrap");
    if (wrap) wrap.style.aspectRatio = "16 / 9";
}''',
    }

    cambiadas = 0
    for nombre, nueva in reemplazos.items():
        codigo, cambio = sustituir_funcion(codigo, nombre, nueva)
        cambiadas += int(cambio)

    escribir_si_cambio(ruta, original, codigo)
    print(f"Funciones multimedia extraídas/delegadas: {cambiadas}")
    return cambiadas


def insertar_modulo_en_index() -> bool:
    ruta = "index.html"
    original = leer(ruta)
    if "js/lspedia-media.js" in original:
        print("index.html ya carga lspedia-media.js")
        return False
    marca = '<script src="js/script.js"></script>'
    if marca not in original:
        raise SystemExit("No se encontró la carga exacta de js/script.js en index.html")
    nuevo = original.replace(
        marca,
        '<script src="js/lspedia-media.js?v=20260917-1"></script>\n    ' + marca,
        1,
    )
    return escribir_si_cambio(ruta, original, nuevo)


def insertar_modulo_en_sw() -> bool:
    ruta = "sw.js"
    original = leer(ruta)
    nuevo = original
    if '"js/lspedia-media.js"' not in nuevo:
        marca = '    "js/lspedia-core.js",\n'
        if marca not in nuevo:
            marca = '    "js/security.js",\n'
        if marca not in nuevo:
            raise SystemExit("No se encontró un punto seguro para lspedia-media.js en sw.js")
        nuevo = nuevo.replace(marca, marca + '    "js/lspedia-media.js",\n', 1)
    # Una modificación funcional del SW merece una versión de caché distinta.
    nuevo = re.sub(r'const VERSION_APP = "v158";', 'const VERSION_APP = "v159";', nuevo, count=1)
    return escribir_si_cambio(ruta, original, nuevo)


def main() -> None:
    aplicar_definiciones_diccionario()
    modularizar_script_principal()
    insertar_modulo_en_index()
    insertar_modulo_en_sw()
    print("Mejoras autónomas aplicadas correctamente.")


if __name__ == "__main__":
    main()
