#!/usr/bin/env python3
"""Migra js/quiz.js para usar data/vocabulario.json como fuente principal.

La operación es idempotente: si el archivo ya fue migrado, no vuelve a
modificarlo. Apps Script queda como respaldo automático.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
RUTA = ROOT / "js" / "quiz.js"


def reemplazar(texto: str, viejo: str, nuevo: str, etiqueta: str) -> str:
    if nuevo in texto:
        return texto
    if viejo not in texto:
        raise RuntimeError(f"No se encontró el bloque esperado: {etiqueta}")
    return texto.replace(viejo, nuevo, 1)


def main() -> int:
    texto = RUTA.read_text(encoding="utf-8")

    if 'DATA_URL: "data/vocabulario.json"' in texto and 'function fetchLocal(' in texto:
        print("quiz.js ya usa vocabulario.json.")
        return 0

    texto = reemplazar(
        texto,
        """   Este archivo es 100% independiente de script.js y de\n   data/palabras.json. Todas las preguntas se cargan en vivo\n   desde la Hoja 2 de tu Google Sheets, a través de un Web App\n   de Google Apps Script.\n\n   ⚠️ CONFIGURACIÓN OBLIGATORIA:\n   Reemplaza la URL de abajo por la URL de TU despliegue de\n   Apps Script (ver INSTRUCCIONES.md, paso 4).\n""",
        """   Este archivo es 100% independiente de script.js y de\n   data/palabras.json. Vocabulario y Quiz leen primero el archivo\n   local data/vocabulario.json, que se sincroniza automáticamente\n   desde la Hoja 2 de Google Sheets. Apps Script queda únicamente\n   como respaldo de emergencia si el JSON local no está disponible.\n""",
        "cabecera",
    )

    texto = reemplazar(
        texto,
        """        // 👉 Pega aquí la URL de tu Web App de Apps Script (termina en /exec)\n        APPS_SCRIPT_URL: \"https://script.google.com/macros/s/AKfycbw9d7br5C8C4gfk4dJAY6FHRKTKTMI23bNQvO58OQ5TlPe9z5awMWjNIlCLILNLH0t51w/exec\",\n\n        // v2: se cambió el nombre de la clave a propósito para invalidar\n        // cualquier caché guardada ANTES de normalizar el campo \"nivel\"\n        // (ver normalizarNivel más abajo). Sin este cambio, quien ya\n        // había abierto el Quiz seguiría viendo el banco viejo (con\n        // \"difícil\" en minúscula) hasta que esa caché expirara sola.\n        CLAVE_CACHE: \"lspedia_quiz_cache_v2\",\n        DURACION_CACHE_MS: 5 * 60 * 1000, // 5 minutos: evita golpear el Sheet en cada clic\n""",
        """        // Fuente principal rápida: archivo servido por LSPedia.\n        DATA_URL: \"data/vocabulario.json\",\n\n        // Respaldo de emergencia. Solo se consulta si vocabulario.json\n        // falta, está vacío o llega dañado.\n        APPS_SCRIPT_URL: \"https://script.google.com/macros/s/AKfycbw9d7br5C8C4gfk4dJAY6FHRKTKTMI23bNQvO58OQ5TlPe9z5awMWjNIlCLILNLH0t51w/exec\",\n\n        // v3 invalida la caché antigua que provenía directamente del Sheet.\n        CLAVE_CACHE: \"lspedia_quiz_cache_v3\",\n        DURACION_CACHE_MS: 24 * 60 * 60 * 1000,\n""",
        "configuración",
    )

    texto = texto.replace("fetchRemoto(true);", "fetchLocal(true);", 1)
    texto = texto.replace("if (!cargaEnCurso) fetchRemoto(true);", "if (!cargaEnCurso) fetchLocal(true);", 1)
    texto = texto.replace("fetchRemoto(false);", "fetchLocal(false);", 1)

    marcador = "    function fetchRemoto(silencioso) {\n"
    if marcador not in texto:
        raise RuntimeError("No se encontró fetchRemoto para insertar fetchLocal.")

    fetch_local = '''    // Fuente principal: JSON local. Si falla, se usa Apps Script como respaldo.\n    function fetchLocal(silencioso) {\n        if (cargaEnCurso) return;\n        cargaEnCurso = true;\n\n        const controlador = (typeof AbortController !== "undefined") ? new AbortController() : null;\n        const separador = CONFIG.DATA_URL.indexOf("?") > -1 ? "&" : "?";\n        const url = CONFIG.DATA_URL + separador + "_lspedia=" + Date.now();\n        const opciones = { cache: "no-store" };\n        if (controlador) opciones.signal = controlador.signal;\n\n        let timeoutId = setTimeout(() => {\n            if (controlador) { try { controlador.abort(); } catch (e) {} }\n        }, 6000);\n\n        fetch(url, opciones)\n            .then((res) => {\n                if (!res.ok) throw new Error("HTTP " + res.status);\n                return res.json();\n            })\n            .then((data) => {\n                const lista = Array.isArray(data) ? data : (data && Array.isArray(data.preguntas) ? data.preguntas : []);\n                const banco = lista\n                    .filter((p) => p && p.palabra && p.video)\n                    .map((p) => ({ ...p, nivel: normalizarNivel(p.nivel) }));\n                if (!banco.length) throw new Error("vocabulario.json está vacío o no tiene palabras con video.");\n\n                cargaEnCurso = false;\n                estado.banco = banco;\n                guardarCache(estado.banco);\n                if (!silencioso) mostrarIntro();\n                notificarBancoListo();\n            })\n            .catch((err) => {\n                cargaEnCurso = false;\n                console.warn("No se pudo cargar data/vocabulario.json; usando Apps Script como respaldo:", err);\n                fetchRemoto(silencioso);\n            })\n            .finally(() => {\n                if (timeoutId) clearTimeout(timeoutId);\n            });\n    }\n\n'''
    texto = texto.replace(marcador, fetch_local + marcador, 1)

    # La precarga automática del final también debe consultar primero el JSON local.
    ultima = texto.rfind("fetchRemoto(true);")
    if ultima != -1:
        texto = texto[:ultima] + "fetchLocal(true);" + texto[ultima + len("fetchRemoto(true);"):]

    RUTA.write_text(texto, encoding="utf-8", newline="\n")
    print("quiz.js migrado para usar data/vocabulario.json.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
