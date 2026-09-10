#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def leer(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def escribir(path: str, contenido: str) -> None:
    (ROOT / path).write_text(contenido, encoding="utf-8", newline="\n")


def reemplazar_una(texto: str, viejo: str, nuevo: str, etiqueta: str) -> str:
    if viejo in texto:
        return texto.replace(viejo, nuevo, 1)
    if nuevo in texto:
        return texto
    raise SystemExit(f"No se encontró el bloque esperado para {etiqueta}.")


# ---------------------------------------------------------------------------
# 1) El JSON de Alfabetización ya no debe transportar trazoVideo.
#    La interfaz construye las rutas de grafía por convención en JS.
# ---------------------------------------------------------------------------
gen_path = "scripts/generar_alfabetizacion.py"
gen = leer(gen_path)
gen = reemplazar_una(
    gen,
    'CAMPOS_ALFABETO = ("tipo", "caracter", "imagenBoca", "trazoVideo")',
    'CAMPOS_ALFABETO = ("tipo", "caracter", "imagenBoca")',
    "lista blanca del alfabeto",
)

gen = reemplazar_una(
    gen,
    '''def ruta_media(valor: object) -> str:\n    """Acepta solo rutas locales de LSPedia o URL http/https."""\n    valor = texto(valor)\n    if not valor:\n        return ""\n    if valor.startswith(("img/", "./img/", "/img/", "http://", "https://")):\n        return valor\n    return ""\n''',
    '''def ruta_media(valor: object) -> str:\n    """Acepta URL http/https o una ruta local que exista realmente en el repo."""\n    valor = texto(valor)\n    if not valor:\n        return ""\n    if valor.startswith(("http://", "https://")):\n        return valor\n\n    normalizada = valor.replace("\\\\", "/")\n    while normalizada.startswith("./"):\n        normalizada = normalizada[2:]\n    normalizada = normalizada.lstrip("/")\n    if not normalizada.startswith("img/"):\n        return ""\n    if not (ROOT / normalizada).is_file():\n        print(f"ADVERTENCIA: recurso local no encontrado, se omite: {normalizada}")\n        return ""\n    return normalizada\n''',
    "validación de rutas multimedia",
)

gen = gen.replace('            "trazoVideo": ruta_media(fila.get("trazoVideo")),\n', '')
if "trazoVideo" in gen:
    raise SystemExit("Aún queda trazoVideo en generar_alfabetizacion.py")
escribir(gen_path, gen)


# ---------------------------------------------------------------------------
# 2) El validador adopta el contrato nuevo y comprueba imagenBoca local.
# ---------------------------------------------------------------------------
val_path = "scripts/validar_alfabetizacion.py"
val = leer(val_path)
val = reemplazar_una(
    val,
    '        permitidos = {"tipo", "caracter", "imagenBoca", "trazoVideo"}',
    '        permitidos = {"tipo", "caracter", "imagenBoca"}',
    "campos permitidos del alfabeto",
)

helper = '''\n\ndef ruta_local_media(valor: object) -> Path | None:\n    ruta = texto(valor).replace("\\\\", "/")\n    if not ruta or ruta.startswith(("http://", "https://")):\n        return None\n    while ruta.startswith("./"):\n        ruta = ruta[2:]\n    ruta = ruta.lstrip("/")\n    if not ruta.startswith("img/"):\n        return None\n    return ROOT / ruta\n'''
if "def ruta_local_media" not in val:
    marcador = '''def texto(valor: object) -> str:\n    return "" if valor is None else str(valor).strip()\n'''
    if marcador not in val:
        raise SystemExit("No se encontró dónde insertar ruta_local_media().")
    val = val.replace(marcador, marcador + helper, 1)

viejo_check = '''        if not texto(fila.get("imagenBoca")):\n            advertencias.append(f"Alfabeto #{i} ({caracter}): sin imagenBoca.")\n'''
nuevo_check = '''        imagen_boca = texto(fila.get("imagenBoca"))\n        if not imagen_boca:\n            advertencias.append(f"Alfabeto #{i} ({caracter}): sin imagenBoca.")\n        else:\n            local = ruta_local_media(imagen_boca)\n            if local is not None and not local.is_file():\n                errores.append(f"Alfabeto #{i} ({caracter}): imagenBoca local no existe: {imagen_boca}")\n'''
val = reemplazar_una(val, viejo_check, nuevo_check, "comprobación de imagenBoca")
if "trazoVideo" in val:
    raise SystemExit("Aún queda trazoVideo en validar_alfabetizacion.py")
escribir(val_path, val)


# ---------------------------------------------------------------------------
# 3) Limpia el JSON activo y su respaldo. Si una imagenBoca local no existe,
#    se deja vacía en vez de publicar una referencia rota.
# ---------------------------------------------------------------------------
def normalizar_media_existente(valor: object) -> str:
    s = "" if valor is None else str(valor).strip()
    if not s:
        return ""
    if s.startswith(("http://", "https://")):
        return s
    s = s.replace("\\", "/")
    while s.startswith("./"):
        s = s[2:]
    s = s.lstrip("/")
    return s if s.startswith("img/") and (ROOT / s).is_file() else ""


def limpiar_json(path: str, actualizar_boca_desde_repo: bool = False) -> None:
    ruta = ROOT / path
    datos = json.loads(ruta.read_text(encoding="utf-8"))
    alfabeto = datos.get("alfabeto", []) if isinstance(datos, dict) else []
    for fila in alfabeto:
        if not isinstance(fila, dict):
            continue
        fila.pop("trazoVideo", None)
        if actualizar_boca_desde_repo:
            caracter = str(fila.get("caracter", "")).strip()
            candidatos = [
                f"img/alfabetizacion/boca/{caracter}.webm",
                f"img/alfabetizacion/boca/{caracter}.mp4",
                f"img/alfabetizacion/boca/{caracter}.png",
                f"img/alfabetizacion/boca/{caracter}.webp",
                f"img/alfabetizacion/boca/{caracter}.jpg",
            ]
            fila["imagenBoca"] = next((p for p in candidatos if (ROOT / p).is_file()), "")
        else:
            fila["imagenBoca"] = normalizar_media_existente(fila.get("imagenBoca"))
    ruta.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


limpiar_json("data/alfabetizacion.json")
limpiar_json("data/alfabetizacion-mock.json", actualizar_boca_desde_repo=True)


# ---------------------------------------------------------------------------
# 4) Corrige documentación interna obsoleta de alfabetizacion.js.
# ---------------------------------------------------------------------------
js_path = "js/alfabetizacion.js"
js = leer(js_path)
js = js.replace(
    '     img/alfabetizacion/boca/{CARACTER}.png                              (fonética, sí viene del Sheet -> campo imagenBoca)',
    '     img/alfabetizacion/boca/{CARACTER}.webm                             (fonética; la ruta viene del Sheet -> imagenBoca)',
)
js = reemplazar_una(
    js,
    '''        // Los números 0-19 se pronuncian como palabra (ej. 13 = TRECE), así que\n        // la fonética se arma reutilizando la boca de cada letra de la palabra\n        // (img/alfabetizacion/boca/{LETRA}.png), no una imagen por número.\n''',
    '''        // Los números 0-19 se pronuncian completos mediante su propio recurso\n        // de imagenBoca (ej. 13 -> img/alfabetizacion/boca/13.webm). Este mapa\n        // solo se usa para los juegos que necesitan la palabra escrita del número.\n''',
    "comentario de fonética de números",
)
escribir(js_path, js)


# ---------------------------------------------------------------------------
# 5) JS del cascarón cambió: nueva versión PWA.
# ---------------------------------------------------------------------------
sw_path = "sw.js"
sw = leer(sw_path)
sw = reemplazar_una(
    sw,
    'const VERSION_APP = "v62";',
    'const VERSION_APP = "v63";',
    "versión del Service Worker",
)
escribir(sw_path, sw)

print("Alfabetización limpiada: contrato sin trazoVideo, fallback actualizado y rutas locales saneadas.")
