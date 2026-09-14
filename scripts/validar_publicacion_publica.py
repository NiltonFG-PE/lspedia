#!/usr/bin/env python3
"""Valida la regla pública de LSPedia y resume estadísticas reales.

Regla vigente:
- Diccionario requiere palabra + definición + categoría + imagen real.
- Vocabulario requiere palabra + categoría + imagen real.
- El video es opcional para publicación pública; Lo nuevo sí exige video.
- El banco interno del Quiz puede seguir exigiendo video, pero nunca define
  qué contenido es público ni sus estadísticas.
- security.js protege entorno/anti-clon; no decide publicación ni estadísticas.
"""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
IMAGEN_RE = re.compile(r"\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$", re.I)
PREFIJO_RE = re.compile(r"^(?:https?://|/|\.\.?/|img/)", re.I)


def texto(valor):
    return str(valor or "").strip()


def imagen_real(valor):
    principal = texto(valor).split(",", 1)[0].strip()
    return bool(principal and PREFIJO_RE.search(principal) and IMAGEN_RE.search(principal))


def video_valido(valor):
    return bool(texto(valor))


def cargar(nombre):
    path = ROOT / "data" / nombre
    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    if not isinstance(data, list):
        raise ValueError(f"{nombre} debe contener una lista JSON")
    return data


def publicables(lista, requiere_definicion=False):
    return [
        item for item in lista
        if isinstance(item, dict)
        and texto(item.get("palabra"))
        and (not requiere_definicion or texto(item.get("definicion")))
        and texto(item.get("categoria"))
        and imagen_real(item.get("imagen"))
    ]


def claves_duplicadas(lista):
    vistos = set()
    duplicados = set()
    for item in lista:
        if not isinstance(item, dict):
            continue
        clave = texto(item.get("palabra")).casefold()
        if not clave:
            continue
        if clave in vistos:
            duplicados.add(clave)
        vistos.add(clave)
    return duplicados


def resumen(nombre, lista, requiere_definicion=False):
    pub = publicables(lista, requiere_definicion)
    categorias = {texto(x.get("categoria")).casefold() for x in pub if texto(x.get("categoria"))}
    videos = sum(1 for x in pub if video_valido(x.get("video")))
    sin_video = len(pub) - videos
    print(
        f"{nombre}: total={len(lista)} | públicos={len(pub)} | "
        f"categorías públicas={len(categorias)} | con video={videos} | sin video={sin_video}"
    )
    return pub, categorias, videos


def validar_integracion_frontend():
    modulo = ROOT / "js" / "vocabulario-publico.js"
    cargador = ROOT / "js" / "mejoras-producto.js"
    security = ROOT / "js" / "security.js"
    script = ROOT / "js" / "script.js"
    lo_nuevo = ROOT / "js" / "lo-nuevo.js"
    buscador_visual = ROOT / "js" / "buscador-visual.js"
    sw = ROOT / "sw.js"

    for path in (modulo, cargador, security, script, lo_nuevo, buscador_visual, sw):
        if not path.exists():
            raise AssertionError(f"Falta archivo requerido: {path.relative_to(ROOT)}")

    texto_modulo = modulo.read_text(encoding="utf-8")
    texto_cargador = cargador.read_text(encoding="utf-8")
    texto_security = security.read_text(encoding="utf-8")
    texto_script = script.read_text(encoding="utf-8")
    texto_lo_nuevo = lo_nuevo.read_text(encoding="utf-8")
    texto_buscador_visual = buscador_visual.read_text(encoding="utf-8")
    texto_sw = sw.read_text(encoding="utf-8")

    requeridos_modulo = [
        "window.obtenerBancoHoja2 = obtener",
        "esImagenReal",
        "data/vocabulario.json",
        "_fuenteLspedia: 'vocabulario'",
    ]
    faltantes = [x for x in requeridos_modulo if x not in texto_modulo]
    if faltantes:
        raise AssertionError("vocabulario-publico.js incompleto: " + ", ".join(faltantes))

    if "js/vocabulario-publico.js" not in texto_cargador:
        raise AssertionError("mejoras-producto.js no carga vocabulario-publico.js")
    if '"js/vocabulario-publico.js"' not in texto_sw:
        raise AssertionError("sw.js no cachea vocabulario-publico.js")

    # La fuente de verdad del Diccionario debe vivir en script.js.
    if "function obtenerDatosDiccionarioPublicables(data)" not in texto_script:
        raise AssertionError("script.js perdió el filtro canónico del Diccionario")
    if "String(p.definicion || '').trim()" not in texto_script:
        raise AssertionError("el Diccionario dejó de exigir definición")

    # security.js no debe volver a mezclar seguridad con reglas editoriales.
    prohibidos_security = [
        "QuizV2",
        "LSPediaPublicacionDiccionario",
        "activarReglaPublicacionDiccionarioPorImagen",
        "actualizarEstadisticasPublicadas",
        "obtenerDatosDiccionarioPublicables =",
    ]
    encontrados = [x for x in prohibidos_security if x in texto_security]
    if encontrados:
        raise AssertionError(
            "security.js volvió a mezclar publicación/estadísticas: " + ", ".join(encontrados)
        )

    # Ningún módulo auxiliar puede reemplazar la fuente de verdad del Diccionario.
    if "obtenerDatosDiccionarioPublicables = filtrarConsultablesDiccionario" in texto_buscador_visual:
        raise AssertionError("buscador-visual.js volvió a sobreescribir el filtro público del Diccionario")
    if "texto(p.definicion)" not in texto_buscador_visual or "esImagenReal" not in texto_buscador_visual:
        raise AssertionError("buscador-visual.js perdió la regla estricta de definición + imagen real")

    # Lo nuevo es deliberadamente más estricto: solo contenido con video.
    if "tieneVideoValido" not in texto_lo_nuevo or ".filter(x => x && x.palabra && tieneVideoValido(x.palabra))" not in texto_lo_nuevo:
        raise AssertionError("Lo nuevo dejó de exigir video válido")


def main():
    try:
        diccionario = cargar("palabras.json")
        vocabulario = cargar("vocabulario.json")
        pub_dic, cat_dic, videos_dic = resumen("Diccionario", diccionario, requiere_definicion=True)
        pub_voc, cat_voc, videos_voc = resumen("Vocabulario", vocabulario)
        validar_integracion_frontend()

        print(
            "PUBLICACIÓN REAL: "
            f"palabras={len(pub_dic) + len(pub_voc)} | "
            f"videos={videos_dic + videos_voc} | "
            f"categorías_por_sección={len(cat_dic) + len(cat_voc)}"
        )

        dup_dic = claves_duplicadas(diccionario)
        dup_voc = claves_duplicadas(vocabulario)
        if dup_dic or dup_voc:
            print(
                "AVISO: existen duplicados históricos pendientes de limpieza "
                f"(Diccionario={len(dup_dic)}, Vocabulario={len(dup_voc)})."
            )
        print("Regla pública validada: Diccionario = definición + imagen; video opcional. Lo nuevo mantiene video obligatorio.")
        print("Separación validada: security ≠ publicación ≠ Quiz.")
        return 0
    except Exception as exc:
        print(f"ERROR publicación pública: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
