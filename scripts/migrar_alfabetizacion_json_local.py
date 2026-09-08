#!/usr/bin/env python3
"""Migra js/alfabetizacion.js para consumir data/alfabetizacion.json.

La migración es idempotente y elimina la carga JSONP directa desde el navegador.
Apps Script queda reservado para scripts/generar_alfabetizacion.py, ejecutado por
GitHub Actions o manualmente durante mantenimiento.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RUTA_JS = ROOT / "js" / "alfabetizacion.js"
RUTA_SW = ROOT / "sw.js"


def quitar_bloque_funcion(texto: str, inicio: str, siguiente: str) -> str:
    pos_inicio = texto.find(inicio)
    if pos_inicio == -1:
        return texto
    pos_fin = texto.find(siguiente, pos_inicio)
    if pos_fin == -1:
        raise RuntimeError(f"No se encontró el marcador posterior a {inicio!r}.")
    return texto[:pos_inicio] + texto[pos_fin:]


def quitar_rango(texto: str, inicio: str, fin: str) -> str:
    pos_inicio = texto.find(inicio)
    if pos_inicio == -1:
        return texto
    pos_fin = texto.find(fin, pos_inicio)
    if pos_fin == -1:
        raise RuntimeError(f"No se encontró el final del rango iniciado por {inicio!r}.")
    return texto[:pos_inicio] + texto[pos_fin:]


def main() -> int:
    try:
        texto = RUTA_JS.read_text(encoding="utf-8")
        original = texto

        texto = texto.replace(
            "   Sigue el mismo patrón que js/quiz.js (namespace QuizV2):\n"
            "   caché local de 5 min + JSONP contra el Web App de Apps Script.\n",
            "   Lee data/alfabetizacion.json desde el propio sitio y conserva\n"
            "   caché local + alfabetizacion-mock.json como respaldo. El navegador\n"
            "   ya no ejecuta JSONP ni consulta directamente Google Apps Script.\n",
            1,
        )
        texto = texto.replace(
            "   ⚠️ MODO MOCK (mientras el Apps Script no está listo):\n"
            "   Con MOCK_ACTIVO en true, los datos se leen de\n"
            "   data/alfabetizacion-mock.json (mismo origen, sin problemas de\n"
            "   CORS). Cuando el doGet combinado esté desplegado, basta con:\n"
            "     1) Pegar la URL real en CONFIG.APPS_SCRIPT_URL\n"
            "     2) Poner MOCK_ACTIVO en false\n"
            "   El resto del módulo no necesita cambios: cargarDatos() ya\n"
            "   entrega los datos en la misma forma { alfabeto, ejemplos }\n"
            "   sin importar el origen.\n",
            "   MODO MOCK: data/alfabetizacion-mock.json se conserva únicamente\n"
            "   como respaldo local y para pruebas. En uso normal la fuente real\n"
            "   es data/alfabetizacion.json, sincronizada desde Google Sheets.\n",
            1,
        )

        texto = texto.replace(
            '        MOCK_ACTIVO: false, // 👉 ya conectado al Apps Script real (Sheet). Poner en true para volver al mock local si hace falta debuggear sin depender de Google.\n',
            '        MOCK_ACTIVO: false, // true solo para pruebas o respaldo manual.\n',
            1,
        )
        texto = texto.replace(
            "    // CARGA DE DATOS (mock local o Apps Script real, mismo contrato)\n",
            "    // CARGA DE DATOS (JSON local + caché/mock de respaldo)\n",
            1,
        )
        texto = texto.replace("(JSONP + fetch del mock)", "(JSON local + fetch del mock)")
        texto = texto.replace("dato real de Google Sheets", "dato real de alfabetizacion.json")
        texto = texto.replace("conexión con Google Sheets", "lectura de alfabetizacion.json")

        # Reemplaza la URL pública del Web App por la fuente local.
        patron_config = re.compile(
            r'\n\s*// 👉 Pega aquí la URL de tu Web App de Apps Script \(termina en /exec\)\n'
            r'\s*//\s*\(puede ser la misma del Quiz si el doGet combinado responde\n'
            r'\s*//\s*también a este endpoint, o una nueva si prefieres separarlo\)\n'
            r'\s*APPS_SCRIPT_URL:\s*"[^"]+",\n',
            re.M,
        )
        if 'DATA_URL: "data/alfabetizacion.json"' not in texto:
            texto, cambios = patron_config.subn(
                '\n        // Fuente principal: JSON estático servido por LSPedia.\n'
                '        DATA_URL: "data/alfabetizacion.json",\n',
                texto,
                count=1,
            )
            if cambios != 1:
                raise RuntimeError("No se encontró la configuración de Apps Script en alfabetizacion.js.")

        # Sustituye la carrera mock + Apps Script por mock + JSON local.
        inicio_modo = texto.find("        // Modo real: el mock local")
        if inicio_modo != -1:
            llamada_remota = texto.find("        fetchRemoto();", inicio_modo)
            if llamada_remota == -1:
                raise RuntimeError("No se encontró fetchRemoto() en el bloque de carga real.")
            fin_linea = texto.find("\n", llamada_remota)
            if fin_linea == -1:
                fin_linea = len(texto)
            else:
                fin_linea += 1
            reemplazo = (
                "        // Modo normal: mostramos el respaldo local de inmediato mientras\n"
                "        // se lee alfabetizacion.json desde el mismo dominio. El JSON real\n"
                "        // reemplaza al mock en cuanto llega, sin ejecutar código externo.\n"
                "        pintarMockDeInmediato();\n"
                "        cargarJsonLocal();\n"
            )
            texto = texto[:inicio_modo] + reemplazo + texto[fin_linea:]

        if "function cargarJsonLocal()" not in texto:
            marcador = '    // Límite de tiempo "duro" para el fetch del mock local:'
            pos = texto.find(marcador)
            if pos == -1:
                raise RuntimeError("No se encontró dónde insertar cargarJsonLocal().")
            funcion = '''    // Fuente principal de Alfabetización: JSON del propio sitio.\n    // Se agrega un parámetro de versión para evitar copias antiguas del navegador;\n    // el Service Worker ya deja pasar los .json directamente a la red.\n    function cargarJsonLocal() {\n        const separador = CONFIG.DATA_URL.indexOf("?") > -1 ? "&" : "?";\n        const url = CONFIG.DATA_URL + separador + "_lspedia=" + Date.now();\n\n        fetchConTimeout(url, 6000)\n            .then((res) => {\n                if (!res.ok) throw new Error("HTTP " + res.status + " al leer alfabetizacion.json");\n                return res.json();\n            })\n            .then((data) => {\n                if (!data || data.ok !== true || !Array.isArray(data.alfabeto) || !Array.isArray(data.ejemplos)) {\n                    throw new Error("alfabetizacion.json tiene una estructura inválida.");\n                }\n                if (!data.alfabeto.length) {\n                    throw new Error("alfabetizacion.json no contiene caracteres.");\n                }\n                guardarDatos(data);\n            })\n            .catch((err) => manejarErrorCarga(err));\n    }\n\n'''
            texto = texto[:pos] + funcion + texto[pos:]

        # El navegador ya no necesita conocer ni ejecutar el endpoint remoto.
        texto = quitar_bloque_funcion(
            texto,
            "    function fetchRemoto(esReintento) {",
            "    function guardarDatos(data) {",
        )

        # Si la función remota ya se eliminó en una ejecución anterior, también
        # quitamos los comentarios históricos JSONP que quedaron delante de guardarDatos.
        texto = quitar_rango(
            texto,
            "    // Igual que quiz.js: JSONP porque Apps Script + GitHub Pages suele",
            "    function guardarDatos(data) {",
        )

        # Helper que solo servía para mostrar el segundo intento remoto de Apps Script.
        texto = quitar_rango(
            texto,
            '    // Cambia el texto bajo el spinner de "alfabCargando" sin tocar el resto',
            "    // ---------------------------------------------------------\n    // NAVEGACIÓN ENTRE BLOQUES",
        )

        texto = texto.replace(
            "Alfabetización: usando datos de respaldo (mock) porque falló la lectura de alfabetizacion.json.",
            "Alfabetización: usando datos de respaldo (mock) porque no se pudo leer alfabetizacion.json.",
        )
        texto = texto.replace(
            "No se pudo cargar Alfabetización. Detalle técnico: ",
            "No se pudo cargar Alfabetización. ",
        )

        if texto != original:
            RUTA_JS.write_text(texto, encoding="utf-8", newline="\n")
            print("alfabetizacion.js migrado a JSON local.")
        else:
            print("alfabetizacion.js ya estaba migrado.")

        # Una nueva versión de shell fuerza a los dispositivos a recoger el JS nuevo.
        if RUTA_SW.exists():
            sw = RUTA_SW.read_text(encoding="utf-8")
            sw_nuevo = sw.replace('const VERSION_APP = "v25";', 'const VERSION_APP = "v26";', 1)
            if sw_nuevo != sw:
                RUTA_SW.write_text(sw_nuevo, encoding="utf-8", newline="\n")
                print("Service Worker actualizado a v26.")

        return 0
    except Exception as exc:
        print(f"ERROR: no se pudo migrar Alfabetización a JSON local: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
