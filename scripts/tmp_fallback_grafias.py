#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def leer(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def escribir(path: str, contenido: str) -> None:
    (ROOT / path).write_text(contenido, encoding="utf-8", newline="\n")


# ---------------------------------------------------------------------------
# 1) Grafía: si falta un MP4, conservar la PNG correspondiente como poster.
# ---------------------------------------------------------------------------
js_path = "js/alfabetizacion.js"
js = leer(js_path)

viejo = '''    // Pinta el chip activo y carga el video de grafía para el carácter\n    // actual, conservando la velocidad ya elegida. En números no hay\n    // variante que resaltar: solo se carga su único video de grafía.\n    function renderVarianteActiva() {\n        const c = caracterActual();\n        if (!c) return;\n\n        const video = el("alfabTrazoVideo");\n        if (!video) return;\n\n        if (c.tipo === "numero") {\n            video.src = rutaVideoGrafia(c, null);\n            video.playbackRate = CONFIG.VELOCIDADES_TRAZO[estado.aprender.velocidadIndex];\n            video.load();\n            video.play().catch(() => { /* el autoplay puede requerir un gesto del usuario en algunos navegadores */ });\n            return;\n        }\n\n        CONFIG.VARIANTES_TIPO.forEach((v) => {\n            const chip = document.querySelector('[data-alfab-variante="' + v + '"]');\n            if (chip) chip.classList.toggle("active", v === estado.aprender.variante);\n        });\n\n        video.src = rutaVideoGrafia(c, estado.aprender.variante);\n        video.playbackRate = CONFIG.VELOCIDADES_TRAZO[estado.aprender.velocidadIndex];\n        video.load();\n        video.play().catch(() => { /* el autoplay puede requerir un gesto del usuario en algunos navegadores */ });\n    }\n'''

nuevo = '''    // Carga la animación de grafía y deja SIEMPRE la imagen estática\n    // equivalente como poster. Así, si todavía falta un MP4 o falla su carga,\n    // el usuario ve la grafía correcta en vez de una caja vacía.\n    function cargarVideoGrafiaConFallback(video, c, variante) {\n        const poster = rutaImagenGrafia(c, variante);\n        const ruta = rutaVideoGrafia(c, variante);\n\n        video.poster = poster;\n        video.playbackRate = CONFIG.VELOCIDADES_TRAZO[estado.aprender.velocidadIndex];\n        video.onerror = function () {\n            // Quitar el recurso fallido hace que el navegador vuelva a mostrar\n            // el poster. Al cambiar de carácter/variante se asignará un src nuevo.\n            video.pause();\n            video.removeAttribute("src");\n            video.load();\n            video.poster = poster;\n        };\n        video.src = ruta;\n        video.load();\n        video.play().catch(() => { /* autoplay bloqueado o MP4 aún no disponible */ });\n    }\n\n    // Pinta el chip activo y carga el video de grafía para el carácter\n    // actual, conservando la velocidad ya elegida. En números no hay\n    // variante que resaltar: solo se carga su único video de grafía.\n    function renderVarianteActiva() {\n        const c = caracterActual();\n        if (!c) return;\n\n        const video = el("alfabTrazoVideo");\n        if (!video) return;\n\n        if (c.tipo === "numero") {\n            cargarVideoGrafiaConFallback(video, c, null);\n            return;\n        }\n\n        CONFIG.VARIANTES_TIPO.forEach((v) => {\n            const chip = document.querySelector('[data-alfab-variante="' + v + '"]');\n            if (chip) chip.classList.toggle("active", v === estado.aprender.variante);\n        });\n\n        cargarVideoGrafiaConFallback(video, c, estado.aprender.variante);\n    }\n'''

if viejo in js:
    js = js.replace(viejo, nuevo, 1)
elif "function cargarVideoGrafiaConFallback(video, c, variante)" not in js:
    raise SystemExit("No se encontró renderVarianteActiva esperado.")

escribir(js_path, js)


# ---------------------------------------------------------------------------
# 2) Validador permanente: PNG derivada = obligatoria; MP4 = advertencia.
#    Los círculos 16-19 tienen fallback compuesto en la interfaz.
# ---------------------------------------------------------------------------
val_path = "scripts/validar_alfabetizacion.py"
val = leer(val_path)

if "def validar_recursos_derivados" not in val:
    marcador = '''def main() -> int:\n'''
    helper = '''def validar_recursos_derivados(alfabeto: list[dict], errores: list[str], advertencias: list[str]) -> None:\n    variantes = ("mayuscula", "minuscula", "cursiva-mayuscula", "cursiva-minuscula")\n\n    for fila in alfabeto:\n        if not isinstance(fila, dict):\n            continue\n        tipo = texto(fila.get("tipo"))\n        caracter = texto(fila.get("caracter"))\n        if not caracter or tipo not in {"letra", "numero"}:\n            continue\n\n        if tipo == "letra":\n            recursos = [\n                (ROOT / f"img/alfabetizacion/grafias/{caracter}-{variante}.png", True, variante)\n                for variante in variantes\n            ] + [\n                (ROOT / f"img/alfabetizacion/grafias/{caracter}-{variante}.mp4", False, variante)\n                for variante in variantes\n            ]\n        else:\n            recursos = [\n                (ROOT / f"img/alfabetizacion/grafias/{caracter}.png", True, "numero"),\n                (ROOT / f"img/alfabetizacion/grafias/{caracter}.mp4", False, "numero"),\n            ]\n\n        for ruta, obligatoria, variante in recursos:\n            if ruta.is_file():\n                continue\n            relativa = ruta.relative_to(ROOT).as_posix()\n            if obligatoria:\n                errores.append(\n                    f"{tipo.capitalize()} {caracter}: falta imagen estática de grafía ({variante}): {relativa}"\n                )\n            else:\n                advertencias.append(\n                    f"{tipo.capitalize()} {caracter}: falta animación de grafía ({variante}); se usará la PNG: {relativa}"\n                )\n\n        circulo = ROOT / f"img/alfabetizacion/circulo/{caracter}.webp"\n        if not circulo.is_file() and not (tipo == "numero" and caracter in {"16", "17", "18", "19"}):\n            advertencias.append(\n                f"{tipo.capitalize()} {caracter}: falta imagen de seña circular; se usará texto: "\n                f"{circulo.relative_to(ROOT).as_posix()}"\n            )\n\n\n'''
    if marcador not in val:
        raise SystemExit("No se encontró main() en validar_alfabetizacion.py")
    val = val.replace(marcador, helper + marcador, 1)

llamada_marcador = '''    for i, fila in enumerate(ejemplos, 1):\n'''
llamada = '''    validar_recursos_derivados(alfabeto, errores, advertencias)\n\n    for i, fila in enumerate(ejemplos, 1):\n'''
if llamada not in val:
    if llamada_marcador not in val:
        raise SystemExit("No se encontró dónde llamar validar_recursos_derivados().")
    val = val.replace(llamada_marcador, llamada, 1)

escribir(val_path, val)


# ---------------------------------------------------------------------------
# 3) Cambió JS del cascarón: v63 -> v64.
# ---------------------------------------------------------------------------
sw_path = "sw.js"
sw = leer(sw_path)
if 'const VERSION_APP = "v63";' in sw:
    sw = sw.replace('const VERSION_APP = "v63";', 'const VERSION_APP = "v64";', 1)
elif 'const VERSION_APP = "v64";' not in sw:
    raise SystemExit("Versión inesperada de sw.js")
escribir(sw_path, sw)

print("Fallback de grafías y validación de recursos derivados preparados.")
