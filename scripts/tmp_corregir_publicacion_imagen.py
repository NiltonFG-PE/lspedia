#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUSCADOR = ROOT / 'js' / 'buscador-visual.js'
SCRIPT = ROOT / 'js' / 'script.js'
VALIDADOR = ROOT / 'scripts' / 'validar_publicacion_publica.py'


def reemplazar(texto, viejo, nuevo, nombre):
    if viejo not in texto:
        raise SystemExit(f'No se encontró bloque para {nombre}')
    return texto.replace(viejo, nuevo, 1)

b = BUSCADOR.read_text(encoding='utf-8')
b = reemplazar(
    b,
    "   - SOLO Diccionario puede consultar una ficha sin video cuando ya tiene\n     concepto o imagen de apoyo.\n   - Vocabulario permanece video-first: este módulo no amplía su banco ni\n     convierte filas sin video en fichas públicas.\n",
    "   - Diccionario solo consulta fichas públicas: palabra + definición + categoría + imagen real.\n   - El video es opcional para el Diccionario y no sustituye una imagen faltante.\n   - Este módulo mejora la búsqueda, pero nunca redefine la regla pública canónica.\n",
    'comentario de reglas'
)
b = reemplazar(
    b,
    "    function primeraImagen(p){\n        for(const valor of imagenesDeRegistro(p)){\n            if(/^(?:https?:\\/\\/|\\/|\\.\\.?\\/|img\\/)/i.test(valor)) return valor;\n        }\n        return '';\n    }\n    function esConsultableDiccionario(p){\n        if(!p || !texto(p.palabra) || !texto(p.categoria)) return false;\n        return tieneVideo(p) || !!texto(p.definicion) || !!primeraImagen(p);\n    }\n",
    "    function esImagenReal(valor){\n        const imagen = texto(valor);\n        return /^(?:https?:\\/\\/|\\/|\\.\\.?\\/|img\\/)/i.test(imagen) &&\n            /\\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(imagen);\n    }\n    function primeraImagen(p){\n        for(const valor of imagenesDeRegistro(p)){\n            if(esImagenReal(valor)) return valor;\n        }\n        return '';\n    }\n    function esConsultableDiccionario(p){\n        return !!(p && texto(p.palabra) && texto(p.definicion) && texto(p.categoria) && primeraImagen(p));\n    }\n",
    'imagen real y consultable'
)
b = reemplazar(
    b,
    "    function filtrarConsultablesDiccionario(lista){\n        const filtrada = Array.isArray(lista) ? lista.filter(esConsultableDiccionario) : [];\n        return prepararAliases(filtrada);\n    }\n",
    "    function filtrarConsultablesDiccionario(lista){\n        let filtrada = [];\n        try{\n            if(typeof obtenerDatosDiccionarioPublicables === 'function'){\n                filtrada = obtenerDatosDiccionarioPublicables(Array.isArray(lista) ? lista : []);\n            }else{\n                filtrada = Array.isArray(lista) ? lista.filter(esConsultableDiccionario) : [];\n            }\n        }catch(_e){\n            filtrada = Array.isArray(lista) ? lista.filter(esConsultableDiccionario) : [];\n        }\n        return prepararAliases(Array.isArray(filtrada) ? filtrada : []);\n    }\n",
    'delegar filtro canónico'
)
b = reemplazar(
    b,
    "        try{\n            if(typeof obtenerDatosDiccionarioPublicables === 'function'){\n                obtenerDatosDiccionarioPublicables = filtrarConsultablesDiccionario;\n                window.obtenerDatosDiccionarioPublicables = filtrarConsultablesDiccionario;\n            }\n        }catch(_e){}\n",
    "",
    'eliminar sobreescritura del filtro canónico'
)
BUSCADOR.write_text(b, encoding='utf-8')

s = SCRIPT.read_text(encoding='utf-8')
s = s.replace(
    '            // Solo se muestran en la web las palabras que YA tienen video\n            // cargado. Si agregas una palabra nueva en la Hoja 1 y aún no\n            // le pusiste el video, se queda oculta hasta que el campo\n            // "video" tenga algo escrito.\n',
    '            // Regla pública del Diccionario: palabra + definición + categoría + imagen real.\n            // El video es opcional; una descripción de imagen o placeholder NO cuenta como imagen.\n'
)
SCRIPT.write_text(s, encoding='utf-8')

v = VALIDADOR.read_text(encoding='utf-8')
v = reemplazar(
    v,
    "    lo_nuevo = ROOT / \"js\" / \"lo-nuevo.js\"\n    sw = ROOT / \"sw.js\"\n\n    for path in (modulo, cargador, security, script, lo_nuevo, sw):\n",
    "    lo_nuevo = ROOT / \"js\" / \"lo-nuevo.js\"\n    buscador_visual = ROOT / \"js\" / \"buscador-visual.js\"\n    sw = ROOT / \"sw.js\"\n\n    for path in (modulo, cargador, security, script, lo_nuevo, buscador_visual, sw):\n",
    'incluir buscador visual'
)
v = reemplazar(
    v,
    "    texto_lo_nuevo = lo_nuevo.read_text(encoding=\"utf-8\")\n    texto_sw = sw.read_text(encoding=\"utf-8\")\n",
    "    texto_lo_nuevo = lo_nuevo.read_text(encoding=\"utf-8\")\n    texto_buscador_visual = buscador_visual.read_text(encoding=\"utf-8\")\n    texto_sw = sw.read_text(encoding=\"utf-8\")\n",
    'leer buscador visual'
)
marker = "    # Lo nuevo es deliberadamente más estricto: solo contenido con video.\n"
insert = "    # Ningún módulo auxiliar puede reemplazar la fuente de verdad del Diccionario.\n    if \"obtenerDatosDiccionarioPublicables = filtrarConsultablesDiccionario\" in texto_buscador_visual:\n        raise AssertionError(\"buscador-visual.js volvió a sobreescribir el filtro público del Diccionario\")\n    if \"texto(p.definicion)\" not in texto_buscador_visual or \"esImagenReal\" not in texto_buscador_visual:\n        raise AssertionError(\"buscador-visual.js perdió la regla estricta de definición + imagen real\")\n\n"
if marker not in v:
    raise SystemExit('No se encontró marcador del validador')
v = v.replace(marker, insert + marker, 1)
VALIDADOR.write_text(v, encoding='utf-8')

print('Corrección urgente aplicada: buscador visual ya no amplía publicación ni reemplaza el filtro canónico.')
