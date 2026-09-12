#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def reemplazar(ruta_rel, viejo, nuevo, cantidad=1):
    ruta = ROOT / ruta_rel
    texto = ruta.read_text(encoding='utf-8')
    encontradas = texto.count(viejo)
    if encontradas != cantidad:
        raise SystemExit(
            f'ERROR {ruta_rel}: se esperaban {cantidad} coincidencias y se encontraron {encontradas}. '
            'No se aplicó un reemplazo inseguro.'
        )
    ruta.write_text(texto.replace(viejo, nuevo, cantidad), encoding='utf-8', newline='\n')


# ---------------------------------------------------------------------------
# 1) Vocabulario vuelve a exigir video en el validador.
# ---------------------------------------------------------------------------
reemplazar(
    'scripts/validar_lspedia.py',
    '''    sin_imagen = 0\n    sin_definicion = 0\n    con_video = 0\n    visuales_sin_video = 0\n''',
    '''    sin_imagen = 0\n    sin_definicion = 0\n    con_video = 0\n'''
)

reemplazar(
    'scripts/validar_lspedia.py',
    '''        if video:\n            con_video += 1\n            if _youtube_id(video) is None:\n                informe.error(\n                    f"Vocabulario #{i} ({palabra}): referencia de YouTube no reconocida: {video!r}."\n                )\n        else:\n            # Una ficha sin video sí es válida cuando ya ofrece comprensión\n            # visual: concepto + imagen. QuizV2 no la usa porque filtra video.\n            if not definicion or not imagen:\n                informe.error(\n                    f"Vocabulario #{i} ({palabra}): sin video debe tener definición e imagen para ser consultable."\n                )\n            else:\n                visuales_sin_video += 1\n''',
    '''        if not video:\n            informe.error(\n                f"Vocabulario #{i} ({palabra}): falta video. "\n                "Vocabulario solo publica fichas con video de señas."\n            )\n        else:\n            con_video += 1\n            if _youtube_id(video) is None:\n                informe.error(\n                    f"Vocabulario #{i} ({palabra}): referencia de YouTube no reconocida: {video!r}."\n                )\n'''
)

reemplazar(
    'scripts/validar_lspedia.py',
    '''        informe.aviso(\n            f"Vocabulario: {sin_definicion} palabra(s) con video todavía no tienen definición. "\n            "Las fichas visuales nuevas sin video sí requieren definición e imagen."\n        )\n''',
    '''        informe.aviso(\n            f"Vocabulario: {sin_definicion} palabra(s) con video todavía no tienen definición. "\n            "La definición es apoyo textual; el video sigue siendo obligatorio."\n        )\n'''
)

reemplazar(
    'scripts/validar_lspedia.py',
    '''    informe.dato(\n        f"Vocabulario: {len(filas)} fichas consultables, {con_video} con video para Quiz, "\n        f"{visuales_sin_video} visuales sin video, "\n        f"{len(set(_texto(x.get('categoria')) for x in filas))} categorías."\n    )\n''',
    '''    informe.dato(\n        f"Vocabulario: {len(filas)} fichas con video de señas, {con_video} validadas, "\n        f"{len(set(_texto(x.get('categoria')) for x in filas))} categorías."\n    )\n'''
)

# ---------------------------------------------------------------------------
# 2) La capa bilingüe conserva conceptos/aliases ingleses SOLO en Diccionario.
#    La interfaz puede seguir teniendo selector ES/EN, pero Vocabulario no se
#    convierte en un diccionario bilingüe ni modifica sus fichas de señas.
# ---------------------------------------------------------------------------
reemplazar(
    'js/i18n.js',
    '''    function aplicarDatos(){\n        if(window.App && Array.isArray(window.App.datos)) aplicarColeccion(window.App.datos, MAPA_DICC);\n        if(window.QuizV2 && typeof window.QuizV2.obtenerBanco === 'function'){\n            try { aplicarColeccion(window.QuizV2.obtenerBanco(), MAPA_VOCAB); } catch(_e) {}\n        }\n    }\n''',
    '''    function aplicarDatos(){\n        // Los conceptos bilingües pertenecen al Diccionario. Vocabulario\n        // conserva su banco original de videos de señas sin aliases ni\n        // definiciones inglesas inyectadas en los registros.\n        if(window.App && Array.isArray(window.App.datos)) aplicarColeccion(window.App.datos, MAPA_DICC);\n    }\n'''
)

reemplazar(
    'js/i18n.js',
    '''        setPlaceholder('buscar','Buscar palabra y significado','Search a Spanish word or type in English');\n        setPlaceholder('buscarCategorias','Buscar vocabulario','Search vocabulary in Spanish or English');\n''',
    '''        setPlaceholder('buscar','Buscar palabra y significado','Search a Spanish word or type in English');\n        setPlaceholder('buscarCategorias','Buscar vocabulario','Search sign vocabulary');\n'''
)

reemplazar(
    'js/i18n.js',
    '''        const mapa = root === document.getElementById('resultado') ? MAPA_DICC : new Map([...MAPA_DICC, ...MAPA_VOCAB]);\n        const tr = mapa.get(norm(titulo.textContent));\n''',
    '''        const esDiccionario = root === document.getElementById('resultado') ||\n            root === document.getElementById('resultadoCategoriasDiccionario');\n        const tr = esDiccionario ? MAPA_DICC.get(norm(titulo.textContent)) : null;\n'''
)

reemplazar(
    'js/i18n.js',
    '''        const esVocab = params.get('fuente') === 'vocabulario' || params.get('vista') === 'vocabulario';\n        try {\n            if(esVocab && typeof window.mostrarPalabraVocabularioPorReferencia === 'function'){\n                window.mostrarPalabraVocabularioPorReferencia(ref);\n            } else if(typeof window.mostrarPalabraPorNombre === 'function'){\n                window.mostrarPalabraPorNombre(ref);\n            }\n        } catch(_e) {}\n''',
    '''        const esVocab = params.get('fuente') === 'vocabulario' || params.get('vista') === 'vocabulario';\n        if(esVocab) return;\n        try {\n            if(typeof window.mostrarPalabraPorNombre === 'function'){\n                window.mostrarPalabraPorNombre(ref);\n            }\n        } catch(_e) {}\n'''
)

reemplazar(
    'js/i18n.js',
    '''        // Quiz/Vocabulario finishes loading asynchronously. Poll briefly so\n        // English aliases are attached as soon as that bank becomes available.\n        let intentos = 0;\n        const timer = setInterval(() => {\n            intentos += 1;\n            aplicarDatos();\n            if((window.QuizV2 && typeof window.QuizV2.obtenerBanco === 'function' && window.QuizV2.obtenerBanco().length) || intentos >= 20){\n                clearInterval(timer);\n                programarAplicacion();\n            }\n        }, 500);\n''',
    '''        // No se espera ni se modifica el banco de Vocabulario: la capa\n        // bilingüe de conceptos trabaja únicamente con el Diccionario.\n'''
)

reemplazar(
    'js/i18n.js',
    '''        traduccionIngles: (palabra) => MAPA_DICC.get(norm(palabra)) || MAPA_VOCAB.get(norm(palabra)) || null\n''',
    '''        traduccionIngles: (palabra) => MAPA_DICC.get(norm(palabra)) || null\n'''
)

# i18n-auto: ignora traducciones automáticas cuya fuente sea Vocabulario.
reemplazar(
    'js/i18n-auto.js',
    '''            const fuente = norm(item.fuente) === 'vocabulario' ? 'vocabulario' : 'diccionario';\n            const traduccion = {\n''',
    '''            if(norm(item.fuente) === 'vocabulario') return;\n            const fuente = 'diccionario';\n            const traduccion = {\n'''
)

reemplazar(
    'js/i18n-auto.js',
    '''        return mapas.diccionario.palabra.get(clavePalabra) ||\n            mapas.vocabulario.palabra.get(clavePalabra) ||\n            null;\n''',
    '''        return mapas.diccionario.palabra.get(clavePalabra) || null;\n'''
)

reemplazar(
    'js/i18n-auto.js',
    '''        if(window.App && Array.isArray(window.App.datos)){\n            aplicarColeccion(window.App.datos, 'diccionario');\n        }\n        aplicarColeccion(bancoVocabulario(), 'vocabulario');\n        etiquetarResultado(document.getElementById('resultado'));\n        etiquetarResultado(document.getElementById('resultadoCategorias'));\n        etiquetarResultado(document.getElementById('resultadoCategoriasDiccionario'));\n''',
    '''        if(window.App && Array.isArray(window.App.datos)){\n            aplicarColeccion(window.App.datos, 'diccionario');\n        }\n        etiquetarResultado(document.getElementById('resultado'));\n        etiquetarResultado(document.getElementById('resultadoCategoriasDiccionario'));\n'''
)

reemplazar(
    'js/i18n-auto.js',
    '''        const esVocab = params.get('fuente') === 'vocabulario' || params.get('vista') === 'vocabulario';\n        try {\n            if(esVocab && typeof window.mostrarPalabraVocabularioPorReferencia === 'function'){\n                window.mostrarPalabraVocabularioPorReferencia(ref);\n            } else if(typeof window.mostrarPalabraPorNombre === 'function'){\n                window.mostrarPalabraPorNombre(ref);\n            }\n        } catch(_e) {}\n''',
    '''        const esVocab = params.get('fuente') === 'vocabulario' || params.get('vista') === 'vocabulario';\n        if(esVocab) return;\n        try {\n            if(typeof window.mostrarPalabraPorNombre === 'function'){\n                window.mostrarPalabraPorNombre(ref);\n            }\n        } catch(_e) {}\n'''
)

reemplazar(
    'js/i18n-auto.js',
    '''        let intentos = 0;\n        const timer = setInterval(() => {\n            intentos += 1;\n            programar();\n            if(bancoVocabulario().length || intentos >= 20) clearInterval(timer);\n        }, 500);\n''',
    '''        // Vocabulario no participa de esta capa bilingüe de conceptos.\n'''
)

# ---------------------------------------------------------------------------
# 3) Cambió el shell JS: fuerza una caché nueva de la PWA.
# ---------------------------------------------------------------------------
reemplazar('sw.js', 'const VERSION_APP = "v101";', 'const VERSION_APP = "v102";')

print('Reglas Diccionario/Vocabulario e i18n ajustadas correctamente.')
