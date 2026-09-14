#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
GEN = ROOT / 'scripts' / 'generar_alfabetizacion.py'
VAL = ROOT / 'scripts' / 'validar_alfabetizacion.py'
JS = ROOT / 'js' / 'alfabetizacion.js'
SW = ROOT / 'sw.js'


def reemplazar(texto, viejo, nuevo, nombre, count=1):
    if viejo not in texto:
        raise SystemExit(f'No se encontró bloque para {nombre}')
    return texto.replace(viejo, nuevo, count)

# ------------------------------------------------------------
# Generador: publicar en JSON todos los campos visibles/editables
# de la hoja Alfabetización.
# ------------------------------------------------------------
g = GEN.read_text(encoding='utf-8')
g = reemplazar(
    g,
    'CAMPOS_ALFABETO = ("tipo", "caracter", "imagenBoca")',
    'CAMPOS_ALFABETO = (\n'
    '    "tipo", "caracter", "imagenBoca", "trazoVideo", "nombre",\n'
    '    "grafiaMayuscula", "grafiaMinuscula",\n'
    '    "grafiaCursivaMayuscula", "grafiaCursivaMinuscula",\n'
    '    "imagenCirculo", "orden", "grafiaImagen",\n'
    ')',
    'campos alfabeto'
)
g = reemplazar(
    g,
    '        limpio = {\n'
    '            "tipo": tipo,\n'
    '            "caracter": caracter,\n'
    '            "imagenBoca": ruta_media(fila.get("imagenBoca")),\n'
    '        }\n',
    '        limpio = {\n'
    '            "tipo": tipo,\n'
    '            "caracter": caracter,\n'
    '            "imagenBoca": ruta_media(fila.get("imagenBoca")),\n'
    '            "trazoVideo": ruta_media(fila.get("trazoVideo")),\n'
    '            "nombre": texto(fila.get("nombre")),\n'
    '            "grafiaMayuscula": ruta_media(fila.get("grafiaMayuscula")),\n'
    '            "grafiaMinuscula": ruta_media(fila.get("grafiaMinuscula")),\n'
    '            "grafiaCursivaMayuscula": ruta_media(fila.get("grafiaCursivaMayuscula")),\n'
    '            "grafiaCursivaMinuscula": ruta_media(fila.get("grafiaCursivaMinuscula")),\n'
    '            "imagenCirculo": ruta_media(fila.get("imagenCirculo")),\n'
    '            "orden": convertir_orden(fila.get("orden")),\n'
    '            "grafiaImagen": ruta_media(fila.get("grafiaImagen")),\n'
    '        }\n',
    'limpieza alfabeto'
)
GEN.write_text(g, encoding='utf-8')

# ------------------------------------------------------------
# Validador: aceptar el contrato extendido del Sheet.
# ------------------------------------------------------------
v = VAL.read_text(encoding='utf-8')
v = reemplazar(
    v,
    '        permitidos = {"tipo", "caracter", "imagenBoca"}\n',
    '        permitidos = {\n'
    '            "tipo", "caracter", "imagenBoca", "trazoVideo", "nombre",\n'
    '            "grafiaMayuscula", "grafiaMinuscula",\n'
    '            "grafiaCursivaMayuscula", "grafiaCursivaMinuscula",\n'
    '            "imagenCirculo", "orden", "grafiaImagen",\n'
    '        }\n',
    'campos permitidos'
)
# Verificar rutas explícitas que sí llegaron al JSON.
marcador = '        imagen_boca = texto(fila.get("imagenBoca"))\n'
insertar = '''        orden = fila.get("orden")\n        if not isinstance(orden, int):\n            errores.append(f"Alfabeto #{i} ({caracter}): orden debe ser entero.")\n\n        if tipo == "numero" and not texto(fila.get("nombre")):\n            advertencias.append(f"Número {caracter}: sin nombre escrito; los juegos usarán el número como respaldo.")\n\n'''
if marcador not in v:
    raise SystemExit('No se encontró marcador del validador')
v = v.replace(marcador, insertar + marcador, 1)
VAL.write_text(v, encoding='utf-8')

# ------------------------------------------------------------
# Frontend: usar datos del Sheet cuando existan y conservar las
# convenciones antiguas como fallback.
# ------------------------------------------------------------
j = JS.read_text(encoding='utf-8')

j = j.replace(
    '   Estos 4 videos NO vienen del Sheet: se arman por convención de\n'
    '   nombre a partir del carácter + variante activa (ver rutaVideoGrafia\n'
    '   más abajo), para no tener que agregar columnas a la hoja de cálculo.\n',
    '   Los recursos de grafía pueden venir ahora del Sheet. Si una celda está\n'
    '   vacía, se conserva la convención histórica de nombres como respaldo.\n'
)

j = reemplazar(
    j,
    '''    function listaFiltradaPorTipo() {\n        return estado.datos.alfabeto.filter((c) => c.tipo === estado.aprender.tipo);\n    }\n''',
    '''    function listaFiltradaPorTipo() {\n        return estado.datos.alfabeto\n            .filter((c) => c.tipo === estado.aprender.tipo)\n            .slice()\n            .sort((a, b) => {\n                const oa = Number(a && a.orden);\n                const ob = Number(b && b.orden);\n                const va = Number.isFinite(oa) && oa > 0 ? oa : 999999;\n                const vb = Number.isFinite(ob) && ob > 0 ? ob : 999999;\n                return va - vb;\n            });\n    }\n''',
    'orden de caracteres'
)

j = reemplazar(
    j,
    '''    function rutaVideoGrafia(c, variante) {\n        const base = "img/alfabetizacion/grafias/" + encodeURIComponent(c.caracter);\n        if (c.tipo === "numero") return base + ".mp4";\n        return base + "-" + variante + ".mp4";\n    }\n''',
    '''    function rutaVideoGrafia(c, variante) {\n        const mapaCampos = {\n            "mayuscula": "grafiaMayuscula",\n            "minuscula": "grafiaMinuscula",\n            "cursiva-mayuscula": "grafiaCursivaMayuscula",\n            "cursiva-minuscula": "grafiaCursivaMinuscula"\n        };\n        const campo = mapaCampos[variante] || "";\n        const explicita = c && c.tipo === "numero"\n            ? String(c.trazoVideo || "").trim()\n            : String((campo && c && c[campo]) || (variante === "mayuscula" && c ? c.trazoVideo : "") || "").trim();\n        if (explicita) return explicita;\n\n        const base = "img/alfabetizacion/grafias/" + encodeURIComponent(c.caracter);\n        if (c.tipo === "numero") return base + ".mp4";\n        return base + "-" + variante + ".mp4";\n    }\n''',
    'ruta video grafia'
)

j = reemplazar(
    j,
    '''    function rutaImagenGrafia(c, variante) {\n        const base = "img/alfabetizacion/grafias/" + encodeURIComponent(c.caracter);\n        if (c.tipo === "numero") return base + ".png";\n        return base + "-" + variante + ".png";\n    }\n''',
    '''    function rutaImagenGrafia(c, variante) {\n        const explicita = c && c.tipo === "numero"\n            ? String(c.grafiaImagen || "").trim()\n            : "";\n        if (explicita) return explicita;\n\n        const base = "img/alfabetizacion/grafias/" + encodeURIComponent(c.caracter);\n        if (c.tipo === "numero") return base + ".png";\n        return base + "-" + variante + ".png";\n    }\n''',
    'ruta imagen grafia'
)

j = reemplazar(
    j,
    '        cargarImagenSenaConReintento(img, texto, rutaCirculoCaracter(c.caracter), altTexto);\n',
    '        const rutaCirculo = String(c.imagenCirculo || "").trim() || rutaCirculoCaracter(c.caracter);\n'
    '        cargarImagenSenaConReintento(img, texto, rutaCirculo, altTexto);\n',
    'imagen circulo explícita'
)

# Banco dinámico de números: permite 20, 21, 30... desde el Sheet.
marcador_juego = '    // ===========================================================\n    // MÓDULO 2: JUEGO "COMPLETAR LA PALABRA"\n'
helper = '''    function bancoNumerosDesdeDatos(nivelSeleccionado) {\n        const nivelObjetivo = nivelObjetivoJuego(nivelSeleccionado);\n        return (estado.datos.alfabeto || [])\n            .filter((c) => c && c.tipo === "numero" && String(c.caracter || "").trim())\n            .filter((c) => nivelNumeroJuego(c.caracter) === nivelObjetivo)\n            .map((c) => ({\n                palabra: String(c.nombre || CONFIG.PALABRA_NUMERO[c.caracter] || c.caracter).trim(),\n                imagen: null,\n                numero: String(c.caracter),\n                nivel: nivelNumeroJuego(c.caracter)\n            }));\n    }\n\n'''
if marcador_juego not in j:
    raise SystemExit('No se encontró marcador de juegos')
j = j.replace(marcador_juego, helper + marcador_juego, 1)

patron_banco = re.compile(
    r'''        const deNumeros = Object\.keys\(CONFIG\.PALABRA_NUMERO\)\n'''
    r'''            \.filter\(\(n\) => nivelNumeroJuego\(n\) === nivelObjetivoJuego\(nivelSeleccionado\)\)\n'''
    r'''            \.map\(\(n\) => \(\{\n'''
    r'''                palabra: CONFIG\.PALABRA_NUMERO\[n\],\n'''
    r'''                imagen: null,\n'''
    r'''                numero: n,\n'''
    r'''                nivel: nivelNumeroJuego\(n\)\n'''
    r'''            \}\)\);'''
)
j, n = patron_banco.subn('        const deNumeros = bancoNumerosDesdeDatos(nivelSeleccionado);', j)
if n != 2:
    raise SystemExit(f'Se esperaban 2 bancos de números y se reemplazaron {n}')

JS.write_text(j, encoding='utf-8')

# PWA: asegurar que móviles no retengan alfabetizacion.js anterior.
s = SW.read_text(encoding='utf-8')
m = re.search(r'const VERSION_APP = "v(\\d+)";', s)
if not m:
    raise SystemExit('No se encontró VERSION_APP en sw.js')
actual = int(m.group(1))
nuevo = max(actual + 1, 130)
s = s[:m.start()] + f'const VERSION_APP = "v{nuevo}";' + s[m.end():]
SW.write_text(s, encoding='utf-8')

print(f'Alfabetización ampliada para Sheet editable. PWA v{nuevo}.')
